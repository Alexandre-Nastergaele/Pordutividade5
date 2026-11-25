/** RUN ONCE by project owner with application default credentials. NEVER ship credentials. */
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
const uid=process.env.FIRST_RH_UID;
if(!uid)throw Error('Defina FIRST_RH_UID com UID real de uma conta já criada no Firebase Authentication.');
initializeApp({credential:applicationDefault()});const auth=getAuth(),user=await auth.getUser(uid);const db=getFirestore();
const profile={uid,name:process.env.FIRST_RH_NAME||'Responsável RH',role:'rh',email:user.email||'',rhUid:uid,job:'RH',registration:'RH',lotacao:process.env.RH_LOTACAO||'GP - GCM - GUARDA CIVIL MUNICIPAL'};
await db.doc(`users/${uid}`).set(profile,{merge:true});await db.doc(`directory/${uid}`).set({uid,name:profile.name,role:'rh',rhUid:uid},{merge:true});
const values={siteAddress:'Rua Marginal, 471 – Residencial Recanto do Bosque, Rio Verde - GO',gpsRadius:400,deadlines:{}};
// Coordinates deliberately NOT guessed. Fill verified GPS coordinates only after on-site validation.
if(process.env.VERIFIED_SITE_LAT && process.env.VERIFIED_SITE_LNG){values.gpsLat=Number(process.env.VERIFIED_SITE_LAT);values.gpsLng=Number(process.env.VERIFIED_SITE_LNG);}
await db.doc('settings/general').set(values,{merge:true});
console.log('RH inicial criado. Auth UID:',uid,'. As permissões são geridas no servidor, não no frontend.');
