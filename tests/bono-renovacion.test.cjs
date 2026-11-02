const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { PGlite } = require('@electric-sql/pglite');
const helpers = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/bonoRenovacion.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports: helpers });
const bono = '33333333-3333-4333-8333-333333333333';
const alumno = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const otro = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const datos = { alumno_id: alumno, grupo_id: null, numero_clases: 10, clases_restantes: 10,
  importe_pagado: 340, fecha_compra: '2026-11-02', activo: true, estado_cobro: 'pendiente' };
const cobros = [{ alumno_id: null, importe: 340, estado: 'pendiente' }];
async function fixture(t) {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
    set test.uid='11111111-1111-4111-8111-111111111111';
    create table bonos(id uuid primary key default gen_random_uuid(), alumno_id uuid, grupo_id uuid,
      numero_clases integer, clases_restantes integer, importe_pagado numeric,
      fecha_compra date, activo boolean, estado_cobro text, metodo_cobro text, fecha_cobro date,
      ajustes_clase jsonb not null default '{}'::jsonb);
    create table bono_alumnos(id uuid primary key default gen_random_uuid(), bono_id uuid references bonos(id), alumno_id uuid);
    create table bono_cobros(id uuid primary key default gen_random_uuid(), bono_id uuid references bonos(id),
      alumno_id uuid, importe numeric, estado text, metodo_cobro text, fecha_cobro date);
    insert into bonos(id,alumno_id,numero_clases,clases_restantes,importe_pagado,activo,estado_cobro,ajustes_clase)
      values('${bono}','${alumno}',10,0,337,false,'pagado','{"clase":{"descuento":3}}');
    insert into bono_cobros(bono_id,importe,estado) values('${bono}',337,'pagado');`);
  await db.exec(fs.readFileSync('supabase/migrations/20261102143658_renovacion_bonos.sql', 'utf8'));
  const renovar = (d=datos, c=cobros, autorizados=[alumno,otro]) => db.query(
    'select renovar_bono($1,$2::jsonb,$3::uuid[],$4::jsonb) id', [bono,JSON.stringify(d),autorizados,JSON.stringify(c)]);
  return { db, renovar };
}
test('Agotados inactivos siguen pendientes; solo una clase activa produce aviso previo', () => {
  assert.equal(helpers.pendienteRenovacion({activo:false,clases_restantes:0}),true);
  for (const resolucion_renovacion of ['cerrado','renovado'])
    assert.equal(helpers.pendienteRenovacion({activo:false,clases_restantes:0,resolucion_renovacion}),false);
  assert.equal(helpers.proximoAgotarse({activo:true,clases_restantes:1}),true);
  assert.equal(helpers.proximoAgotarse({activo:false,clases_restantes:1}),false);
  assert.equal(helpers.proximoAgotarse({activo:true,clases_restantes:2}),false);
});
test('Última clase excluye programadas y canceladas no facturables', () => {
  const uso = (fecha,estado,facturable=true) => ({usa_bono:true,clases:{fecha,estado,facturable}});
  assert.equal(helpers.ultimaClaseBono([uso('2026-10-30','realizada'),uso('2026-12-01','programada'),
    uso('2026-11-01','cancelada',false),uso('2026-10-31','cancelada')]),'2026-10-31');
});
test('Renovar conserva descuentos y cobro anteriores, repone clases y crea un pago conjunto pendiente', async t => {
  const {db,renovar}=await fixture(t); const id=(await renovar()).rows[0].id;
  const anterior=(await db.query('select * from bonos where id=$1',[bono])).rows[0];
  const nuevo=(await db.query('select * from bonos where id=$1',[id])).rows[0];
  assert.equal(anterior.resolucion_renovacion,'renovado'); assert.equal(Number(anterior.importe_pagado),337);
  assert.equal(anterior.ajustes_clase.clase.descuento,3);assert.equal(nuevo.clases_restantes,10);
  assert.equal(nuevo.estado_cobro,'pendiente');assert.deepEqual(nuevo.ajustes_clase,{});
  assert.equal(nuevo.renovado_desde_id,bono);
  const c=(await db.query('select * from bono_cobros where bono_id=$1',[id])).rows;
  assert.equal(c.length,1);assert.equal(c[0].alumno_id,null);assert.equal(Number(c[0].importe),340);
  assert.equal(c[0].fecha_cobro,null);assert.equal((await db.query('select * from bono_alumnos where bono_id=$1',[id])).rows.length,2);
  assert.equal((await db.query('select importe from bono_cobros where bono_id=$1',[bono])).rows[0].importe,'337');
  await assert.rejects(renovar(),/ya está resuelto/);
  assert.equal((await db.query('select count(*)::int n from bonos')).rows[0].n,2);
});
test('Un fallo de cobros o datos revierte todo; exige sesión y bono agotado pendiente', async t => {
  const {db,renovar}=await fixture(t);
  for(const d of [{...datos,clases_restantes:1},{...datos,alumno_id:otro},{...datos,numero_clases:0}])
    await assert.rejects(renovar(d));
  await assert.rejects(renovar(datos,[{...cobros[0],importe:339}]),/no coincide/);
  await assert.rejects(renovar(datos,[{...cobros[0],alumno_id:'invalido'}]));
  assert.equal((await db.query('select count(*)::int n from bonos')).rows[0].n,1);
  assert.equal((await db.query('select resolucion_renovacion from bonos')).rows[0].resolucion_renovacion,null);
  await db.exec("set test.uid=''");await assert.rejects(renovar(),/autenticada/);
  await db.exec("set test.uid='11111111-1111-4111-8111-111111111111'; update bonos set clases_restantes=1");
  await assert.rejects(renovar(),/todavía tiene clases/);
  await db.exec("update bonos set clases_restantes=0,resolucion_renovacion='cerrado'");
  await assert.rejects(renovar(),/ya está resuelto/);
});
test('Un pago confirmado se registra con su fecha; cerrar conserva deudas e historial', async t => {
  const {db,renovar}=await fixture(t);
  const d={...datos,estado_cobro:'pagado',fecha_cobro:'2026-11-02',metodo_cobro:'bizum'};
  const id=(await renovar(d,[{...cobros[0],estado:'pagado',fecha_cobro:d.fecha_cobro,metodo_cobro:'bizum'}])).rows[0].id;
  assert.equal((await db.query('select estado from bono_cobros where bono_id=$1',[id])).rows[0].estado,'pagado');
  await db.query("update bonos set clases_restantes=0,resolucion_renovacion='cerrado',activo=false where id=$1",[id]);
  assert.equal((await db.query('select count(*)::int n from bono_cobros')).rows[0].n,2);
  const filas=(await db.query('select * from bonos')).rows;
  // Restaurar todos los bonos a la vez conserva la relación incluso en orden inverso.
  await db.exec('delete from bono_cobros; delete from bono_alumnos; delete from bonos;');
  await db.query('insert into bonos select * from jsonb_populate_recordset(null::bonos,$1::jsonb)',[JSON.stringify(filas.reverse())]);
  assert.equal((await db.query('select renovado_desde_id from bonos where id=$1',[id])).rows[0].renovado_desde_id,bono);
  const permiso=await db.query("select has_function_privilege('anon','public.renovar_bono(uuid,jsonb,uuid[],jsonb)','execute') permitido");
  assert.equal(permiso.rows[0].permitido,false);
});
