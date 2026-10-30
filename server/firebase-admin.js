import {initializeApp,getApps,cert} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
export {FieldValue};
export function tenantAdmin(){
 const projectId=process.env.FIREBASE_PROJECT_ID,clientEmail=process.env.FIREBASE_CLIENT_EMAIL,privateKey=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,'\n');
 if(!projectId||!clientEmail?.endsWith('@'+projectId+'.iam.gserviceaccount.com')||!privateKey)throw new Error('Firebase Admin configuration');
 const app=getApps().find(a=>a.name==='tourist-backend')||initializeApp({projectId,credential:cert({projectId,clientEmail,privateKey})},'tourist-backend');
 return {db:getFirestore(app),auth:getAuth(app)};
}
