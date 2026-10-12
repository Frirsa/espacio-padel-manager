const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');

// Ejecutar los manejadores reales sin red ni una sesión de producción.
function montar(path, props) {
  const estados = []; let cursor = 0;
  const react = {
    useEffect() {},
    useRef: value => ({ current: value }),
    useState(initial) {
      const i = cursor++;
      if (!(i in estados)) estados[i] = typeof initial === 'function' ? initial() : initial;
      return [estados[i], value => { estados[i] = typeof value === 'function' ? value(estados[i]) : value; }];
    },
  };
  const exports = {};
  const window = { location: { href: '' } };
  const requireMock = name => name === 'react' ? react : name === 'react/jsx-runtime' ? jsx : {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: requireMock, window, Date, setTimeout });
  const render = () => { cursor = 0; return exports.default(props); };
  return { render, window };
}
function nodos(root, predicate) {
  if (Array.isArray(root)) return root.flatMap(n => nodos(n, predicate));
  if (!root || typeof root !== 'object') return [];
  return [...(predicate(root) ? [root] : []), ...nodos(root.props?.children, predicate)];
}
const texto = root => Array.isArray(root) ? root.map(texto).join('') : root?.props ? texto(root.props.children) : typeof root === 'string' ? root : '';
const props = { clases: [], fechaSeleccionada: '2026-10-19',
  noDisponibilidades: [{ id: 'vacaciones', fecha_inicio: '2026-10-19', fecha_fin: '2026-10-26', hora_inicio: null, hora_fin: null, motivo: 'Vacaciones' }],
  onClaseActualizada: async () => {} };

test('Pulsar un horario de vacaciones abre la creación con otro profesor', () => {
  const app = montar('components/agenda/VistaHorarioAgenda.tsx', props);
  const boton = nodos(app.render(), n => n.type === 'button' && n.props.title?.includes('crear con otro profesor'))[0];
  assert.ok(boton); assert.ok(!boton.props.disabled);
  boton.props.onClick();
  const dialogo = app.render();
  assert.equal(nodos(dialogo, n => n.type === 'button' && texto(n) === 'Clase individual').length, 0);
  assert.equal(nodos(dialogo, n => n.type === 'button' && texto(n) === 'Serie recurrente').length, 0);
  nodos(dialogo, n => n.type === 'button' && texto(n) === 'Clase puntual con otro profesor')[0].props.onClick();
  const url = new URL(app.window.location.href, 'https://manager.espaciopadel.com');
  assert.equal(url.searchParams.get('modo'), 'puntual');
  assert.equal(url.searchParams.get('fecha'), '2026-10-19');
});
test('Seleccionar un tramo de vacaciones conserva hora y duración', () => {
  const app = montar('components/agenda/VistaHorarioAgenda.tsx', props);
  const columna = nodos(app.render(), n => n.props?.onSeleccion && n.props?.estaBloqueado)[0];
  columna.props.onSeleccion(630, 90);
  nodos(app.render(), n => n.type === 'button' && texto(n) === 'Clase puntual con otro profesor')[0].props.onClick();
  const url = new URL(app.window.location.href, 'https://manager.espaciopadel.com');
  assert.equal(url.searchParams.get('hora'), '10:30');
  assert.equal(url.searchParams.get('duracion'), '90');
});
test('Fuera de vacaciones se conservan la clase individual y la serie', () => {
  const app = montar('components/agenda/VistaHorarioAgenda.tsx', { ...props, fechaSeleccionada: '2026-10-27' });
  nodos(app.render(), n => n.type === 'button' && n.props.title?.startsWith('Crear o mover'))[0].props.onClick();
  const dialogo = app.render();
  for (const opcion of ['Clase individual', 'Serie recurrente']) assert.equal(nodos(dialogo, n => n.type === 'button' && texto(n) === opcion).length, 1);
});
