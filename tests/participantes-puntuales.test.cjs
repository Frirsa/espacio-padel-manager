const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/participantesClasePuntual.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exported });
const { sincronizarParticipantesPuntuales } = exported;

function cliente(rows = []) {
  const state = { rows: structuredClone(rows), fail: null, calls: [] };
  return { state, from(table) {
    assert.equal(table, 'clase_alumnos');
    let op = 'select', values, clase, alumnos;
    const q = {
      select() { return q; }, insert(v) { op = 'insert'; values = v; return q; },
      delete() { op = 'delete'; return q; }, update(v) { op = 'update'; values = v; return q; },
      eq(key, value) { assert.equal(key, 'clase_id'); clase = value; return q; },
      in(key, value) { assert.equal(key, 'alumno_id'); alumnos = value; return q; },
      then(resolve, reject) {
        const run = () => {
          state.calls.push(op);
          if (state.fail === op) return { data: null, error: { message: 'Fallo de prueba' } };
          const matches = r => r.clase_id === clase && (!alumnos || alumnos.includes(r.alumno_id));
          if (op === 'select') return { data: state.rows.filter(matches), error: null };
          if (op === 'insert') {
            for (const v of values) {
              assert.ok(!state.rows.some(r => r.clase_id === v.clase_id && r.alumno_id === v.alumno_id), 'relación duplicada');
              state.rows.push({ ...v });
            }
          }
          if (op === 'delete') state.rows = state.rows.filter(r => !matches(r));
          if (op === 'update') state.rows.forEach(r => { if (matches(r)) Object.assign(r, values); });
          return { data: null, error: null };
        };
        return Promise.resolve().then(run).then(resolve, reject);
      },
    }; return q;
  } };
}
test('Los alumnos habituales se vinculan sin duplicados ni cobros individuales', async () => {
  const db = cliente();
  await sincronizarParticipantesPuntuales(db, 'c1', ['a1', 'a2', 'a1'], false);
  assert.equal(db.state.rows.length, 2);
  for (const r of db.state.rows) { assert.equal(r.importe, 0); assert.equal(r.usa_bono, false); assert.equal(r.pagado, false); }
  await sincronizarParticipantesPuntuales(db, 'c1', ['a1', 'a2'], true);
  assert.equal(db.state.rows.length, 2); assert.ok(db.state.rows.every(r => r.pagado));
});
test('Editar la selección conserva la asistencia y no toca otras clases', async () => {
  const db = cliente([{ clase_id: 'c1', alumno_id: 'a1', asistio: false }, { clase_id: 'c1', alumno_id: 'a2' }, { clase_id: 'c2', alumno_id: 'a2' }]);
  await sincronizarParticipantesPuntuales(db, 'c1', ['a1', 'a3'], false);
  assert.equal(db.state.rows.find(r => r.alumno_id === 'a1').asistio, false);
  assert.ok(db.state.rows.some(r => r.clase_id === 'c2' && r.alumno_id === 'a2'));
  assert.ok(!db.state.rows.some(r => r.clase_id === 'c1' && r.alumno_id === 'a2'));
});
test('Una inserción fallida conserva los alumnos anteriores', async () => {
  const db = cliente([{ clase_id: 'c1', alumno_id: 'a1' }]); db.state.fail = 'insert';
  await assert.rejects(sincronizarParticipantesPuntuales(db, 'c1', ['a2'], false), /añadir/);
  assert.equal(db.state.rows[0].alumno_id, 'a1'); assert.equal(db.state.rows.length, 1);
});
test('Reintentar tras un fallo parcial completa las relaciones sin duplicar', async () => {
  const db = cliente([{ clase_id: 'c1', alumno_id: 'a1' }]); db.state.fail = 'delete';
  await assert.rejects(sincronizarParticipantesPuntuales(db, 'c1', ['a2'], false), /retirar/);
  db.state.fail = null;
  await sincronizarParticipantesPuntuales(db, 'c1', ['a2'], false);
  assert.equal(db.state.rows.length, 1); assert.equal(db.state.rows[0].alumno_id, 'a2');
});
test('Volver a grupo libre retira solo las relaciones de esa clase', async () => {
  const db = cliente([{ clase_id: 'c1', alumno_id: 'a1' }, { clase_id: 'c2', alumno_id: 'a1' }]);
  await sincronizarParticipantesPuntuales(db, 'c1', [], false);
  assert.equal(db.state.rows.length, 1); assert.equal(db.state.rows[0].clase_id, 'c2');
});
