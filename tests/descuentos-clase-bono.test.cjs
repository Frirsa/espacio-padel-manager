const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { PGlite } = require('@electric-sql/pglite');
const economia = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/economia.ts','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText, { exports: economia });
const bono='33333333-3333-4333-8333-333333333333';
const clase='44444444-4444-4444-8444-444444444444';
const otra='55555555-5555-4555-8555-555555555555';
const cobro='66666666-6666-4666-8666-666666666666';
async function fixture(t) {
  const db=new PGlite(); t.after(()=>db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
    set test.uid='11111111-1111-4111-8111-111111111111';
    create table bonos(id uuid primary key,numero_clases integer,clases_restantes integer,importe_pagado numeric,estado_cobro text);
    create table clases(id uuid primary key,fecha date,estado text,tipo text,modo_cobro text);
    create table clase_alumnos(id uuid primary key default gen_random_uuid(),clase_id uuid references clases(id),
      alumno_id uuid,bono_id uuid references bonos(id),usa_bono boolean,importe numeric,asistio boolean);
    create table bono_cobros(id uuid primary key,bono_id uuid references bonos(id) on delete cascade,importe numeric check(importe>=0),estado text);
    insert into bonos values('${bono}',10,9,340,'pagado');
    insert into clases values('${clase}','2026-10-30','realizada','propia','por_alumno'),('${otra}','2026-11-06','programada','propia','por_alumno');
    insert into clase_alumnos(clase_id,alumno_id,bono_id,usa_bono,importe,asistio)
      select c.id,a.id,'${bono}',true,17,a.id::text like 'a%' from clases c cross join
      (values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid)) a(id);
    insert into bono_cobros values('${cobro}','${bono}',340,'pagado');`);
  await db.exec(fs.readFileSync('supabase/migrations/20261030132611_descuentos_clase_bono.sql','utf8'));
  const guardar=(d=3,old=0,c=null,id=clase)=>db.query('select guardar_descuento_clase_bono($1,$2,$3,$4,$5,$6)',[id,bono,d,'Solo asiste un alumno',c,old]);
  const get=async()=>(await db.query('select * from bonos')).rows[0];
  const pago=async()=>Number((await db.query('select importe from bono_cobros where id=$1',[cobro])).rows[0].importe);
  return {db,guardar,get,pago};
}
test('340 → 337: cambia solo el beneficio de la primera clase y conserva una sesión consumida',async t=>{
  const {db,guardar,get,pago}=await fixture(t);await guardar();const b=await get();
  assert.equal(Number(b.importe_pagado),337);assert.equal(b.clases_restantes,9);assert.equal(await pago(),340);
  assert.equal(economia.precioOriginalBono(b),340);
  const datos=(await db.query('select * from clase_alumnos order by alumno_id')).rows;
  const hoy=economia.recalcularImportesBonos({id:clase,tipo:'propia',estado:'realizada',coste_pista:6,clase_alumnos:datos.filter(x=>x.clase_id===clase)},[b]);
  const proxima=economia.recalcularImportesBonos({id:otra,tipo:'propia',estado:'realizada',coste_pista:6,clase_alumnos:datos.filter(x=>x.clase_id===otra)},[b]);
  assert.equal(economia.calcularEconomiaClase(hoy).resultado,25);
  assert.equal(economia.calcularEconomiaClase(proxima).resultado,28);
  assert.equal(datos.filter(x=>x.clase_id===clase).reduce((s,p)=>s+Number(p.importe),0),31);
  assert.equal(hoy.clase_alumnos.filter(x=>x.asistio).length,1);
  assert.equal(b.ajustes_clase[clase].motivo,'Solo asiste un alumno');
});
test('Cobro ya rebajado: corrige el elegido una vez, permite editar y retirar el descuento',async t=>{
  const {guardar,get,pago}=await fixture(t);
  await guardar(3,0,cobro);assert.equal(await pago(),337);
  await guardar(3,3,cobro);assert.equal(await pago(),337);
  await guardar(4,3,cobro);assert.equal(await pago(),336);assert.equal(Number((await get()).importe_pagado),336);
  await guardar(0,4,null);assert.equal(await pago(),340);assert.equal(Number((await get()).importe_pagado),340);
  assert.deepEqual((await get()).ajustes_clase,{});
});
test('Conservar cobros tras corregirlos restaura el efectivo registrado',async t=>{
  const {guardar,pago,get}=await fixture(t);await guardar(3,0,cobro);await guardar(3,3,null);
  assert.equal(await pago(),340);assert.equal(Number((await get()).importe_pagado),337);
});
test('Rechaza importes inválidos, clases futuras, ausencia de sesión y guardados desactualizados sin cambios parciales',async t=>{
  const {db,guardar,get,pago}=await fixture(t);
  for (const d of [-1,34.01,0.001,NaN,Infinity]) await assert.rejects(guardar(d));
  await assert.rejects(guardar(3,0,null,otra),/realizada/);
  await guardar(3,0,cobro);await assert.rejects(guardar(4,0,cobro),/ha cambiado/);
  await db.exec("set test.uid=''");await assert.rejects(guardar(3,3),/iniciar sesión/);
  assert.equal(Number((await get()).importe_pagado),337);assert.equal(await pago(),337);
});
test('Reparto exacto en céntimos y varios descuentos del mismo bono',async t=>{
  const {db,guardar,get}=await fixture(t);await guardar(3.01);
  await db.query("update clases set estado='realizada' where id=$1",[otra]);
  await guardar(2,0,null,otra);const b=await get();assert.equal(Number(b.importe_pagado),334.99);
  assert.equal(economia.precioSesionBono(b,clase),30.99);assert.equal(economia.precioSesionBono(b,otra),32);
  assert.equal(economia.precioSesionBono(b),34);
  const precios=(await db.query('select importe from clase_alumnos where clase_id=$1 order by alumno_id',[clase])).rows.map(x=>Number(x.importe));
  assert.deepEqual(precios,[15.5,15.49]);
});
test('Editar y reemplazar participantes conserva el descuento; impide cancelar o borrar sin retirarlo',async t=>{
  const {db,guardar}=await fixture(t);await guardar();
  await db.exec(`begin; update clases set fecha='2026-10-31' where id='${clase}';
    delete from clase_alumnos where clase_id='${clase}';
    insert into clase_alumnos(clase_id,alumno_id,bono_id,usa_bono,importe,asistio)
    values('${clase}','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${bono}',true,99,true); commit;`);
  assert.equal(Number((await db.query('select importe from clase_alumnos where clase_id=$1',[clase])).rows[0].importe),31);
  await assert.rejects(db.query("update clases set estado='cancelada' where id=$1",[clase]),/Retira primero/);
  assert.equal((await db.query('select estado from clases where id=$1',[clase])).rows[0].estado,'realizada');
  await assert.rejects(db.exec(`begin; delete from clase_alumnos where clase_id='${clase}'; delete from clases where id='${clase}'; commit;`),/Retira primero/);
  await db.exec('rollback');
});
test('Restaurar una copia conserva ajustes, cobros y reparto de las sesiones',async t=>{
  const {db,guardar,get,pago}=await fixture(t);await guardar(3,0,cobro);
  const copia={};
  for(const tabla of ['bonos','clases','bono_cobros','clase_alumnos']) copia[tabla]=(await db.query(`select * from ${tabla}`)).rows;
  await db.exec('delete from bono_cobros; delete from clase_alumnos; delete from bonos; delete from clases;');
  for(const tabla of ['bonos','clases','bono_cobros','clase_alumnos']) {
    await db.query(`insert into ${tabla} select * from jsonb_populate_recordset(null::${tabla},$1::jsonb)`,[JSON.stringify(copia[tabla])]);
  }
  assert.equal(Number((await get()).importe_pagado),337);assert.equal(await pago(),337);
  assert.equal((await get()).ajustes_clase[clase].descuento,3);
  assert.equal(Number((await db.query('select sum(importe) total from clase_alumnos where clase_id=$1',[clase])).rows[0].total),31);
});
