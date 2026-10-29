import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const fields={apiKey:'FIREBASE_API_KEY',authDomain:'FIREBASE_AUTH_DOMAIN',projectId:'FIREBASE_PROJECT_ID',storageBucket:'FIREBASE_STORAGE_BUCKET',messagingSenderId:'FIREBASE_MESSAGING_SENDER_ID',appId:'FIREBASE_APP_ID'};
export function publicFirebaseConfig(env){
 const config={};
 for(const [key,name] of Object.entries(fields)){
  const value=String(env[name]??'').trim();
  if(!value||value.length>300||/^(YOUR_|PLACEHOLDER|REPLACE)/i.test(value)||/[\u0000-\u001f\u007f]/.test(value))throw new Error('Missing or invalid Vercel variable: '+name);
  config[key]=value;
 }
 for(const key of ['authDomain','storageBucket'])if(!/^[A-Za-z0-9.-]+$/.test(config[key]))throw new Error('Invalid '+fields[key]+' (hostname/bucket name only)');
 if(!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(config.projectId))throw new Error('Invalid FIREBASE_PROJECT_ID');
 if(!/^\d+$/.test(config.messagingSenderId))throw new Error('Invalid FIREBASE_MESSAGING_SENDER_ID');
 if(!/^1:\d+:web:[A-Za-z0-9]+$/.test(config.appId))throw new Error('Invalid FIREBASE_APP_ID');
 return config;
}
export function buildFirebaseConfig({env=process.env,target=new URL('../js/config/firebase-config.js',import.meta.url)}={}){
 const config=publicFirebaseConfig(env),source=readFileSync(target,'utf8');
 const pattern=/export const FIREBASE_CONFIG\s*=\s*\{[\s\S]*?\};/g;
 if([...source.matchAll(pattern)].length!==1)throw new Error('Expected exactly one FIREBASE_CONFIG declaration');
 // Emit only allowlisted PUBLIC fields, never server credentials.
 writeFileSync(target,source.replace(pattern,()=>`export const FIREBASE_CONFIG = ${JSON.stringify(config,null,2)};`));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{buildFirebaseConfig();console.log('Public Firebase web configuration generated.');}
 catch(error){console.error(error.message);process.exitCode=1;}
}
