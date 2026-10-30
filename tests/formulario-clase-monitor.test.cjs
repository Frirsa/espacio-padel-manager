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
  const code=ts.transpileModule(fs.readFileSync('app/clases/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020},transformers:{before:[transformer]}}).outputText;
  const exports={};
  function CamposMonitor(){}
  vm.runInNewContext(code,{exports,__initial:(name,value)=>Object.prototype.hasOwnProperty.call(seed,name)?seed[name]:value,
    window:{scrollTo(){},location:{href:'https://manager.espaciopadel.com/clases'}},Date,URL,setTimeout,
    require:name=>{
      if(name==='react')return react;if(name==='react/jsx-runtime')return jsx;
      if(name.endsWith('/supabase'))return {supabase:api};
      if(name.endsWith('/CamposMonitor'))return {default:CamposMonitor};
      if(name.endsWith('/monitores'))return {cargarMonitores:async()=>[]};
      if(name.endsWith('/googleCalendarClient'))return {sincronizarClaseConGoogleCalendar:async d=>calendar.push(d)};
      if(name.endsWith('/clasesPuntuales'))return {detalleClasePuntual:c=>c.monitor_nombre || ''};
      if(name.endsWith('/economia'))return economia;
      return {};
    }});
  const render=()=>{cursor=0;return exports.default()};
  const click=name=>nodos(render(),n=>n.type==='button'&&texto(n).trim()===name)[0].props.onClick();
  const form=()=>nodos(render(),n=>n.type==='form'&&n.props.id==='formulario-clase')[0];
  const save=()=>form().props.onSubmit({preventDefault(){}});
  return {render,click,save,calls,calendar,CamposMonitor};
}
const alumno={id:'a1',nombre:'Alumna',apellidos:null,apodo:null};
const bono={id:'b1',alumno_id:'a1',grupo_id:null,numero_clases:5,clases_restantes:5,importe_pagado:125,activo:true};
const base={formularioAbierto:true,fecha:'2020-10-19',hora:'09:00',duracion:'60',tipo:'propia',
  alumnos:[alumno],bonos:[bono],alumnosSeleccionados:['a1'],modoPagoAlumnos:{a1:'bono'},bonosSeleccionados:{a1:'b1'},
  monitorNombre:'Ana',costeMonitor:'20',estado:'realizada'};

test('La pantalla habitual envía el sustituto y descuenta una sesión del bono, sin cobro nuevo',async()=>{
 const app=montar(base); await app.save();
 const {name,args}=app.calls[0];assert.equal(name,'guardar_clase_con_monitor');
 assert.equal(args.p_datos_clase.monitor_nombre,'Ana');assert.equal(args.p_datos_clase.coste_monitor,20);
 assert.equal(args.p_participantes[0].bono_id,'b1');assert.equal(args.p_participantes[0].usa_bono,true);
 assert.equal(args.p_uso_nuevo.b1,1);assert.equal(args.p_datos_clase.modo_cobro,'por_alumno');
 assert.match(app.calendar[0].observaciones,/Monitor: Ana/);
});
test('Una clase programada con sustituto conserva el bono sin consumirlo todavía',async()=>{
 const app=montar({...base,estado:'programada'});await app.save();
 assert.equal(Object.keys(app.calls[0].args.p_uso_nuevo).length,0);
});
test('El concepto libre usa la misma pantalla sin exigir alumnos y conserva céntimos',async()=>{
 const app=montar({...base,conceptoLibre:true,nombreConcepto:'Alquiler de pista',numeroPersonas:'2',alumnosSeleccionados:[],importeTotalClase:'60.75',estadoPagoTotal:'pagado',modoCobroClase:'total'});
 await app.save();const args=app.calls[0].args;
 assert.equal(args.p_datos_clase.concepto_clase,'Alquiler de pista');assert.equal(args.p_datos_clase.importe_total,60.75);
 assert.equal(args.p_participantes.length,0);assert.equal(args.p_datos_clase.cobrada,true);
});
test('Crear una clase abre la pantalla habitual con Fran y sin una entrada especial para sustitutos',()=>{
 const app=montar();app.click('+ Nueva clase');const root=app.render();
 const campos=nodos(root,n=>n.type===app.CamposMonitor)[0];
 assert.equal(campos.props.nombre,'Fran');assert.equal(campos.props.coste,'0');
 assert.equal(nodos(root,n=>n.type==='button'&&texto(n).includes('Clase puntual con otro')).length,0);
});

test('Editar una puntual anterior conserva el identificador y permite pasar de concepto libre a alumnos',async()=>{
 const anterior={id:'anterior',fecha:'2020-10-19',hora_inicio:'09:00',duracion_minutos:60,tipo:'propia',estado:'realizada',facturable:true,
   nombre_grupo_libre:'Grupo anterior',numero_participantes:2,modo_cobro:'total',importe_total:60.75,coste_pista:12,importe_club:0,ingreso_extra:0,
   monitor_nombre:'Ana',coste_monitor:20,clase_alumnos:[],ubicaciones:null};
 const app=montar({...base,claseEditandoId:'anterior',clases:[anterior],conceptoLibre:true,nombreConcepto:'Grupo anterior',alumnosSeleccionados:[],
   modoPagoAlumnos:{},bonosSeleccionados:{},modoCobroClase:'total',importeTotalClase:'60.75'});

 const label=nodos(app.render(),n=>n.type==='label'&&texto(n).includes('Alumna'))[0];
 assert.ok(label,'La selección habitual de alumnos sigue disponible');
 nodos(label,n=>n.type==='input'&&n.props.type==='checkbox')[0].props.onChange();
 await app.save();assert.ok(app.calls.length,nodos(app.render(),n=>n.type==='p'&&texto(n).includes('❌')).map(texto).join(' '));const args=app.calls[0].args;
 assert.equal(args.p_clase_id,'anterior');assert.equal(args.p_datos_clase.nombre_grupo_libre,'Grupo anterior');
 assert.equal(args.p_participantes[0].alumno_id,'a1');assert.equal(args.p_datos_clase.importe_total,60.75);
});


test('El concepto y el ingreso extra conviven con un alumno de bono',async()=>{
 const app=montar({...base,nombreConcepto:'Clase con invitado',ingresoExtra:'5.25',descripcionExtra:'Propina'});
 await app.save();const args=app.calls[0].args;
 assert.equal(args.p_datos_clase.concepto_clase,'Clase con invitado');
 assert.equal(args.p_datos_clase.ingreso_extra,5.25);
 assert.equal(args.p_datos_clase.ingreso_extra_concepto,'Propina');
 assert.equal(args.p_participantes[0].bono_id,'b1');assert.equal(args.p_uso_nuevo.b1,1);
});
test('Sin concepto ni alumnos no se guarda una clase',async()=>{
 const app=montar({...base,alumnosSeleccionados:[]});await app.save();assert.equal(app.calls.length,0);
});
test('La misma pantalla muestra alumnos, concepto e ingreso extra sin cambiar de modalidad',()=>{
 const app=montar({...base,alumnosSeleccionados:[]});const root=app.render();
 assert.ok(nodos(root,n=>n.type==='label'&&texto(n).includes('Alumna')).length);
 assert.ok(nodos(root,n=>n.type==='input'&&n.props.placeholder?.startsWith('Grupo belgas')).length);
 assert.ok(nodos(root,n=>n.type==='label'&&texto(n).trim()==='Ingreso extra').length);
 assert.equal(nodos(root,n=>n.props?.hidden===true&&texto(n).includes('Ingreso extra')).length,0);
});


test('El formulario reparte el precio del bono compartido en céntimos',async()=>{
  const segundo={...alumno,id:'a2',nombre:'Segundo'};
  const app=montar({...base,alumnos:[alumno,segundo],bonos:[{...bono,importe_pagado:170.05}],
    alumnosSeleccionados:['a1','a2'],modoPagoAlumnos:{a1:'bono',a2:'bono'},
    bonosSeleccionados:{a1:'b1',a2:'b1'},relacionesBonoAlumno:[{bono_id:'b1',alumno_id:'a2'}]});
  await app.save();assert.ok(app.calls.length);
  assert.equal(app.calls[0].args.p_participantes[0].importe,17.01);
  assert.equal(app.calls[0].args.p_participantes[1].importe,17);
});
