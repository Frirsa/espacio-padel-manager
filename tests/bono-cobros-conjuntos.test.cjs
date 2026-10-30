const test=require('node:test');const assert=require('node:assert/strict');
const ts=require('typescript');const fs=require('node:fs');const vm=require('node:vm');
const exportsHelper={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/bonoCobros.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsHelper});
const {prepararCobrosInicialesBono,puedenUnificarseCobros}=exportsHelper;
const base={bonoId:'bono',importe:337,integrantes:['a','b'],reparto:'conjunto',estado:'pagado',metodo:'efectivo',fecha:'2026-10-30'};
test('Un bono compartido con pago conjunto genera un solo cobro de 337, pagado o pendiente',()=>{
  for(const estado of ['pagado','pendiente']) {
    const filas=prepararCobrosInicialesBono({...base,estado});assert.equal(filas.length,1);
    assert.equal(filas[0].alumno_id,null);assert.equal(filas[0].importe,337);assert.equal(filas[0].estado,estado);
    assert.equal(filas[0].metodo_cobro,estado==='pagado'?'efectivo':null);
  }
});
test('El reparto por alumno es explícito y conserva exactamente los céntimos',()=>{
  const filas=prepararCobrosInicialesBono({...base,reparto:'por_alumno',importe:337.01,integrantes:['b','a','b']});
  assert.equal(filas.length,2);assert.equal(filas[0].importe,168.51);assert.equal(filas[1].importe,168.5);
  assert.equal(filas[0].alumno_id,'a');assert.equal(filas[1].alumno_id,'b');
});
test('Un pago individual no se duplica y un bono sin importe no genera pagos',()=>{
  assert.equal(prepararCobrosInicialesBono({...base,integrantes:['a'],reparto:'por_alumno'}).length,1);
  assert.equal(prepararCobrosInicialesBono({...base,importe:0}).length,0);
});
test('Solo se ofrece unificar movimientos compatibles',()=>{
 const c={id:'a',importe:170,estado:'pagado',metodo_cobro:'efectivo',fecha_cobro:'2026-10-30'};
 assert.equal(puedenUnificarseCobros([c,{...c,id:'b',importe:167}]),true);
 for(const cambio of [{estado:'pendiente'},{metodo_cobro:'bizum'},{fecha_cobro:'2026-10-29'}])
   assert.equal(puedenUnificarseCobros([c,{...c,id:'b',...cambio}]),false);
 assert.equal(puedenUnificarseCobros([c]),false);
});
