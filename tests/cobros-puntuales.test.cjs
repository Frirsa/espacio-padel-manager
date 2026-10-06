const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');

const inicial = fs.readFileSync('supabase/migrations/202610060800_clases_puntuales.sql', 'utf8');
const correccion = fs.readFileSync('supabase/migrations/202610061105_cobros_puntuales_realizadas.sql', 'utf8');
const grupo = { nombre_grupo_libre: 'Grupo de prueba', numero_participantes: 4,
  monitor_nombre: 'Fran', hora_inicio: '09:00', duracion_minutos: 60, tipo: 'propia',
  estado: 'programada', importe_total: 100.5, coste_pista: 12, coste_monitor: 0,
  monitor_pagado: false, cobrada: false, metodo_cobro: 'efectivo', fecha_cobro: '2020-01-01' };

test('Los cobros de grupos puntuales nacen al realizar la clase', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create schema auth;
    create function auth.uid() returns uuid language sql as $$select '11111111-1111-4111-8111-111111111111'::uuid$$;
    grant usage on schema auth to authenticated;
    create table clases (id uuid primary key default gen_random_uuid(), fecha date not null,
      hora_inicio time not null, duracion_minutos integer not null, ubicacion_id uuid,
      tipo text not null, estado text not null, facturable boolean default true,
      cobrada boolean default false, importe_club numeric default 0, coste_pista numeric default 0,
      ingreso_extra numeric default 0, modo_cobro text, importe_total numeric,
      motivo_cancelacion text, observaciones text, grupo_id uuid, serie_id uuid);
    create table pagos (id uuid primary key default gen_random_uuid(),
      clase_id uuid references clases(id) on delete cascade, alumno_id uuid,
      importe numeric not null, metodo text not null, estado text not null, fecha_pago date not null);
    create table no_disponibilidades (fecha_inicio date, fecha_fin date, hora_inicio time, hora_fin time);
    grant select, insert, update, delete on clases, pagos, no_disponibilidades to authenticated;
    alter table clases enable row level security; alter table pagos enable row level security;
    create policy test_clases on clases to authenticated using(true) with check(true);
    create policy test_pagos on pagos to authenticated using(true)
      with check(coalesce(current_setting('test.deny_pago', true), 'no') <> 'yes');
  `);
  await db.exec(inicial);
  await db.exec('set role authenticated');
  const guardar = async (datos, id = null) => (await db.query(
    'select guardar_clase_puntual($1::uuid, $2::jsonb) as id', [id, JSON.stringify({ ...grupo, ...datos })]
  )).rows[0].id;
  const pagos = async id => (await db.query('select * from pagos where clase_id = $1', [id])).rows;
  const clase = async id => (await db.query('select * from clases where id = $1', [id])).rows[0];

  // Reproducir los pendientes anticipados creados por la versión publicada.
  const futura = await guardar({ fecha: '2099-01-01' });
  const programadaPasada = await guardar({ fecha: '2020-01-02' });
  const anticipado = await guardar({ fecha: '2099-01-03', cobrada: true });
  const realizada = await guardar({ fecha: '2020-01-04', estado: 'realizada' });
  const cancelada = await guardar({ fecha: '2020-01-05', estado: 'cancelada', facturable: true, motivo_cancelacion: 'Prueba' });
  const habitual = (await db.query(`insert into clases(fecha, hora_inicio, duracion_minutos, tipo, estado)
    values ('2020-01-06', '09:00', 60, 'propia', 'programada') returning id`)).rows[0].id;
  await db.query(`insert into pagos(clase_id, importe, metodo, estado, fecha_pago)
    values ($1, 25, 'efectivo', 'pendiente', '2020-01-06')`, [habitual]);
  await db.exec(`insert into pagos(importe, metodo, estado, fecha_pago)
    values (15, 'efectivo', 'pendiente', '2020-01-06')`);
  assert.equal((await pagos(futura)).length, 1);
  assert.equal((await pagos(programadaPasada)).length, 1);
  await db.exec('reset role');
  await db.exec(correccion);
  await db.exec('set role authenticated');

  await t.test('La migración retira los pendientes existentes de clases programadas', async () => {
    assert.equal((await pagos(futura)).length, 0);
    assert.equal((await pagos(programadaPasada)).length, 0);
  });
  await t.test('La limpieza conserva anticipos cobrados y los demás pendientes', async () => {
    assert.equal((await pagos(anticipado))[0].estado, 'pagado');
    assert.equal((await clase(anticipado)).cobrada, true);
    for (const id of [realizada, cancelada, habitual]) assert.equal((await pagos(id))[0].estado, 'pendiente');
    assert.equal((await db.query('select count(*)::int n from pagos where clase_id is null')).rows[0].n, 1);
  });
  let nueva;
  await t.test('Crear y editar una clase futura no genera un pendiente', async () => {
    nueva = await guardar({ fecha: '2099-01-07' });
    assert.equal((await pagos(nueva)).length, 0);
    await guardar({ fecha: '2099-01-08', importe_total: 150 }, nueva);
    assert.equal((await pagos(nueva)).length, 0);
    assert.equal((await clase(nueva)).cobrada, false);
  });
  await t.test('Realizarla crea su pendiente y editarla no lo duplica', async () => {
    await guardar({ fecha: '2020-01-07', estado: 'realizada', importe_total: 150 }, nueva);
    assert.equal((await pagos(nueva)).length, 1);
    assert.equal((await pagos(nueva))[0].estado, 'pendiente');
    assert.equal(Number((await pagos(nueva))[0].importe), 150);
    await guardar({ fecha: '2020-01-07', estado: 'realizada', importe_total: 160 }, nueva);
    assert.equal((await pagos(nueva)).length, 1);
    assert.equal(Number((await pagos(nueva))[0].importe), 160);
  });
  await t.test('El cobro de una realizada actualiza pago y estado de la clase', async () => {
    await guardar({ fecha: '2020-01-07', estado: 'realizada', importe_total: 160, cobrada: true, metodo_cobro: 'bizum' }, nueva);
    assert.equal((await pagos(nueva))[0].estado, 'pagado');
    assert.equal((await pagos(nueva))[0].metodo, 'bizum');
    assert.equal((await clase(nueva)).cobrada, true);
  });
  await t.test('Una clase programada con fecha pasada tampoco genera deuda', async () => {
    const id = await guardar({ fecha: '2020-01-08' });
    assert.equal((await pagos(id)).length, 0);
  });
  await t.test('Se pueden registrar cobros anticipados de clases programadas', async () => {
    const id = await guardar({ fecha: '2099-01-09', cobrada: true });
    assert.equal((await pagos(id))[0].estado, 'pagado');
    await guardar({ fecha: '2099-01-09', cobrada: true, importe_total: 200 }, id);
    assert.equal((await pagos(id)).length, 1);
    assert.equal(Number((await pagos(id))[0].importe), 200);
  });
  await t.test('Reabrir una realizada pendiente como programada retira el pendiente', async () => {
    const id = await guardar({ fecha: '2020-01-10', estado: 'realizada' });
    await guardar({ fecha: '2020-01-10', estado: 'programada' }, id);
    assert.equal((await pagos(id)).length, 0);
    assert.equal((await clase(id)).cobrada, false);
  });
  await t.test('Se mantiene el cobro de las cancelaciones facturables', async () => {
    const id = await guardar({ fecha: '2099-01-11', estado: 'cancelada', facturable: true, motivo_cancelacion: 'Prueba' });
    assert.equal((await pagos(id))[0].estado, 'pendiente');
    await guardar({ fecha: '2099-01-11', estado: 'cancelada', facturable: false, motivo_cancelacion: 'Prueba' }, id);
    assert.equal((await pagos(id)).length, 0);
  });
  await t.test('Se conservan los permisos y el guardado atómico', async () => {
    await db.exec("set test.deny_pago='yes'");
    await assert.rejects(guardar({ fecha: '2020-01-12', estado: 'realizada' }), /row-level security/);
    assert.equal((await db.query("select count(*)::int n from clases where fecha='2020-01-12'")).rows[0].n, 0);
    await db.exec("set test.deny_pago='no'; reset role; set role anon");
    await assert.rejects(guardar({ fecha: '2099-01-12' }), /permission denied/);
    await db.exec('reset role');
  });
  await t.test('Repetir la corrección no altera cobros válidos', async () => {
    const antes = (await db.query('select id, estado, importe from pagos order by id')).rows;
    await db.exec(correccion);
    assert.deepEqual((await db.query('select id, estado, importe from pagos order by id')).rows, antes);
  });
});
