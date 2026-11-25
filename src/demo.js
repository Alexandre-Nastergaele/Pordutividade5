import {addDays,getMonthSheet,isWorking,localDateTime,monthRange,newId,validateRequest,displayDay,readOverride} from './core.js';
const STORAGE='ponto153.demo.v1';
const fixture=()=>({
 version:1, account:null, staff:[
  {uid:'demo-s1', name:'Servidor Exemplo',email:'servidor@exemplo.invalid',registration:'000001',job:'ATENDENTE PLANTONISTA',functionName:'ATENDENTE PLANTONISTA',lotacao:'GP - GCM - GUARDA CIVIL MUNICIPAL',admission:'2026-01-01',phone:'',role:'servidor',anchorDate:'2026-11-02',rhUid:'demo-rh',shiftStart:'19:00',shiftEnd:'07:00'},
  {uid:'demo-s2',name:'Colega Exemplo',email:'colega@exemplo.invalid',registration:'000002',job:'ATENDENTE PLANTONISTA',functionName:'ATENDENTE PLANTONISTA',lotacao:'GP - GCM - GUARDA CIVIL MUNICIPAL',admission:'2026-01-01',phone:'',role:'servidor',anchorDate:'2026-11-03',rhUid:'demo-rh',shiftStart:'19:00',shiftEnd:'07:00'},
  {uid:'demo-rh',name:'Responsável RH (Exemplo)',email:'rh@exemplo.invalid',registration:'RH-DEMO',job:'RH',functionName:'Gestão de Pessoas',lotacao:'GP - GCM - GUARDA CIVIL MUNICIPAL',admission:'2026-01-01',phone:'',role:'rh',anchorDate:'',rhUid:'demo-rh'}
 ],requests:[],overrides:{},punches:[],accessLogs:[],notifications:[],audits:[],closures:{},deadlines:{},settings:{siteAddress:'Rua Marginal, 471 – Residencial Recanto do Bosque, Rio Verde - GO',gpsRadius:400,gpsLat:null,gpsLng:null,autoLoginEvidence:true}});
let store; const listeners=new Set();
function load(){try {const data=JSON.parse(localStorage.getItem(STORAGE));return data&&Array.isArray(data.staff)?data:fixture()}catch{return fixture()}}
function save(){localStorage.setItem(STORAGE,JSON.stringify(store));listeners.forEach(f=>f(snapshot()))}
function actor(){return store.staff.find(s=>s.uid===store.account)||null}
function audit(type,details,uid=store.account){store.audits.unshift({id:newId('LOG'),type,details,uid,at:new Date().toISOString()})}
function notify(uid,title,detail,requestId){if(!uid)return;store.notifications.unshift({id:newId('NOT'),uid,title,detail,requestId,read:false,createdAt:new Date().toISOString()})}
function assertRole(...roles){if(!actor()||!roles.includes(actor().role))throw Error('Esta ação exige permissão do RH')}
export function snapshot(){return {...store,mode:'demo',currentUser:actor(),staff:[...store.staff],requests:[...store.requests],notifications:[...store.notifications]}}
export function subscribe(cb){listeners.add(cb);cb(snapshot());return ()=>listeners.delete(cb)}
export function initialize(){store=load();save();return snapshot()}
export async function loginDemo(uid){const a=store.staff.find(x=>x.uid===uid);if(!a)throw Error('Usuário não encontrado');store.account=uid;const now=localDateTime();if(isWorking(a,now.date,store.overrides)){store.accessLogs.unshift({id:newId('ACCESS'),uid,at:new Date().toISOString(),type:'login_em_dia_escalado'});audit('LOGIN_EM_DIA_ESCALADO',{date:now.date,clock:false},uid)}save();return snapshot()}
export async function logout(){store.account=null;save()}
export async function sendRequest(form){const a=actor();if(!a)throw Error('Entre primeiro');if(a.role==='rh'&&form.type!=='FERIAS'&&form.type!=='ATESTADO')throw Error('Para outras alterações, use uma conta de servidor');validateRequest(form,a,store.staff);
 if(form.type==='PERMUTA'){
  const colleague=store.staff.find(s=>s.uid===form.swapWithUid);
  if(colleague.role!=='servidor'||colleague.rhUid!==a.rhUid)throw Error('Permuta requer colega da mesma unidade/RH');
  if(!isWorking(a,form.date,store.overrides))throw Error('O dia original não é plantão do solicitante');
  if(!isWorking(colleague,form.newDate,store.overrides))throw Error('O colega deve estar escalado na data nova');
 }
 const r={id:newId('SOL'),ownerUid:form.ownerUid&&a.role==='rh'?form.ownerUid:a.uid,rhUid:a.role==='rh'?a.uid:a.rhUid,swapWithUid:form.swapWithUid||'',type:form.type,date:form.date,endDate:form.endDate||'',newDate:form.newDate||'',dobraType:form.dobraType||'',note:form.note||'',attachmentName:form.attachmentName||'',status:form.type==='PERMUTA'?'aguardando_colega':'pendente',createdAt:new Date().toISOString(),version:1};
 store.requests.unshift(r);audit('SOLICITACAO_ENVIADA',{requestId:r.id,type:r.type});notify(r.rhUid,'Nova solicitação recebida',`${a.name}: ${r.type} em ${displayDay(r.date)}`,r.id);if(r.swapWithUid)notify(r.swapWithUid,'Confirme uma permuta',`${a.name} solicita permuta`,r.id);save();return r;
}
export async function acceptSwap(id,accept,note=''){const r=store.requests.find(x=>x.id===id);if(!r||r.type!=='PERMUTA'||r.status!=='aguardando_colega')throw Error('Solicitação não está aguardando colega');if(actor()?.uid!==r.swapWithUid)throw Error('Somente o colega selecionado pode responder');r.status=accept?'aceite_colega':'rejeitado';r.colleagueAt=new Date().toISOString();r.colleagueNote=note; r.version++;audit('RESPOSTA_COLEGA',{id,accept,note});notify(r.ownerUid,accept?'Colega aceitou permuta':'Colega recusou permuta',r.id,r.id);notify(r.rhUid,'Resposta de colega recebida',r.id,r.id);save();return r}
function putOverride(uid,date,content){store.overrides[`${uid}_${date}`]={...content,at:new Date().toISOString()}}
export async function reviewRequest(id,accept,note=''){assertRole('rh','admin');const r=store.requests.find(x=>x.id===id);if(!r)throw Error('Solicitação não encontrada');if(r.rhUid!==actor().uid&&actor().role!=='admin')throw Error('RH não é responsável por este servidor');if(!['pendente','aceite_colega'].includes(r.status))throw Error('Solicitação ainda não está apta à análise');if(r.type==='PERMUTA'&&r.status!=='aceite_colega')throw Error('Colega ainda não aceitou');if(!accept&&!note.trim())throw Error('Informe a justificativa do indeferimento');
 if(accept){
  const targeted=[[r.ownerUid,r.date], ...(r.swapWithUid?[[r.swapWithUid,r.date],[r.ownerUid,r.newDate],[r.swapWithUid,r.newDate]]:[])];for(const [uid,d] of targeted){const closure=store.closures[`${uid}_${d.slice(0,7)}`];if(closure&&closure.status==='demo_homologada')throw Error('Folha fechada. O RH precisa reabri-la com justificativa antes da alteração');}
  if(r.type==='PERMUTA'){
   if(!isWorking(store.staff.find(s=>s.uid===r.ownerUid),r.date,store.overrides)||!isWorking(store.staff.find(s=>s.uid===r.swapWithUid),r.newDate,store.overrides))throw Error('Escala mudou; reanalise a permuta');
   putOverride(r.ownerUid,r.date,{state:'OFF',sourceId:r.id});putOverride(r.swapWithUid,r.date,{state:'ON',sourceId:r.id});putOverride(r.ownerUid,r.newDate,{state:'ON',sourceId:r.id});putOverride(r.swapWithUid,r.newDate,{state:'OFF',sourceId:r.id});notify(r.swapWithUid,'Permuta aprovada pelo RH',r.id,r.id);
  }else if(['ATESTADO','FERIAS'].includes(r.type)){
   const end=r.endDate||r.date;for(let d=r.date;d<=end;d=addDays(d,1)){putOverride(r.ownerUid,d,{state:r.type,sourceId:r.id})}
  }else if(r.type==='DOBRA_24H'){
   putOverride(r.ownerUid,r.date,{state:'ON',startTime:r.dobraType==='DIA_NOITE'?'07:00':'19:00',sourceId:r.id});putOverride(r.ownerUid,addDays(r.date,1),{state:'OFF',exitTime:r.dobraType==='NOITE_DIA'?'19:00':'07:00',sourceId:r.id});
  }else if(r.type==='CORRECAO'){
   // Correction must be specific: the manager must document correction in review notes; never silently changes punch times
  }
 }
 r.status=accept?'aprovado':'rejeitado';r.reviewAt=new Date().toISOString();r.reviewerUid=actor().uid;r.reviewNote=note;r.version++;audit('REVISAO_SOLICITACAO',{id,accept,note});notify(r.ownerUid,accept?'Solicitação aprovada':'Solicitação indeferida',`${r.type}: ${note||r.id}`,r.id);save();return r;
}
export async function markPoint(kind,geo){const a=actor();if(!a||a.role!=='servidor')throw Error('Entrada exclusiva de servidores');if(!['entrada','saida'].includes(kind))throw Error('Marcação inválida');const now=localDateTime();const shiftDate=kind==='saida'?addDays(now.date,-1):now.date;
 if(!isWorking(a,shiftDate,store.overrides))throw Error('Você não está escalado para esse plantão');
 if(kind==='entrada' && now.hour<17)throw Error('Entrada noturna liberada a partir das 17h');
 if(kind==='saida' && now.hour>=17)throw Error('Saída noturna prevista para a manhã; solicite correção ao RH se necessário');
 if(!geo?.demo)throw Error('Neste modo, é obrigatório usar a simulação de GPS sinalizada');
 if(store.punches.some(p=>p.uid===a.uid&&p.shiftDate===shiftDate&&p.kind===kind))throw Error('Já existe esta marcação para o plantão');
 const item={id:newId('PT'),uid:a.uid,shiftDate,kind,at:new Date().toISOString(),localTime:now.time,geoStatus:'SIMULADO — SEM VALIDADE DE PRESENÇA',status:'demo'};store.punches.unshift(item);audit('PONTO_SIMULADO',{kind,shiftDate});notify(a.rhUid,'Marcação de demonstração',`${a.name}: ${kind} em ${now.time}`,item.id);save();return item;
}
export async function saveStaff(data){assertRole('rh','admin');if(!data.name?.trim()||!data.registration?.trim()||!data.uid)throw Error('Nome, matrícula e identificador são obrigatórios');if(data.role==='rh'&&actor().role!=='admin'&&data.uid!==actor().uid)throw Error('Não é permitido criar outro RH sem administrador');const idx=store.staff.findIndex(s=>s.uid===data.uid);if(idx>=0)store.staff[idx]={...store.staff[idx],...data};else store.staff.push({...data,role:'servidor',rhUid:actor().uid});audit('CADASTRO_ALTERADO',{staffUid:data.uid});save()}
export async function saveDeadline(month,day){assertRole('rh','admin');if(day!==null&&(!Number.isInteger(day)||day<1||day>31))throw Error('Dia limite inválido');store.deadlines[month]=day;audit('PRAZO_ATUALIZADO',{month,day});store.staff.filter(x=>x.rhUid===actor().uid&&x.role==='servidor').forEach(s=>notify(s.uid,'Prazo de entrega da folha',`Competência ${month}: ${day?'até o dia '+day:'prazo não definido'}`));save()}
export async function markNotification(id){const n=store.notifications.find(x=>x.id===id);if(n?.uid===actor()?.uid){n.read=true;save()}}
export async function closeSheet(uid,month){assertRole('rh','admin');const staff=store.staff.find(x=>x.uid===uid);if(!staff||staff.rhUid!==actor().uid)throw Error('Servidor não pertence ao seu RH');if(store.requests.some(r=>r.ownerUid===uid&&['pendente','aguardando_colega','aceite_colega'].includes(r.status)&&r.date.slice(0,7)===month))throw Error('Há solicitações pendentes neste mês');const id=`${uid}_${month}`;store.closures[id]={id,uid,month,at:new Date().toISOString(),reviewerUid:actor().uid,revision:(store.closures[id]?.revision||0)+1,status:'demo_homologada'};audit('FECHAMENTO_DEMO',{uid,month});notify(uid,'Folha de ponto analisada',`Competência ${month}`);save();return store.closures[id]}
export function resetDemo(){store=fixture();save()}
export function backupDemo(){return JSON.stringify(store,null,2)}

export async function reopenSheet(uid,month,note){assertRole('rh','admin');const s=store.staff.find(x=>x.uid===uid);if(s?.rhUid!==actor().uid)throw Error('Outro RH');if(!String(note||'').trim())throw Error('Informe o motivo da reabertura');const key=`${uid}_${month}`;if(!store.closures[key]||store.closures[key].status!=='demo_homologada')throw Error('A folha não está fechada');store.closures[key]={...store.closures[key],status:'demo_reaberta',reopenAt:new Date().toISOString(),reason:note};audit('REABERTURA_FOLHA',{uid,month,note});notify(uid,'Folha reaberta para correção',`Competência ${month}: ${note}`);save();return store.closures[key]}
