import {createVideoService} from './video-service.js';
import {randomUUID} from 'node:crypto';
import {validateVilla,validVillaId,villaError} from './villa-model.js';
import {TYPES,MAX_BYTES} from './r2.js';
import {FieldValue} from './firebase-admin.js';
export const imageId=key=>key.split('/').pop().split('.')[0];
export function validKey(id,key){validVillaId(id);if(typeof key!=='string'||!new RegExp('^villas/'+id+'/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\\.(jpg|png|webp)$').test(key))throw villaError('image');return key;}
export function createVillaService(db,r2){
 const villa=id=>db.collection('villas').doc(validVillaId(id)),asset=key=>db.collection('_villaImages').doc(imageId(key));
 const videos=id=>db.collection('_villaVideos').where('villaId','==',id);
 const registry=id=>db.collection('_villaImages').where('villaId','==',id);
 const legacy=old=>(old?.images||[]).map(i=>typeof i==='string'?{url:i,alt:''}:i);
 function checkRevision(old,expected){if((old?old.revision||0:null)!==expected)throw villaError('conflict');}
 async function erase(id,key){
  validKey(id,key);const target=asset(key);
  const record=await db.runTransaction(async tx=>{
   const [v,a]=await Promise.all([tx.get(villa(id)),tx.get(target)]);
   if(!a.exists)return null;const row=a.data();if(row.villaId!==id||row.key!==key)throw villaError('image');
   if((v.data()?.images||[]).some(i=>i.r2Key===key||i.url===row.url))throw villaError('referenced');
   if(row.state==='deleted')return null;
   if(row.state==='publishing'&&row.leaseUntil>Date.now())throw villaError('conflict');
   tx.update(target,{state:'deleting'});return row;
  });
  if(!record)return;
  // A concurrent save reads this registry row; deleting images cannot be attached.
  await r2.remove(key);await r2.remove(record.staging);
  // Keep tombstone until the staging PUT has expired, permitting safe retries.
  await target.update({state:'deleted',deletedAt:Date.now()});
 }
 async function cleanup(id){
  let failed=0;const entries=await registry(id).get();
  for(const d of entries.docs){const row=d.data();if(row.state==='attached'||row.state==='publishing'&&row.leaseUntil>Date.now())continue;
   if(row.state==='deleting'||row.state==='deleted'||row.createdAt<Date.now()-86400000){try{await erase(id,row.key);if(row.expiresAt<Date.now()){await r2.remove(row.staging);if(row.state==='deleted')await d.ref.delete();}}catch{failed++;}}
  }return failed;
 }
 return {
  async presign({id,type,size}){
   validVillaId(id);if(!Object.hasOwn(TYPES,type)||!Number.isInteger(size)||size<=0||size>MAX_BYTES)throw villaError('image');
   await cleanup(id);
   const uuid=randomUUID(),key=`villas/${id}/${uuid}.${TYPES[type]}`,staging=`_uploads/${id}/${uuid}.${TYPES[type]}`,now=Date.now();
   await db.runTransaction(async tx=>{
    const [v,entries]=await Promise.all([tx.get(villa(id)),tx.get(registry(id))]);if(!v.exists)throw villaError('conflict');
    if(entries.docs.filter(d=>['pending','ready','publishing'].includes(d.data().state)).length>=12)throw villaError('image');
    tx.create(asset(key),{villaId:id,key,staging,url:r2.url(key),type,size,state:'pending',createdAt:now,expiresAt:now+120000});
   });
   return {key,uploadUrl:await r2.sign(staging,type,size),headers:{'Content-Type':type},expiresAt:now+120000};
  },
  async complete({id,key}){
   validKey(id,key);const target=asset(key);
   const row=await db.runTransaction(async tx=>{
    const snap=await tx.get(target);if(!snap.exists)throw villaError('image');const row=snap.data();if(row.villaId!==id||row.key!==key)throw villaError('image');
    if(['ready','attached'].includes(row.state))return row;
    if(row.state!=='pending'||row.createdAt<Date.now()-86400000)throw villaError('conflict');
    tx.update(target,{state:'publishing',leaseUntil:Date.now()+120000});return row;
   });
   if(!['ready','attached'].includes(row.state)){
    try{await r2.publish(row.staging,key,row.type,row.size);await target.update({state:'ready'});await r2.remove(row.staging).catch(()=>{});}
    catch(error){await target.update({state:'pending'});throw error;}
   }
   return {url:row.url,alt:'',r2Key:key};
  },
  async save({id,input,expected}){
   validVillaId(id);const value=validateVilla(input,id),target=villa(id);
   await db.runTransaction(async tx=>{
    const snap=await tx.get(target),old=snap.data();checkRevision(old,expected);
    if(old&&old.slug!==value.slug)throw villaError('slugLocked');
    if(!old){if(id!==value.slug)throw villaError('invalid');const duplicates=await tx.get(db.collection('villas').where('slug','==',value.slug));if(!duplicates.empty)throw villaError('duplicate');}
    const videoEntries=await tx.get(videos(id));
    if(!Object.hasOwn(value,'video'))value.video=old?.video||null;
    if(value.video?.storageType==='r2'){const entry=videoEntries.docs.find(d=>d.data().key===value.video.r2Key)?.data();if(!entry||!['ready','attached'].includes(entry.state)||entry.url!==value.video.url)throw villaError('video');}
    if(value.video){value.video.updatedAt=['url','title','storageType','r2Key'].every(k=>value.video[k]===old?.video?.[k])?(old.video.updatedAt||new Date().toISOString()):new Date().toISOString();}
    const entries=await tx.get(registry(id)),byKey=new Map(entries.docs.map(d=>[d.data().key,d]));
    for(const image of value.images){
     if(image.r2Key){const entry=byKey.get(validKey(id,image.r2Key)),row=entry?.data();if(!row||!['ready','attached'].includes(row.state)||image.url!==row.url)throw villaError('image');}
     else if(!legacy(old).some(i=>i.url===image.url&&(i.storagePath||'')===(image.storagePath||'')&&!i.r2Key))throw villaError('image');
    }
    for(const entry of entries.docs){const row=entry.data(),used=value.images.some(i=>i.r2Key===row.key);if(used)tx.update(entry.ref,{state:'attached'});else if(row.state==='attached')tx.update(entry.ref,{state:'deleting'});}
    for(const entry of videoEntries.docs){const row=entry.data();if(value.video?.r2Key===row.key)tx.update(entry.ref,{state:'attached'});else if(row.state==='attached')tx.update(entry.ref,{state:'deleting'});}
    tx.set(target,{...value,id:old?.id||id,revision:(old?.revision||0)+1,createdAt:old?.createdAt||FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
   });
   return {id,cleanupFailed:(await cleanup(id))+(await createVideoService(db,r2).cleanup({id})).cleanupFailed};
  },
  async remove({id,expected}){
   validVillaId(id);await db.runTransaction(async tx=>{
    const [snap,entries]=await Promise.all([tx.get(villa(id)),tx.get(registry(id))]);if(!snap.exists)throw villaError('conflict');checkRevision(snap.data(),expected);
    const videoEntries=await tx.get(videos(id));
    if(videoEntries.docs.some(d=>d.data().state==='publishing'&&d.data().leaseUntil>Date.now()))throw villaError('conflict');
    for(const d of videoEntries.docs)tx.update(d.ref,{state:'deleting'});
    if(entries.docs.some(d=>d.data().state==='publishing'&&d.data().leaseUntil>Date.now()))throw villaError('conflict');
    for(const d of entries.docs)tx.update(d.ref,{state:'deleting'});tx.delete(villa(id));
   });return {cleanupFailed:(await cleanup(id))+(await createVideoService(db,r2).cleanup({id})).cleanupFailed};
  },
  async discard({id,key}){await erase(id,key);return {ok:true};},
  async cleanup({id}){validVillaId(id);return {cleanupFailed:(await cleanup(id))+(await createVideoService(db,r2).cleanup({id})).cleanupFailed};}
 };
}
