const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');
const economia = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/economia.ts','utf8'), {
  compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020 }
}).outputText,{exports:economia});
const bono={id:'bono',numero_clases:10,importe_pagado:340};
const clase={id:'clase',estado:'realizada',tipo:'propia',modo_cobro:'por_alumno',clase_alumnos:[{bono_id:'bono',usa_bono:true,alumnos:{nombre:'Alumno',apellidos:null}}]};
function montar(b=bono) {
  const states=[],effects=[],calls=[];let cursor=0,refresh=0;
  const react={
    useState(initial){const i=cursor++;if(!(i in states)) states[i]=initial;return [states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},
    useEffect(fn){effects.push(fn);},
  };
  const chain={select(){return this;},eq(){return this;},order(){return this;},then(fn){return Promise.resolve(fn({data:[{id:'cobro',importe:340,estado:'pagado',metodo_cobro:'bizum',fecha_cobro:'2026-10-30'}],error:null}));}};
  const api={from:()=>chain,rpc:async(name,args)=>{calls.push({name,args});return {error:null};}};
  const exports={};
  const code=ts.transpileModule(fs.readFileSync('components/bonos/DescuentoClaseBono.tsx','utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}
  }).outputText;
  vm.runInNewContext(code+'\nexports.Ajuste=Ajuste;',{exports,require:n=>n==='react'?react:n==='react/jsx-runtime'?jsx:n.endsWith('/supabase')?{supabase:api}:economia});
  const render=()=>{cursor=0;return exports.Ajuste({clase,bono:b,onGuardado:async()=>refresh++});};
  const visit=(node,predicate)=>Array.isArray(node)?node.flatMap(n=>visit(n,predicate)):node&&typeof node==='object'?[...(predicate(node)?[node]:[]),...visit(node.props?.children,predicate)]:[];
  render();effects[0]();
  const inputs=()=>visit(render(),n=>n.type==='input');
  const button=()=>visit(render(),n=>n.type==='button')[0];
  const set=(index,value)=>inputs()[index].props.onChange({target:{value}});
  return {calls,render,visit,set,button,get refreshed(){return refresh;}};
}
test('El formulario acepta coma decimal y envía solo el descuento de esa clase, sin repetir consumo',async()=>{
  const app=montar();app.set(0,'3,00');app.set(1,'Solo asiste un alumno');
  assert.equal(Boolean(app.button().props.disabled),false);await app.button().props.onClick();
  const args=app.calls[0].args;
  assert.equal(app.calls[0].name,'guardar_descuento_clase_bono');assert.equal(args.p_descuento,3);
  assert.equal(args.p_bono_id,'bono');assert.equal(args.p_clase_id,'clase');assert.equal(args.p_cobro_id,null);
  assert.equal('p_uso_nuevo' in args,false);assert.equal(app.refreshed,1);
});
test('El formulario exige un importe y motivo válidos antes de guardar',()=>{
  const app=montar();app.set(1,'Motivo');
  for(const amount of ['','35','-1','3.001','abc']) {app.set(0,amount);assert.equal(app.button().props.disabled,true);}
  app.set(0,'3');app.set(1,'  ');assert.equal(app.button().props.disabled,true);
});
test('Editar un descuento envía el valor anterior para detectar cambios concurrentes',async()=>{
  const app=montar({...bono,importe_pagado:337,ajustes_clase:{clase:{descuento:3,motivo:'Ausencia',cobro_id:'cobro'}}});
  app.set(0,'4');await app.button().props.onClick();
  assert.equal(app.calls[0].args.p_descuento_anterior,3);assert.equal(app.calls[0].args.p_cobro_id,'cobro');
});
