const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const user = '11111111-1111-4111-8111-111111111111';
const alumno = '22222222-2222-4222-8222-222222222222';
const bono = '33333333-3333-4333-8333-333333333333';

async function fixture(t) {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.usuario',true),'')::uuid$$;
    set test.usuario='${user}';
    grant usage on schema auth to authenticated;
    create table clases (id uuid primary key default gen_random_uuid(),fecha date not null,hora_inicio time not null,
      duracion_minutos integer not null,ubicacion_id uuid,tipo text not null,estado text not null,
      facturable boolean default true,cobrada boolean default false,importe_club numeric default 0,coste_pista numeric default 0,
      ingreso_extra numeric default 0,modo_cobro text,importe_total numeric,motivo_cancelacion text,observaciones text,grupo_id uuid,serie_id uuid);
    create table pagos (id uuid primary key default gen_random_uuid(),clase_id uuid references clases(id),alumno_id uuid,
      importe numeric,metodo text,estado text,fecha_pago date,notas text);
    create table no_disponibilidades (fecha_inicio date,fecha_fin date,hora_inicio time,hora_fin time);
    create table alumnos (id uuid primary key);
    insert into alumnos values('${alumno}');
    create table clase_alumnos (clase_id uuid references clases(id),alumno_id uuid references alumnos(id),importe numeric,
      pagado boolean,usa_bono boolean,bono_id uuid,asistio boolean);
    create table bonos (id uuid primary key,numero_clases integer,clases_restantes integer,activo boolean);
    insert into bonos values('${bono}',5,5,true);
    create table series_clases(id uuid primary key default gen_random_uuid(),fecha_inicio date,fecha_fin date,dias_semana integer[],
      hora_inicio time,duracion_minutos integer,ubicacion_id uuid,grupo_id uuid,tipo text,observaciones text);`);
  for (const file of ['202610060800_clases_puntuales.sql','202610061105_cobros_puntuales_realizadas.sql']) {
    await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
  }
  // Definitions captured from the deployed RPCs: exercise real payment and bono logic.
  await db.exec(fs.readFileSync('tests/fixtures/clases-atomicas.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/202610170800_monitores_clases.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/20261027172655_unificar_formulario_clases.sql','utf8'));
  await db.exec('grant all on all tables in schema public to authenticated; set role authenticated; select preparar_monitores();');
  await db.exec("insert into monitores(nombre) values('Ana')");
  const datos=extra=>({fecha:'2020-10-19',hora_inicio:'09:00',duracion_minutos:60,tipo:'propia',estado:'programada',facturable:true,
    monitor_nombre:'Ana',coste_monitor:20,monitor_pagado:false,coste_pista:12,modo_cobro:'total',importe_total:60.75,
    concepto_clase:'Grupo libre',numero_participantes:2,ingreso_extra:5.25,ingreso_extra_concepto:'Propina',...extra});
  const save=async(extra={},id=null,participantes=[],anterior={},nuevo={})=>(await db.query(
    'select guardar_clase_con_monitor($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7) id',
    [id,JSON.stringify(datos(extra)),JSON.stringify(participantes),JSON.stringify(anterior),JSON.stringify(nuevo),'{}','bizum'])).rows[0].id;
  const get=async id=>(await db.query('select * from clases where id=$1',[id])).rows[0];
  return {db,datos,save,get};
}

test('Un concepto con bono conserva consumo e ingreso extra al editar',async t=>{
  const {db,save,get}=await fixture(t);
  const participantes=[{alumno_id:alumno,bono_id:bono,usa_bono:true,pagado:true,importe:26}];
  const extra={concepto_clase:'Clase con invitado',modo_cobro:'por_alumno',importe_total:null,estado:'realizada'};
  const id=await save(extra,null,participantes,{}, {[bono]:1});
  await save(extra,id,participantes,{[bono]:1},{[bono]:1});
  const c=await get(id);assert.equal(c.concepto_clase,'Clase con invitado');assert.equal(c.nombre_grupo_libre,null);
  assert.equal(Number(c.ingreso_extra),5.25);assert.equal(c.ingreso_extra_concepto,'Propina');
  assert.equal((await db.query('select clases_restantes from bonos')).rows[0].clases_restantes,4);
  assert.equal((await db.query('select count(*)::int n from pagos')).rows[0].n,0);
});

test('Sin alumnos: no genera deuda programada y conserva un solo cobro al realizar y editar',async t=>{
  const {db,save,get}=await fixture(t);const id=await save();
  assert.equal((await db.query('select count(*)::int n from pagos')).rows[0].n,0);
  await save({estado:'realizada',cobrada:true,fecha_cobro:'2020-10-20'},id);
  await save({estado:'realizada',cobrada:true,fecha_cobro:'2020-10-20',ingreso_extra:8.5},id);
  const pagos=(await db.query('select * from pagos')).rows;
  assert.equal(pagos.length,1);assert.equal(pagos[0].estado,'pagado');assert.equal(Number(pagos[0].importe),60.75);
  assert.equal(pagos[0].fecha_pago.toISOString().slice(0,10),'2020-10-20');assert.equal((await get(id)).cobrada,true);
  assert.equal(Number((await get(id)).ingreso_extra),8.5);
});

test('Sin alumnos: permite anticipos y retira pendientes al volver a programada',async t=>{
  const {db,save}=await fixture(t);const id=await save({cobrada:true,fecha_cobro:'2020-10-18'});
  assert.equal((await db.query('select estado from pagos')).rows[0].estado,'pagado');
  await save({estado:'realizada',cobrada:false},id);
  assert.equal((await db.query('select estado from pagos')).rows[0].estado,'pendiente');
  await save({estado:'programada',cobrada:false},id);
  assert.equal((await db.query('select count(*)::int n from pagos')).rows[0].n,0);
});

test('Los conceptos sin alumnos admiten series y conservan su vínculo al editar una sesión',async t=>{
  const {db,datos,save,get}=await fixture(t);
  const result=(await db.query('select crear_serie_con_monitor($1::jsonb,$2::jsonb,$3::jsonb) r',[
    JSON.stringify({fecha_inicio:'2020-10-19',fecha_fin:'2020-10-26',dias_semana:[1],hora_inicio:'09:00',duracion_minutos:60,tipo:'propia'}),
    JSON.stringify([datos(),datos({fecha:'2020-10-26'})]),'[]'])).rows[0].r;
  assert.equal(result.clases.length,2);
  const id=result.clases[0].id;assert.equal((await get(id)).concepto_clase,'Grupo libre');
  await save({estado:'realizada',cobrada:false},id);
  assert.equal((await get(id)).serie_id,result.serie_id);
  assert.equal((await db.query('select count(*)::int n from pagos')).rows[0].n,1);
});

test('Las puntuales anteriores guardan extras sin cambiar su precio ni duplicar cobros',async t=>{
  const {db,save,get}=await fixture(t);
  const extra={nombre_grupo_libre:'Grupo anterior',concepto_clase:null,estado:'realizada',cobrada:true};
  const id=await save(extra);await save({...extra,ingreso_extra:9.75},id);
  assert.equal((await get(id)).nombre_grupo_libre,'Grupo anterior');assert.equal(Number((await get(id)).ingreso_extra),9.75);
  const pagos=(await db.query('select importe from pagos')).rows;assert.equal(pagos.length,1);assert.equal(Number(pagos[0].importe),60.75);
});

test('Los guardados incompletos o sin sesión no producen cambios',async t=>{
  const {db,save}=await fixture(t);
  await assert.rejects(save({concepto_clase:'  '}),/concepto/);
  await assert.rejects(save({ingreso_extra:-1}),/ingreso extra/);
  await assert.rejects(save({numero_participantes:0}),/participantes/);
  await db.exec("set test.usuario=''");
  await assert.rejects(save(),/iniciar sesión/);
  assert.equal((await db.query('select count(*)::int n from clases')).rows[0].n,0);
});

test('Cambiar un cobro desde Pagos actualiza la agenda de una clase sin alumnos',async t=>{
 const {db,save,get}=await fixture(t);const id=await save({estado:'realizada',cobrada:false});
 await db.query("update pagos set estado='pagado' where clase_id=$1",[id]);assert.equal((await get(id)).cobrada,true);
 await db.query("update pagos set estado='pendiente' where clase_id=$1",[id]);assert.equal((await get(id)).cobrada,false);
});

test('Una serie sin alumnos permite registrar sus anticipos sin crear pendientes',async t=>{
 const {db,datos}=await fixture(t);
 await db.query('select crear_serie_con_monitor($1::jsonb,$2::jsonb,$3::jsonb)',[
 JSON.stringify({fecha_inicio:'2020-10-19',fecha_fin:'2020-10-26',dias_semana:[1],hora_inicio:'09:00',duracion_minutos:60,tipo:'propia'}),
 JSON.stringify([datos({cobrada:true,fecha_cobro:'2020-10-18',metodo_cobro:'bizum'}),datos({fecha:'2020-10-26',cobrada:true,fecha_cobro:'2020-10-18',metodo_cobro:'bizum'})]),'[]']);
 const pagos=(await db.query('select estado,importe,metodo from pagos')).rows;
 assert.equal(pagos.length,2);assert.ok(pagos.every(p=>p.estado==='pagado'&&Number(p.importe)===60.75&&p.metodo==='bizum'));
});
