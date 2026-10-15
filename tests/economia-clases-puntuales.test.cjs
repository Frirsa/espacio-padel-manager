const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/economia.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText, { exports: exported });
const { calcularEconomiaClase, recalcularImportesBonos } = exported;
const { resumirCostesOtrasPistas } = exported;
const clase = { tipo: 'propia', estado: 'realizada', modo_cobro: 'total', importe_total: 100,
  coste_pista: 12, coste_monitor: 30, clase_alumnos: [], ubicaciones: { es_club_referencia: true } };

test('El ingreso del grupo completo no necesita participantes registrados', () => {
  const r = calcularEconomiaClase(clase);
  assert.equal(r.ingresos, 100); assert.equal(r.gastoPista, 12);
  assert.equal(r.gastoMonitor, 30); assert.equal(r.gasto, 42); assert.equal(r.resultado, 58);
});
test('Las dos pistas aportan sus ingresos y todos sus costes una vez', () => {
  const propia = calcularEconomiaClase({ ...clase, coste_monitor: 0 });
  const otra = calcularEconomiaClase(clase);
  assert.equal(propia.ingresos + otra.ingresos, 200);
  assert.equal(propia.gasto + otra.gasto, 54);
  assert.equal(propia.resultado + otra.resultado, 146);
});
test('Pagar al monitor no cambia el resultado devengado de la clase', () => {
  assert.equal(calcularEconomiaClase({ ...clase, monitor_pagado: true }).resultado,
    calcularEconomiaClase({ ...clase, monitor_pagado: false }).resultado);
});
test('Las liquidaciones del club sólo descuentan las pistas', () => {
  assert.equal(calcularEconomiaClase(clase).pistasPagadasClub, 12);
});
test('Las clases programadas no aportan ingresos ni gastos al resultado', () => {
  const r = calcularEconomiaClase({ ...clase, estado: 'programada' });
  assert.equal(r.ingresos, 0); assert.equal(r.gasto, 0); assert.equal(r.resultado, 0);
});
test('La cancelación facturable conserva el ingreso y no aplica costes de una clase impartida', () => {
  const r = calcularEconomiaClase({ ...clase, estado: 'cancelada', facturable: true });
  assert.equal(r.ingresos, 100); assert.equal(r.gasto, 0); assert.equal(r.resultado, 100);
});
test('La cancelación no facturable no aporta resultado', () => {
  assert.equal(calcularEconomiaClase({ ...clase, estado: 'cancelada', facturable: false }).resultado, 0);
});
test('Las clases anteriores sin monitor mantienen su resultado', () => {
  assert.equal(calcularEconomiaClase({ tipo: 'propia', estado: 'realizada', coste_pista: 6,
    clase_alumnos: [{ importe: 26 }] }).resultado, 20);
});
test('El precio real del bono se mantiene y no modifica los participantes originales', () => {
  const antigua = { tipo: 'propia', clase_alumnos: [{ alumno_id: 'a', bono_id: 'b', usa_bono: true, importe: 24 }] };
  const corregida = recalcularImportesBonos(antigua, [{ id: 'b', importe_pagado: 130, numero_clases: 5 }]);
  assert.equal(corregida.clase_alumnos[0].importe, 26); assert.equal(antigua.clase_alumnos[0].importe, 24);
});
test('El informe IQL utiliza el alquiler de pista y excluye al monitor de su saldo', () => {
  const source = fs.readFileSync('app/informes/page.tsx', 'utf8');
  const fragment = source.slice(source.indexOf('  const totalAlquiler ='), source.indexOf('  const saldoIQL ='));
  const context = { clasesPropiasIQL: [clase, { ...clase, coste_monitor: 0 }], calcularEconomiaClase };
  vm.runInNewContext(fragment + '\nthis.total = totalAlquiler;', context);
  assert.equal(context.total, 24);
});

test('Otras pistas agrupa Alfaz, Cap Blanc y nuevas ubicaciones sin incluir IQL ni monitores', () => {
  const alfaz = { ...clase, ubicacion_id: 'alfaz', ubicaciones: { nombre: 'Alfaz', es_club_referencia: false } };
  const capBlanc = { ...clase, ubicacion_id: 'cap', coste_pista: '8.50', ubicaciones: [{ nombre: 'Cap Blanc', es_club_referencia: false }] };
  const otra = { ...clase, ubicacion_id: 'otra', coste_pista: 4, ubicaciones: { nombre: 'Otra pista' } };
  const r = resumirCostesOtrasPistas([alfaz, alfaz, capBlanc, otra, clase]);
  assert.deepEqual(JSON.parse(JSON.stringify(r)), [
    { clave: 'alfaz', nombre: 'Alfaz', coste: 24 },
    { clave: 'cap', nombre: 'Cap Blanc', coste: 8.5 },
    { clave: 'otra', nombre: 'Otra pista', coste: 4 },
  ]);
  assert.equal(r.reduce((total, pista) => total + pista.coste, 0), 36.5);
});

test('Otras pistas omite programadas, canceladas, costes nulos y periodos sin gastos', () => {
  const propia = { ...clase, ubicaciones: { nombre: 'Alfaz' } };
  const r = resumirCostesOtrasPistas([
    { ...propia, estado: 'programada' },
    { ...propia, estado: 'cancelada', facturable: true },
    { ...propia, estado: 'cancelada', facturable: false },
    { ...propia, coste_pista: null },
  ]);
  assert.equal(r.length, 0);
  assert.equal(resumirCostesOtrasPistas([]).length, 0);
});

test('Otras pistas conserva costes sin ubicación y separa ubicaciones con el mismo nombre', () => {
  const r = resumirCostesOtrasPistas([
    { ...clase, ubicacion_id: 'a', ubicaciones: { nombre: 'Club' }, coste_pista: 0.1 },
    { ...clase, ubicacion_id: 'a', ubicaciones: { nombre: 'Club' }, coste_pista: 0.2 },
    { ...clase, ubicacion_id: 'b', ubicaciones: { nombre: 'Club' }, coste_pista: 10 },
    { ...clase, ubicaciones: null, pista_nombre: 'Pista libre' },
    { ...clase, ubicaciones: null },
  ]);
  assert.equal(r.length, 4);
  assert.equal(r.find(pista => pista.clave === 'a').coste, 0.3);
  assert.equal(r.find(pista => pista.clave === 'b').coste, 10);
  assert.equal(r.find(pista => pista.nombre === 'Pista libre').coste, 12);
  assert.equal(r.find(pista => pista.nombre === 'Sin ubicación').coste, 12);
});
