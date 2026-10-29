// Run only against local Firestore + Storage emulators; never production.
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,query,where,updateDoc,serverTimestamp} from 'firebase/firestore';
import {ref,uploadBytes,getBytes} from 'firebase/storage';
for(const key of ['FIRESTORE_EMULATOR_HOST','FIREBASE_STORAGE_EMULATOR_HOST'])if(!/^(127\.0\.0\.1|localhost):\d+$/.test(process.env[key]||''))throw new Error('Local emulators are required: '+key);
const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':'),[storageHost,storagePort]=process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(':');
const env=await initializeTestEnvironment({projectId:'demo-tourist-integration',firestore:{host,port:Number(port),rules:readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')},storage:{host:storageHost,port:Number(storagePort),rules:readFileSync(new URL('../storage.rules',import.meta.url),'utf8')}});
try{
 await env.clearFirestore();await env.clearStorage();await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'users/owner'),{role:'admin'});await setDoc(doc(c.firestore(),'users/visitor'),{role:'customer'});});
 const admin=env.authenticatedContext('owner'),anon=env.unauthenticatedContext(),visitor=env.authenticatedContext('visitor');
 const base={id:'villa-aegean',name:'Aegean',slug:'villa-aegean',island:'Paros',area:'Naoussa',description:'A real property.',shortDescription:'A villa.',maxGuests:6,bedrooms:3,bathrooms:2,amenities:Array.from({length:30},(_,i)=>'Custom '+i),images:Array.from({length:12},(_,i)=>({url:'https://example.com/'+i+'.webp',alt:'Photo '+i,storagePath:'villas/villa-aegean/'+String(i).padStart(8,'a')+'.webp'})),priceFrom:450,currency:'EUR',featured:true,published:true,revision:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
 // Full array boundaries also verify the Firestore rules expression budget.
 await assertSucceeds(setDoc(doc(admin.firestore(),'villas/villa-aegean'),base));
 await assertSucceeds(getDocs(query(collection(anon.firestore(),'villas'),where('published','==',true))));
 await assertFails(getDocs(collection(anon.firestore(),'villas')));
 await assertFails(setDoc(doc(visitor.firestore(),'villas/villa-aegean'),base));
 await assertFails(updateDoc(doc(visitor.firestore(),'users/visitor'),{role:'admin'}));
 for(const change of [{priceFrom:-1},{maxGuests:0},{island:'Unknown'},{images:[{url:'javascript:alert(1)',alt:''}]},{images:[...base.images,base.images[0]]},{amenities:[{bad:true}]}])await assertFails(updateDoc(doc(admin.firestore(),'villas/villa-aegean'),{...change,revision:2,updatedAt:serverTimestamp()}));
 const path='villas/villa-aegean/aaaaaaaa.webp';await assertSucceeds(uploadBytes(ref(admin.storage(),path),new Uint8Array([1,2,3]),{contentType:'image/webp',cacheControl:'private, no-store'}));
 await assertSucceeds(getBytes(ref(anon.storage(),path)));
 await assertFails(uploadBytes(ref(anon.storage(),path),new Uint8Array([1]),{contentType:'image/webp'}));
 await assertFails(uploadBytes(ref(visitor.storage(),path),new Uint8Array([1]),{contentType:'image/webp'}));
 await assertFails(uploadBytes(ref(admin.storage(),'villas/villa-aegean/aaaaaaaa.svg'),new Uint8Array([1]),{contentType:'image/svg+xml'}));
 await assertFails(uploadBytes(ref(admin.storage(),path),new Uint8Array(8388609),{contentType:'image/webp'}));
 await assertSucceeds(updateDoc(doc(admin.firestore(),'villas/villa-aegean'),{published:false,revision:2,updatedAt:serverTimestamp()}));
 await assertFails(getDoc(doc(anon.firestore(),'villas/villa-aegean')));await assertFails(getBytes(ref(anon.storage(),path)));await assertSucceeds(getDoc(doc(admin.firestore(),'villas/villa-aegean')));
 console.log('Tourist Firestore and Storage emulator scenarios passed.');
}finally{await env.cleanup();}
