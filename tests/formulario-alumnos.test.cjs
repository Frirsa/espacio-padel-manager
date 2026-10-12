const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');
function nodos(root, pred) {
  if (Array.isArray(root)) return root.flatMap(n=>nodos(n,pred));
  if (!root || typeof root !== 'object') return [];
  return [...(pred(root)?[root]:[]),...nodos(root.props?.children,pred)];
}
const texto = n => Array.isArray(n) ? n.map(texto).join('') : n?.props ? texto(n.props.children) : typeof n === 'string' ? n : '';
function montar(clase=null) {
  const estados=[]; let cursor=0; const llamadas=[]; const calendario=[];
  const react = {useRef:v=>({current:v}),useState(v){const i=cursor++;if(!(i in estados)) estados[i]=v;return [estados[i],v=>{estados[i]=v;}];}};
  const exports={};
  const mocks = {
    react, 'react/jsx-runtime':jsx,
    '../../lib/supabase':{supabase:{rpc:async(name,args)=>{llamadas.push({name,args});return {data:'clase-id'};}}},
    '../../lib/googleCalendarClient':{sincronizarClaseConGoogleCalendar:async args=>{calendario.push(args);}},
  };
  const code=ts.transpileModule(fs.readFileSync('components/clases/FormularioClasePuntual.tsx','utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020},
  }).outputText;
  vm.runInNewContext(code,{exports,require:n=>mocks[n]||{},Date,Set,Number});
  const props = {clase, ubicaciones:[],monitores:[],pagos:[],otroProfesor:true,
    alumnos:[{id:'a',nombre:'Álex',apellidos:'García',apodo:'Alexander'},{id:'b',nombre:'Natalia',apellidos:null,apodo:null}],
    grupos:[{id:'g',nombre:'Alexander y Natalia',grupo_alumnos:[{alumno_id:'a'},{alumno_id:'b'}]}],
    onCancelar(){},onGuardada:async()=>{},fechaInicial:'2099-10-20',horaInicial:'10:30',duracionInicial:90};
  return {render(){cursor=0;return exports.default(props);},llamadas,calendario};
}
test('El formulario busca sin tildes y por apodo, carga grupo y envía sus alumnos reales',async()=>{
  const app=montar();
  nodos(app.render(),n=>n.type==='input'&&n.props.type==='search')[0].props.onChange({target:{value:'alex garcia'}});
  assert.equal(nodos(app.render(),n=>n.type==='input'&&n.props.type==='checkbox').length,1);
  nodos(app.render(),n=>n.type==='input'&&n.props.type==='search')[0].props.onChange({target:{value:'Alexander'}});
  assert.equal(nodos(app.render(),n=>n.type==='input'&&n.props.type==='checkbox').length,1);
  nodos(app.render(),n=>n.type==='select'&&texto(n).includes('Elegir grupo'))[0].props.onChange({target:{value:'g'}});
  await app.render().props.onSubmit({preventDefault(){}});
  assert.equal(app.llamadas[0].name,'guardar_clase_puntual_con_alumnos');
  assert.deepEqual(Array.from(app.llamadas[0].args.p_alumnos),['a','b']);
  assert.equal(app.llamadas[0].args.p_datos.numero_participantes,2);
  assert.equal(app.llamadas[0].args.p_datos.nombre_grupo_libre,'Alexander y Natalia');
  assert.deepEqual(Array.from(app.calendario[0].alumnos),['Álex García','Natalia']);
});
test('Editar restaura la selección y permite quitar alumnos incluso con filtro',async()=>{
  const app=montar({id:'c',nombre_grupo_libre:'Grupo',numero_participantes:2,hora_inicio:'10:30',clase_alumnos:[{alumno_id:'a'},{alumno_id:'b'}]});
  assert.equal(nodos(app.render(),n=>n.type==='input'&&n.props.type==='checkbox'&&n.props.checked).length,2);
  nodos(app.render(),n=>n.type==='input'&&n.props.type==='search')[0].props.onChange({target:{value:'Natalia'}});
  nodos(app.render(),n=>n.type==='button'&&n.props['aria-label']==='Quitar a Álex García')[0].props.onClick();
  await app.render().props.onSubmit({preventDefault(){}});
  assert.deepEqual(Array.from(app.llamadas[0].args.p_alumnos),['b']);
  assert.equal(app.llamadas[0].args.p_clase_id,'c');
});
