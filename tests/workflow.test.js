import test from 'node:test';import assert from 'node:assert/strict';
const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
import * as demo from '../src/demo.js';
test('fluxo completo permuta: criar, colega aceitar, RH homologar, notificar',async()=>{
 demo.initialize();await demo.loginDemo('demo-s1');const req=await demo.sendRequest({type:'PERMUTA',date:'2026-12-02',newDate:'2026-12-03',swapWithUid:'demo-s2',note:'Permuta de plantão'});
 assert.equal(req.status,'aguardando_colega');assert.ok(demo.snapshot().notifications.find(n=>n.uid==='demo-rh'));
 await demo.loginDemo('demo-s2');await demo.acceptSwap(req.id,true);
 await demo.loginDemo('demo-rh');await demo.reviewRequest(req.id,true,'Deferida');
 const s=demo.snapshot();assert.equal(s.requests.find(r=>r.id===req.id).status,'aprovado');assert.equal(s.overrides['demo-s1_2026-12-02'].state,'OFF');assert.equal(s.overrides['demo-s1_2026-12-03'].state,'ON');assert.ok(s.audits.some(x=>x.type==='RH_ANALISOU' || x.type==='REVISAO_SOLICITACAO'));
});
test('atestados não viram faltas sem análise',async()=>{
 await demo.loginDemo('demo-s1');const r=await demo.sendRequest({type:'ATESTADO',date:'2026-12-10',endDate:'2026-12-11'});assert.equal(demo.snapshot().overrides['demo-s1_2026-12-10'],undefined);
 await demo.loginDemo('demo-rh');await demo.reviewRequest(r.id,true,'Atestado conferido');assert.equal(demo.snapshot().overrides['demo-s1_2026-12-10'].state,'ATESTADO');
});
test('RH define prazo, notificação ao servidor e exportação disponível',async()=>{await demo.loginDemo('demo-rh');await demo.saveDeadline('2026-12',17);assert.equal(demo.snapshot().deadlines['2026-12'],17);assert.ok(demo.snapshot().notifications.some(n=>n.uid==='demo-s1'&&n.title.includes('Prazo')));assert.ok(demo.backupDemo().includes('audits'))});
test('folha fechada impede aprovação até reabertura motivada',async()=>{
 await demo.loginDemo('demo-s1');const r=await demo.sendRequest({type:'CORRECAO',date:'2027-01-02',note:'Ajuste solicitado'});
 await demo.loginDemo('demo-rh');await demo.closeSheet('demo-s1','2027-02');await demo.closeSheet('demo-s1','2027-01').catch(()=>{}); // second closure may fail due request pending
 // Separate approved month used to test locking of a request created after closure.
 await demo.closeSheet('demo-s1','2027-03');
 await demo.loginDemo('demo-s1');const q=await demo.sendRequest({type:'CORRECAO',date:'2027-03-02',note:'Solicito retificação'});
 await demo.loginDemo('demo-rh');await assert.rejects(()=>demo.reviewRequest(q.id,true,'Aprovar'),/Folha fechada/);
 await demo.reopenSheet('demo-s1','2027-03','Revisar ocorrência documentada');await demo.reviewRequest(q.id,true,'Aprovar');
 assert.equal(demo.snapshot().requests.find(x=>x.id===q.id).status,'aprovado');
});
