const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');
const economia = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/economia.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText, { exports: economia });
const renovacion={};const cobros={};
for(const [file,out] of [['bonoRenovacion',renovacion],['bonoCobros',cobros]])
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/'+file+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:out});
function nodos(root,predicate) {
  if(Array.isArray(root)) return root.flatMap(n=>nodos(n,predicate));
  if(!root||typeof root!=='object')return [];
  return [...(predicate(root)?[root]:[]),...nodos(root.props?.children,predicate)];
}
const texto=n=>Array.isArray(n)?n.map(texto).join(''):n?.props?texto(n.props.children):typeof n==='string'?n:'';
function montar(seed={}) {
  const estados=[], calls=[], calendar=[]; let cursor=0;
  const react={useEffect(){},useRef(initial){const i=cursor++;if(!(i in estados))estados[i]={current:initial};return estados[i]},
    useState(initial){const i=cursor++;if(!(i in estados))estados[i]=typeof initial==='function'?initial():initial;return [estados[i],v=>estados[i]=typeof v==='function'?v(estados[i]):v]}};
  function chain(){return new Proxy({}, {get(_,key){if(key==='then')return resolve=>resolve({data:[],error:null});return ()=>chain()}})}
  const api={from:()=>chain(),rpc:async(name,args)=>{calls.push({name,args});return {data:'guardada'}}};
  // Inyectar datos como los que carga Supabase; ejecutar el formulario y sus
  // manejadores reales con los mismos hooks de las pruebas de agenda.
  const transformer=context=>root=>ts.visitNode(root,function visit(node){
    if(ts.isVariableDeclaration(node)&&ts.isArrayBindingPattern(node.name)&&node.initializer&&ts.isCallExpression(node.initializer)&&node.initializer.expression.getText()==='useState'){
      const name=node.name.elements[0].name.getText();
      const args=node.initializer.arguments;
      return context.factory.updateVariableDeclaration(node,node.name,node.exclamationToken,node.type,
        context.factory.updateCallExpression(node.initializer,node.initializer.expression,node.initializer.typeArguments,
          [context.factory.createCallExpression(context.factory.createIdentifier('__initial'),undefined,[context.factory.createStringLiteral(name),args[0]])]));
    }
    return ts.visitEachChild(node,visit,context);
  });
  const code=ts.transpileModule(fs.readFileSync('app/bonos/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020},transformers:{before:[transformer]}}).outputText;
  const exports={};
  function CamposMonitor(){}
  vm.runInNewContext(code,{exports,__initial:(name,value)=>Object.prototype.hasOwnProperty.call(seed,name)?seed[name]:value,
    window:{confirm(){return true},innerWidth:1400,scrollTo(){},location:{href:'https://manager.espaciopadel.com/clases'}},Date,URL,setTimeout,
    require:name=>{
      if(name==='react')return react;if(name==='react/jsx-runtime')return jsx;
      if(name.endsWith('/supabase'))return {supabase:api};
      if(name.endsWith('/CamposMonitor'))return {default:CamposMonitor};
      if(name.endsWith('/monitores'))return {cargarMonitores:async()=>[]};
      if(name.endsWith('/googleCalendarClient'))return {sincronizarClaseConGoogleCalendar:async d=>calendar.push(d)};
      if(name.endsWith('/clasesPuntuales'))return {detalleClasePuntual:c=>c.monitor_nombre || ''};
      if(name.endsWith('/economia'))return economia;
      if(name.endsWith('/bonoRenovacion'))return renovacion;
      if(name.endsWith('/bonoCobros'))return cobros;
      if(name==='next/navigation')return {useSearchParams:()=>new URLSearchParams()};
      return {};
    }});
  const render=()=>{cursor=0;return exports.default()};
  const click=name=>nodos(render(),n=>n.type==='button'&&texto(n).trim()===name)[0].props.onClick();
  const form=()=>nodos(render(),n=>n.type==='form'&&true)[0];
  const save=()=>form().props.onSubmit({preventDefault(){}});
  return {render,click,save,calls,calendar,CamposMonitor};
}
const alumno={id:'a1',nombre:'Alumno',apellidos:null};
const bono={id:'b1',alumno_id:'a1',grupo_id:null,numero_clases:10,clases_restantes:0,
  importe_pagado:337,ajustes_clase:{clase:{descuento:3,fecha_clase:'2026-10-30'}},
  activo:false,resolucion_renovacion:null,fecha_compra:'2026-10-01',estado_cobro:'pagado',
  alumnos:alumno,grupos:null,clase_alumnos:[]};
const base={alumnos:[alumno],bonos:[bono],relacionesBonoAlumno:[{bono_id:'b1',alumno_id:'a1'}]};
test('El bono agotado se ve en el listado inicial y cancelar la renovación conserva su aviso',()=>{
  const app=montar(base);assert.ok(nodos(app.render(),n=>n.type==='button'&&texto(n)==='Renovar bono').length);
  app.click('Renovar bono');
  assert.ok(nodos(app.render(),n=>n.type==='h2'&&texto(n)==='Renovar bono').length);
  app.click('Cancelar renovación');
  assert.ok(nodos(app.render(),n=>n.type==='button'&&texto(n)==='Renovar bono').length);
});
test('Guardar renovación envía una sola transacción con diez clases, precio sin descuento puntual y cobro pendiente',async()=>{
  const app=montar(base);app.click('Renovar bono');await app.save();
  assert.equal(app.calls.length,1);const {name,args}=app.calls[0];
  assert.equal(name,'renovar_bono');assert.equal(args.p_bono_id,'b1');
  assert.equal(args.p_datos.numero_clases,10);assert.equal(args.p_datos.clases_restantes,10);
  assert.equal(args.p_datos.importe_pagado,340);assert.equal(args.p_datos.estado_cobro,'pendiente');
  assert.equal(args.p_cobros.length,1);assert.equal(args.p_cobros[0].alumno_id,null);
  assert.equal(args.p_cobros[0].estado,'pendiente');assert.equal(args.p_datos.fecha_cobro,null);
});
