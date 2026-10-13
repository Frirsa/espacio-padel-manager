const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');
function nodos(n, predicate) {
  if (Array.isArray(n)) return n.flatMap(x => nodos(x, predicate));
  if (!n || typeof n !== 'object') return [];
  return [...(predicate(n) ? [n] : []), ...nodos(n.props?.children, predicate)];
}
const texto = n => Array.isArray(n) ? n.map(texto).join('') : n?.props ? texto(n.props.children) : typeof n === 'string' ? n : '';
function montar(extra = {}) {
  let cursor = 0; const hooks = [], calls = [], asociaciones = [], calendar = [], avisos = [];
  const state = { falloAsociacion: false, falloRpc: false };
  const react = { useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial; return [hooks[i], v => { hooks[i] = typeof v === 'function' ? v(hooks[i]) : v; }]; },
    useRef(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = { current: initial }; return hooks[i]; } };
  const api = { rpc: async (name, args) => { calls.push({ name, args }); return state.falloRpc ? {error:{message:'Error de guardado'}} : {data:'clase-guardada'}; } };
  const exported = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/clases/FormularioClasePuntual.tsx','utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020},
  }).outputText, {exports:exported, Date, require:name => {
    if(name==='react')return react; if(name==='react/jsx-runtime')return jsx;
    if(name.endsWith('/supabase'))return {supabase:api};
    if(name.endsWith('/participantesClasePuntual'))return {sincronizarParticipantesPuntuales:async (...args)=>{asociaciones.push(args);if(state.falloAsociacion)throw new Error('Error de conexión');}};
    if(name.endsWith('/googleCalendarClient'))return {sincronizarClaseConGoogleCalendar:async args=>calendar.push(args)};
    return {};
  }});
  const props={clase:null,ubicaciones:[],monitores:[],pagos:[],otroProfesor:true,fechaInicial:'2099-10-19',horaInicial:'10:30',duracionInicial:90,
    alumnos:[{id:'a1',nombre:'Alumna A',apellidos:null},{id:'a2',nombre:'Alumno B',apellidos:null}],
    grupos:[{id:'g1',nombre:'Grupo habitual',grupo_alumnos:[{alumno_id:'a1'},{alumno_id:'a2'}]}],
    onCancelar(){},onGuardada:async aviso=>avisos.push(aviso),...extra};
  const render=()=>{cursor=0;return exported.default(props)};
  const label=(name)=>nodos(render(),n=>n.type==='label'&&texto(n).startsWith(name))[0];
  const field=(name,type='input')=>nodos(label(name),n=>n.type===type)[0];
  const change=(name,value,type='input')=>field(name,type).props.onChange({target:{value,checked:value}});
  const elegir=(name)=>nodos(render(),n=>n.type==='button'&&texto(n)===name)[0].props.onClick();
  const save=()=>render().props.onSubmit({preventDefault(){}});
  change('Monitor','Profesor de prueba');
  change('Importe total de la clase','60');
  return {render,change,elegir,save,state,calls,asociaciones,calendar,avisos};
}
test('Seleccionar el grupo habitual calcula participantes y envía alumnos al calendario',async()=>{
  const app=montar();app.elegir('Alumnos registrados');app.change('Seleccionar un grupo existente','g1','select');app.change('Monitor','Profesor de prueba');app.change('Importe total de la clase','60');
  assert.equal(nodos(app.render(),n=>n.type==='input'&&n.props.readOnly)[0].props.value,2);
  await app.save();
  assert.equal(app.calls[0].args.p_datos.nombre_grupo_libre,'Grupo habitual');
  assert.equal(app.calls[0].args.p_datos.numero_participantes,2);
  assert.equal(app.asociaciones[0][2].join(','),'a1,a2');
  assert.equal(app.calendar[0].alumnos.join(','),'Alumna A,Alumno B');assert.equal(app.avisos.length,1);
});
test('El formulario no guarda alumnos registrados sin seleccionarlos',async()=>{
  const app=montar();app.elegir('Alumnos registrados');await app.save();assert.equal(app.calls.length,0);
  assert.match(texto(app.render()),/Selecciona al menos un alumno/);
});
test('Editar una clase carga sus alumnos y guarda sobre la misma clase',async()=>{
  const app=montar({clase:{id:'existente',nombre_grupo_libre:'Habituales',clase_alumnos:[{alumno_id:'a1'}],fecha:'2099-10-19',hora_inicio:'10:30',duracion_minutos:90,importe_total:60,monitor_nombre:'Profesor de prueba'}});
  await app.save();assert.equal(app.calls[0].args.p_clase_id,'existente');assert.equal(app.asociaciones[0][2].join(','),'a1');
});
test('Tras fallar la vinculación, el segundo guardado reutiliza el ID y no sincroniza antes de completar',async()=>{
  const app=montar();app.elegir('Alumnos registrados');app.change('Alumna A',true);app.state.falloAsociacion=true;await app.save();
  assert.match(texto(app.render()),/falta completar la selección/);assert.equal(app.calendar.length,0);assert.equal(app.avisos.length,0);
  app.state.falloAsociacion=false;await app.save();
  assert.equal(app.calls[1].args.p_clase_id,'clase-guardada');assert.equal(app.calendar.length,1);assert.equal(app.avisos.length,1);
});
test('Los grupos libres conservan el modo sin alumnos registrados',async()=>{
  const app=montar({otroProfesor:false});app.change('Nombre o concepto','Grupo libre de prueba');await app.save();
  assert.equal(app.calls[0].args.p_datos.numero_participantes,4);assert.equal(app.asociaciones.length,0);
});

test('La entrada desde otro profesor permite guardar un concepto sin elegir alumnos',async()=>{
  const app=montar({alumnos:[],grupos:[]});
  // La entrada libre debe estar activa incluso al abrir desde la agenda.
  app.change('Nombre o concepto','Alquiler de pista');
  app.change('Monitor','Profesor de prueba');app.change('Importe total de la clase','20');
  await app.save();
  assert.equal(app.calls.length,1,'El concepto libre debe llegar al guardado sin seleccionar alumnos');
  assert.equal(app.calls[0].args.p_datos.nombre_grupo_libre,'Alquiler de pista');
  assert.equal(app.avisos.length,1);
});

test('La entrada libre no depende de consultar ni seleccionar alumnos',async()=>{
  const app=montar({alumnos:[],grupos:[]});app.state.falloAsociacion=true;
  app.change('Nombre o concepto','Una persona sin ficha');await app.save();
  assert.equal(app.asociaciones.length,0);assert.equal(app.avisos.length,1);
});
test('Cambiar de alumnos registrados a concepto libre no exige seleccionar ninguno',async()=>{
  const app=montar();app.elegir('Alumnos registrados');
  app.elegir('Nombre o concepto libre');app.change('Nombre o concepto','Grupo ocasional');
  await app.save();assert.equal(app.calls.length,1);assert.equal(app.asociaciones.length,0);
});
test('Pasar a concepto libre tras un intento parcial limpia las relaciones sobre la misma clase',async()=>{
  const app=montar();app.elegir('Alumnos registrados');app.change('Alumna A',true);
  app.state.falloAsociacion=true;await app.save();
  app.elegir('Nombre o concepto libre');app.change('Nombre o concepto','Alquiler de pista');
  app.state.falloAsociacion=false;await app.save();
  assert.equal(app.calls[1].args.p_clase_id,'clase-guardada');
  assert.equal(app.asociaciones[1][2].length,0);assert.equal(app.avisos.length,1);
});
