/** Production adapter: Firebase credentials are public client identifiers, NOT admin credentials. */
import {initializeApp} from 'firebase/app';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {getFirestore,doc,getDoc,collection,query,where,onSnapshot} from 'firebase/firestore';
import {getFunctions,httpsCallable} from 'firebase/functions';
import {getStorage,ref,uploadBytes,getBlob} from 'firebase/storage';
const env=import.meta.env;
const firebaseConfig={apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID,appId:env.VITE_FIREBASE_APP_ID,storageBucket:env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:env.VITE_FIREBASE_MESSAGING_SENDER_ID};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),functions=getFunctions(app,env.VITE_FIREBASE_FUNCTIONS_REGION||'southamerica-east1'),storage=getStorage(app);
let state={mode:'cloud',currentUser:null,staff:[],requests:[],overrides:{},punches:[],notifications:[],audits:[],closures:{},deadlines:{},settings:{}};
const listeners=new Set();let subs=[],authReady=false;
function notify(){listeners.forEach(fn=>fn(snapshot()))}
function attach(unsub){subs.push(unsub)}function clear(){subs.forEach(f=>f());subs=[]}
function replaceField(field,list){state[field]=list;notify()}
function watchDocs(field,q,transform=d=>({uid:d.id,...d.data()})){attach(onSnapshot(q,s=>replaceField(field,s.docs.map(transform)),e=>console.warn('Falha leitura '+field,e.message)))}
function watchUser(q,field){attach(onSnapshot(q,s=>{if(field==='overrides'){state.overrides=Object.fromEntries(s.docs.map(d=>[d.id,d.data()]));}else if(field==='closures'){state.closures=Object.fromEntries(s.docs.map(d=>[d.id,d.data()]));}else {state[field]=s.docs.map(d=>({id:d.id,...d.data()}))}notify()},e=>console.warn('Falha '+field,e.message)))}
function watchUnion(field,queries){const parts=queries.map(()=>[]);queries.forEach((q,i)=>attach(onSnapshot(q,s=>{parts[i]=s.docs.map(d=>({id:d.id,...d.data()}));const ids=new Map;parts.flat().forEach(x=>ids.set(x.id,x));state[field]=Array.from(ids.values()).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));notify()},e=>console.warn('Falha consulta '+field,e.message))))}
function mergeStaff(profile,assigned,directory){const map=new Map;directory.forEach(d=>map.set(d.uid,d));assigned.forEach(d=>map.set(d.uid,{...map.get(d.uid),...d}));if(profile)map.set(profile.uid,{...map.get(profile.uid),...profile});return Array.from(map.values())}
async function observeUser(user){clear(); if(!user){state={mode:'cloud',currentUser:null,staff:[],requests:[],overrides:{},punches:[],notifications:[],audits:[],closures:{},deadlines:{},settings:{}};notify();return;}
 const uid=user.uid,refUser=doc(db,'users',uid);const p=await getDoc(refUser);if(!p.exists()) {state.currentUser={uid,name:user.email||'Conta sem cadastro',role:'sem_perfil',email:user.email};notify();return;}const profile={...p.data(),uid};state.currentUser=profile;notify();
 let directory=[],assigned=[];const rebuild=()=>{state.staff=mergeStaff(profile,assigned,directory);notify()};attach(onSnapshot(collection(db,'directory'),s=>{directory=s.docs.map(d=>({uid:d.id,...d.data()}));rebuild()}));
 if(['rh','admin'].includes(profile.role)){const q=profile.role==='admin'?collection(db,'users'):query(collection(db,'users'),where('rhUid','==',uid));attach(onSnapshot(q,s=>{assigned=s.docs.map(d=>({uid:d.id,...d.data()}));rebuild()}));}else{rebuild()}
 const reqQs=[query(collection(db,'requests'),where('ownerUid','==',uid)),query(collection(db,'requests'),where('swapWithUid','==',uid))];if(['rh','admin'].includes(profile.role))reqQs.push(query(collection(db,'requests'),where('rhUid','==',uid)));watchUnion('requests',reqQs);
 const nt=query(collection(db,'notifications'),where('uid','==',uid));watchUser(nt,'notifications');
 const permittedField=['rh','admin'].includes(profile.role)?'rhUid':'uid';
 watchUser(query(collection(db,'overrides'),where(permittedField,'==',uid)),'overrides');watchUser(query(collection(db,'punches'),where(permittedField,'==',uid)),'punches');watchUser(query(collection(db,'closures'),where(permittedField,'==',uid)),'closures');
 attach(onSnapshot(doc(db,'settings','general'),s=>{state.settings=s.data()||{};state.deadlines=state.settings.deadlines||{};notify()}));
 // Login is recorded as an access event, NOT a verified time punch.
 call('loginEvidence',{}).catch(e=>console.warn('Login evidence',e.message));
}
export async function initialize(){await new Promise(resolve=>{const off=onAuthStateChanged(auth,async user=>{await observeUser(user);if(!authReady){authReady=true;resolve()}},e=>{console.error(e);resolve()})})}
export function snapshot(){return {...state}}
export function subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn)}
export async function login(email,password){await signInWithEmailAndPassword(auth,email,password)}
export async function logout(){await signOut(auth)}
async function call(name,payload){const {data}=await httpsCallable(functions,name)(payload);return data}
export async function sendRequest(form){const f={...form};if(f.attachment){const file=f.attachment;if(file instanceof File && file.size>0){if(file.size>5_000_000)throw Error('Anexo maior que 5 MB');if(!['application/pdf','image/png','image/jpeg'].includes(file.type))throw Error('Use PDF, PNG ou JPG');const path=`atestados/${auth.currentUser.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g,'_')}`;await uploadBytes(ref(storage,path),file,{contentType:file.type});f.attachmentPath=path;f.attachmentName=file.name}delete f.attachment;}return call('createChangeRequest',f)}
export async function acceptSwap(id,accept,note=''){return call('colleagueRespond',{id,accept,note})}
export async function reviewRequest(id,accept,note=''){return call('reviewChangeRequest',{id,accept,note})}
export async function markPoint(kind,geo){return call('recordPunch',{kind,geo})}
export async function saveStaff(form){if(form.uid?.startsWith('USR-'))return call('createStaffAccount',form);return call('upsertStaffProfile',form)}
export async function saveDeadline(month,day){return call('setMonthlyDeadline',{month,day})}
export async function markNotification(id){return call('readNotification',{id})}
export async function closeSheet(uid,month){return call('closeMonthlySheet',{uid,month})}

export async function openAttachment(path){if(!path.startsWith('atestados/'))throw Error('Anexo inválido');const blob=await getBlob(ref(storage,path));const url=URL.createObjectURL(blob);window.open(url,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(url),60000)}

export async function reopenSheet(uid,month,note){return call('reopenMonthlySheet',{uid,month,note})}
