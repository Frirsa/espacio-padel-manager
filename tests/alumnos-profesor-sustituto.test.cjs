const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const oculto = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const datos = { nombre_grupo_libre: 'Alexander y Natalia', numero_participantes: 2,
  monitor_nombre: 'Iván', fecha: '2099-10-20', hora_inicio: '10:30', duracion_minutos: 90,
  tipo: 'propia', estado: 'programada', importe_total: 80, coste_pista: 12, coste_monitor: 25,
  monitor_pagado: false, cobrada: false };

test('Clase de sustitución con alumnos registrados: transacción, permisos y cobro conjunto', async t => {
  const db = new PGlite(); t.after(() => db.close());
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
    create table alumnos(id uuid primary key);
    insert into alumnos values ('${a}'), ('${b}'), ('${oculto}');
    create table clase_alumnos(id uuid primary key default gen_random_uuid(),
      clase_id uuid references clases(id) on delete cascade, alumno_id uuid references alumnos(id),
      importe numeric not null, pagado boolean, usa_bono boolean, bono_id uuid, asistio boolean,
      unique(clase_id, alumno_id));
    create table pagos (id uuid primary key default gen_random_uuid(), clase_id uuid references clases(id),
      alumno_id uuid, importe numeric not null, metodo text not null, estado text not null, fecha_pago date not null);
    create table no_disponibilidades(fecha_inicio date, fecha_fin date, hora_inicio time, hora_fin time);
    insert into no_disponibilidades values ('2099-10-19', '2099-10-26', null, null);
    grant select, insert, update, delete on clases, alumnos, clase_alumnos, pagos, no_disponibilidades to authenticated;
    alter table alumnos enable row level security;
    create policy alumnos_visibles on alumnos to authenticated using(id <> '${oculto}');
    alter table clase_alumnos enable row level security;
    create policy participantes on clase_alumnos to authenticated using(true)
      with check(coalesce(current_setting('test.deny_participante',true),'no') <> 'yes');
  `);
  for (const file of ['202610060800_clases_puntuales.sql', '202610061105_cobros_puntuales_realizadas.sql', '202610120950_alumnos_profesor_sustituto.sql'])
    await db.exec(fs.readFileSync(`supabase/migrations/${file}`, 'utf8'));
  await db.exec('set role authenticated');
  const guardar = async (ids, changes = {}, id = null) => (await db.query(
    'select guardar_clase_puntual_con_alumnos($1::uuid,$2::jsonb,$3::uuid[]) id',
    [id, JSON.stringify({...datos,...changes}), ids])).rows[0].id;
  const participantes = async id => (await db.query('select * from clase_alumnos where clase_id=$1 order by alumno_id',[id])).rows;
  const pagos = async id => (await db.query('select * from pagos where clase_id=$1',[id])).rows;
  const id = await guardar([a,b]);
  await t.test('Vacaciones permiten al sustituto y guardan alumnos reales sin deudas anticipadas', async () => {
    assert.deepEqual((await participantes(id)).map(p => p.alumno_id), [a,b]);
    assert.equal((await pagos(id)).length,0);
    assert.equal((await db.query('select count(*)::int n from alumnos')).rows[0].n,2);
    await assert.rejects(guardar([a],{monitor_nombre:'Fran'}), /no disponible/);
  });
  await t.test('Editar conserva asistencia y no duplica participantes', async () => {
    await db.query('update clase_alumnos set asistio=false where clase_id=$1 and alumno_id=$2',[id,a]);
    await guardar([a,b],{},id);
    assert.equal((await participantes(id)).length,2);
    assert.equal((await participantes(id))[0].asistio,false);
    await guardar([b],{},id);
    assert.deepEqual((await participantes(id)).map(p=>p.alumno_id),[b]);
  });
  await t.test('Realizar crea un único pago total y permite retirar todos los alumnos', async () => {
    await guardar([a,b],{fecha:'2020-10-20',estado:'realizada'},id);
    assert.equal((await pagos(id)).length,1);
    assert.equal((await pagos(id))[0].alumno_id,null);
    assert.equal(Number((await pagos(id))[0].importe),80);
    await guardar([],{fecha:'2020-10-20',estado:'realizada'},id);
    assert.equal((await participantes(id)).length,0);
    assert.equal((await pagos(id)).length,1);
  });
  await t.test('Selecciones inválidas no modifican clase, participantes ni cobro', async () => {
    for (const ids of [[a,a],[null],[oculto],['dddddddd-dddd-4ddd-8ddd-dddddddddddd']])
      await assert.rejects(guardar(ids,{importe_total:90},id));
    await assert.rejects(guardar([a,b],{numero_participantes:1},id), /participantes/);
    assert.equal(Number((await pagos(id))[0].importe),80);
    assert.equal((await participantes(id)).length,0);
  });
  await t.test('Un fallo de permisos al vincular revierte también clase y pago', async () => {
    await db.exec("set test.deny_participante = 'yes'");
    await assert.rejects(guardar([a],{fecha:'2020-10-20',estado:'realizada',importe_total:200},id),/row-level security/);
    assert.equal(Number((await pagos(id))[0].importe),80);
    assert.equal(Number((await db.query('select importe_total from clases where id=$1',[id])).rows[0].importe_total),80);
    await db.exec("set test.deny_participante = 'no'");
  });
});
