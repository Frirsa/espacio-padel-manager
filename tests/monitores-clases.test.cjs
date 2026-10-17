const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const migration = fs.readFileSync('supabase/migrations/202610170800_monitores_clases.sql','utf8');
const user = '11111111-1111-4111-8111-111111111111';
const alumno = '22222222-2222-4222-8222-222222222222';
const bono = '33333333-3333-4333-8333-333333333333';

async function fixture(t) {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create function auth.uid() returns uuid language sql as $$select coalesce(nullif(current_setting('test.usuario',true),''),'${user}')::uuid$$;
    grant usage on schema auth to authenticated;
    create table clases (id uuid primary key default gen_random_uuid(), fecha date not null,
      hora_inicio time not null, duracion_minutos integer not null, ubicacion_id uuid,
      tipo text not null, estado text not null, facturable boolean default true,
      cobrada boolean default false, importe_club numeric default 0, coste_pista numeric default 0,
      ingreso_extra numeric default 0, modo_cobro text, importe_total numeric,
      motivo_cancelacion text, observaciones text, grupo_id uuid, serie_id uuid);
    create table pagos (id uuid primary key default gen_random_uuid(),clase_id uuid,alumno_id uuid,importe numeric,metodo text,estado text,fecha_pago date);
    create table no_disponibilidades (id uuid primary key default gen_random_uuid(),fecha_inicio date,fecha_fin date,hora_inicio time,hora_fin time,motivo text);
    create table alumnos (id uuid primary key);
    insert into alumnos values ('${alumno}');
    create table clase_alumnos (clase_id uuid references clases(id), alumno_id uuid references alumnos(id),importe numeric,pagado boolean,usa_bono boolean,bono_id uuid,asistio boolean);
    create table bonos (id uuid primary key, clases_restantes integer);
    insert into bonos values ('${bono}',5);
    create table llamadas_atomicas (datos jsonb, participantes jsonb, anterior jsonb, nuevo jsonb);
    grant all on all tables in schema public to authenticated;
  `);
  await db.exec(fs.readFileSync('supabase/migrations/202610060800_clases_puntuales.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/202610061105_cobros_puntuales_realizadas.sql','utf8'));
  // Dobles de las RPC preexistentes: comprobar el contrato y la transacción
  // de la nueva envoltura sin sustituir las reglas vigentes en producción.
  await db.exec(`create function guardar_clase_atomica(p_clase_id uuid,p_datos_clase jsonb,p_participantes jsonb,
    p_uso_anterior jsonb,p_uso_nuevo jsonb,p_metodos_pago jsonb,p_metodo_pago_total text) returns uuid
    language plpgsql as $$declare v uuid; p jsonb; begin
      v := coalesce(p_clase_id,gen_random_uuid());
      insert into llamadas_atomicas values(p_datos_clase,p_participantes,p_uso_anterior,p_uso_nuevo);
      insert into clases(id,fecha,hora_inicio,duracion_minutos,tipo,estado,modo_cobro,importe_total,ubicacion_id)
        values(v,(p_datos_clase->>'fecha')::date,(p_datos_clase->>'hora_inicio')::time,(p_datos_clase->>'duracion_minutos')::int,
          p_datos_clase->>'tipo',p_datos_clase->>'estado',p_datos_clase->>'modo_cobro',(p_datos_clase->>'importe_total')::numeric,(p_datos_clase->>'ubicacion_id')::uuid)
        on conflict(id) do update set estado=excluded.estado;
      delete from clase_alumnos where clase_id=v;
      for p in select value from jsonb_array_elements(p_participantes) loop
        insert into clase_alumnos values(v,(p->>'alumno_id')::uuid,(p->>'importe')::numeric,(p->>'pagado')::boolean,(p->>'usa_bono')::boolean,(p->>'bono_id')::uuid,true);
      end loop;
      update bonos set clases_restantes=clases_restantes-coalesce((p_uso_nuevo->>id::text)::int,0)+coalesce((p_uso_anterior->>id::text)::int,0);
      return v;
    end; $$;
    create function crear_serie_atomica(p_datos_serie jsonb,p_clases jsonb,p_participantes jsonb) returns jsonb
    language plpgsql as $$declare c jsonb; v uuid; ids jsonb := '[]'; begin
      for c in select value from jsonb_array_elements(p_clases) loop
        v := guardar_clase_atomica(null,c,p_participantes,'{}','{}','{}',null);
        ids := ids || jsonb_build_array(jsonb_build_object('id',v,'fecha',c->>'fecha'));
      end loop;
      return jsonb_build_object('serie_id',gen_random_uuid(),'clases',ids);
    end; $$;`);
  await db.exec(migration);
  await db.exec('grant all on all tables in schema public to authenticated; set role authenticated; select preparar_monitores();');
  await db.exec("insert into monitores(nombre) values('Ana'),('Luis')");
  const datos = extra => ({fecha:'2020-10-19',hora_inicio:'09:00',duracion_minutos:60,tipo:'propia',estado:'programada',
    monitor_nombre:'Ana',coste_monitor:20,monitor_pagado:false,coste_pista:12,modo_cobro:'por_alumno',facturable:true,...extra});
  const save = async (extra={}, id=null, participantes=[{alumno_id:alumno,bono_id:bono,usa_bono:true,pagado:true,importe:25}], anterior={}, nuevo={}) => {
    return (await db.query('select guardar_clase_con_monitor($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7) id',
      [id,JSON.stringify(datos(extra)),JSON.stringify(participantes),JSON.stringify(anterior),JSON.stringify(nuevo),'{}','efectivo'])).rows[0].id;
  };
  const get = async id => (await db.query('select * from clases where id=$1',[id])).rows[0];
  return {db,datos,save,get};
}

test('Clases de bono: conservar participantes, consumo y gastos al sustituir al monitor',async t=>{
  const {db,save,get}=await fixture(t);
  const id=await save();
  assert.equal((await get(id)).monitor_nombre,'Ana'); assert.equal(Number((await get(id)).coste_monitor),20);
  assert.equal((await db.query('select clases_restantes from bonos')).rows[0].clases_restantes,5);
  await save({estado:'realizada'},id,undefined,{}, {[bono]:1});
  assert.equal((await db.query('select clases_restantes from bonos')).rows[0].clases_restantes,4);
  await save({estado:'realizada',monitor_nombre:'Luis',coste_monitor:30,monitor_pagado:true,fecha_pago_monitor:'2020-10-20',metodo_pago_monitor:'bizum'},id,undefined,{[bono]:1},{[bono]:1});
  assert.equal((await db.query('select clases_restantes from bonos')).rows[0].clases_restantes,4);
  const ca=(await db.query('select * from clase_alumnos')).rows[0];
  assert.equal(ca.bono_id,bono); assert.equal(ca.usa_bono,true);
  assert.equal((await get(id)).monitor_nombre,'Luis');
  assert.equal((await db.query('select count(*)::int n from pagos')).rows[0].n,0);
});

test('Ausencia personal y coincidencias se comprueban para el monitor elegido y la pista',async t=>{
  const {db,save}=await fixture(t);
  await db.exec("insert into no_disponibilidades(fecha_inicio,fecha_fin) values('2020-10-19','2020-10-25')");
  await assert.rejects(save({monitor_nombre:'Fran'}),/no disponible para Fran/);
  await save();
  await assert.rejects(save(),/monitor o la pista/);
  await save({monitor_nombre:'Luis'});
  const lugar='44444444-4444-4444-8444-444444444444';
  await save({fecha:'2020-11-01',ubicacion_id:lugar,pista_nombre:'Pista 1'});
  await assert.rejects(save({fecha:'2020-11-01',monitor_nombre:'Luis',ubicacion_id:lugar,pista_nombre:'Pista 1'}),/monitor o la pista/);
  await save({fecha:'2020-11-01',monitor_nombre:'Luis',ubicacion_id:lugar,pista_nombre:'Pista 2'});
});

test('El formulario unificado conserva conceptos, céntimos y cobros históricos sin duplicarlos',async t=>{
  const {db,save,get}=await fixture(t);
  const extra={nombre_grupo_libre:'Grupo libre',numero_participantes:2,importe_total:60.75,modo_cobro:'total',estado:'realizada',cobrada:true,fecha_cobro:'2020-10-19'};
  const id=await save(extra,null,[]);
  await save({...extra,coste_monitor:25},id,[]);
  const clase=await get(id); assert.equal(clase.nombre_grupo_libre,'Grupo libre');assert.equal(Number(clase.importe_total),60.75);
  const pagos=(await db.query('select * from pagos')).rows;
  assert.equal(pagos.length,1);assert.equal(Number(pagos[0].importe),60.75);assert.equal(pagos[0].estado,'pagado');
  assert.equal((await db.query('select count(*)::int n from clase_alumnos')).rows[0].n,0);
  await assert.rejects(save({...extra,importe_total:99},id,[{alumno_id:'99999999-9999-4999-8999-999999999999'}]),/foreign key/);
  assert.equal(Number((await get(id)).importe_total),60.75,'El fallo de participantes revierte clase y cobro');
  assert.equal(Number((await db.query('select importe from pagos')).rows[0].importe),60.75);
});

test('El registro importa monitores una vez, conserva inactivos y aísla cuentas',async t=>{
  const {db,save}=await fixture(t);
  await db.exec("update monitores set activo=false where nombre='Ana'; select preparar_monitores()");
  await assert.rejects(save(),/activa el monitor/);
  assert.equal((await db.query("select activo from monitores where nombre='Ana'")).rows[0].activo,false);
  await db.exec("set test.usuario='55555555-5555-4555-8555-555555555555'");
  assert.equal((await db.query('select count(*)::int n from monitores')).rows[0].n,0);
  await db.exec('select preparar_monitores()');
  assert.equal((await db.query('select nombre from monitores')).rows[0].nombre,'Fran');
});

test('Las series guardan monitor y coste en cada clase dentro de una transacción',async t=>{
  const {db,datos}=await fixture(t);
  const clases=[datos(),datos({fecha:'2020-10-26'})];
  const result=(await db.query("select crear_serie_con_monitor('{}',$1::jsonb,'[]') r",[JSON.stringify(clases)])).rows[0].r;
  assert.equal(result.clases.length,2);
  const guardadas=(await db.query('select monitor_nombre,coste_monitor from clases')).rows;
  assert.ok(guardadas.every(c=>c.monitor_nombre==='Ana'&&Number(c.coste_monitor)===20));
  await assert.rejects(db.query("select crear_serie_con_monitor('{}',$1::jsonb,'[]')",[JSON.stringify([datos({fecha:'2020-11-02'}),datos({fecha:'2020-10-26'})])]),/monitor o la pista/);
  assert.equal((await db.query('select count(*)::int n from clases')).rows[0].n,2);
});
