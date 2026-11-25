/** Pure schedule, dates, and validation functions. Timezone of time punches is America/Sao_Paulo. */
export const TZ = 'America/Sao_Paulo';
export const weekNames = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
export const requestLabels = { PERMUTA:'Permuta', ATESTADO:'Atestado', DOBRA_24H:'Dobra 24h', CORRECAO:'Correção', FERIAS:'Férias' };
export const requestStates = { pendente:'Pendente', aceite_colega:'Aguardando RH', aguardando_colega:'Aguardando colega', aprovado:'Aprovado', rejeitado:'Indeferido' };
export function parseDate(iso) { if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||'')) throw Error('Data inválida'); const [y,m,d]=iso.split('-').map(Number); const date=new Date(Date.UTC(y,m-1,d)); if (date.toISOString().slice(0,10)!==iso) throw Error('Data inválida'); return date; }
export function isoDay(d){return d.toISOString().slice(0,10)}
export function addDays(iso,n){const d=parseDate(iso);d.setUTCDate(d.getUTCDate()+n);return isoDay(d)}
export function daysDiff(a,b){return Math.round((parseDate(a).getTime()-parseDate(b).getTime())/86400000)}
export function monthDays(month){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month||''))throw Error('Competência inválida');const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m,0)).getUTCDate()}
export function monthRange(month){return Array.from({length:monthDays(month)},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`)}
export function weekName(iso){return weekNames[parseDate(iso).getUTCDay()]}
export function displayDay(iso){return iso.slice(8,10)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4)}
export function displayMonth(month){const [y,m]=month.split('-'); return new Date(Date.UTC(Number(y), Number(m)-1, 1)).toLocaleDateString('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'});}
export function localDateTime(d=new Date()) {const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});const o=Object.fromEntries(fmt.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return {date:`${o.year}-${o.month}-${o.day}`, time:`${o.hour}:${o.minute}:${o.second}`,hour:Number(o.hour)};}
export function isScheduled(staff,iso){if(!staff?.anchorDate)return false; const difference=daysDiff(iso,staff.anchorDate);return difference>=0&&difference%2===0;}
export function readOverride(overrides,uid,iso){return (overrides||{})[`${uid}_${iso}`]||null}
export function isWorking(staff,iso,overrides={}) {const over=readOverride(overrides,staff.uid,iso);if(over){if(over.state==='ON')return true;if(['OFF','FERIAS','ATESTADO'].includes(over.state))return false;}return isScheduled(staff,iso)}
export function getMonthSheet(staff,month,overrides={}, punches=[], closures={}) {const days=monthRange(month); const closure=closures[`${staff.uid}_${month}`];return {
  staff,month,closure,
  rows:days.map((date,i)=>{
    const over=readOverride(overrides,staff.uid,date);
    const shift=isWorking(staff,date,overrides);
    const preceding=isWorking(staff,addDays(date,-1),overrides);
    const first=over?.state==='FERIAS'?'FÉRIAS':over?.state==='ATESTADO'?'ATESTADO':shift?(over?.startTime||'19:00'):'';
    const second=over?.exitTime|| (preceding?'07:00':'');
    const events=punches.filter(p=>p.uid===staff.uid && p.shiftDate===date);
    return {date, day:i+1, weekday:weekName(date),first,second,extra:'',over,shift,events,confirmed:events.some(p=>p.kind==='entrada'),future: date>localDateTime().date};
  })
}}
export function validateRequest(payload,actor,staff){
 const kind=String(payload.type||'');if(!requestLabels[kind])throw Error('Tipo de solicitação inválido');
 if(kind==='FERIAS'&&actor.role!=='rh'&&actor.role!=='admin')throw Error('Férias são registradas pelo RH');
 if(!payload.date)throw Error('Escolha o primeiro dia');parseDate(payload.date);
 if(payload.endDate){parseDate(payload.endDate);if(payload.endDate<payload.date)throw Error('Data final anterior à inicial')}
 if(payload.swapWithUid){if(payload.swapWithUid===actor.uid)throw Error('Escolha outro servidor');if(!staff.some(s=>s.uid===payload.swapWithUid))throw Error('Colega não encontrado');}
 if(kind==='PERMUTA'){
  if(!payload.swapWithUid||!payload.newDate)throw Error('Permuta exige colega e data do novo plantão');parseDate(payload.newDate);if(payload.newDate===payload.date)throw Error('Escolha outro dia');
 }
 if(kind==='DOBRA_24H'&&(!['NOITE_DIA','DIA_NOITE'].includes(payload.dobraType)))throw Error('Selecione o tipo de dobra');
 if(kind==='CORRECAO'&&!String(payload.note||'').trim())throw Error('Informe o motivo da correção');
 if(kind==='ATESTADO'&&!payload.endDate)throw Error('Informe a data final do afastamento');
 return true;
}
export function haversineMeters(a,b){const R=6371000; const rad=x=>x*Math.PI/180;const lat=rad(b.lat-a.lat),lng=rad(b.lng-a.lng);const h=Math.sin(lat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(lng/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
export function escapeHtml(input=''){return String(input??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function newId(prefix='ID'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`.toUpperCase()}
