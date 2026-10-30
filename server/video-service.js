import {randomUUID} from 'node:crypto';
import {validVillaId,villaError} from './villa-model.js';
import {VIDEO_TYPES as TYPES,validateVideoFile} from './video-model.js';
export const imageId=key=>key.split('/').pop().split('.')[0];
export function validKey(id,key){validVillaId(id);if(typeof key!=='string'||!new RegExp('^villas/'+id+'/video/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\\.(mp4|webm)$').test(key))throw villaError('video');return key;}
export function createVideoService(db,r2){
 const villa=id=>db.collection('villas').doc(validVillaId(id)),asset=key=>db.collection('_villaVideos').doc(imageId(key));
 const registry=id=>db.collection('_villaVideos').where('villaId','==',id);
 async function erase(id,key){
  validKey(id,key);const target=asset(key);
  const record=await db.runTransaction(async tx=>{
   const [v,a]=await Promise.all([tx.get(villa(id)),tx.get(target)]);
   if(!a.exists)return null;const row=a.data();if(row.villaId!==id||row.key!==key)throw villaError('video');
   if(v.data()?.video?.r2Key===key||v.data()?.video?.url===row.url)throw villaError('referenced');
   if(row.state==='deleted')return null;
   if(row.state==='publishing'&&row.leaseUntil>Date.now())throw villaError('conflict');
   tx.update(target,{state:'deleting'});return row;
  });
  if(!record)return;
  // A concurrent save reads this registry row; deleting videos cannot be attached.
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
   validVillaId(id);validateVideoFile({type,size});
   await cleanup(id);
   const uuid=randomUUID(),key=`villas/${id}/video/${uuid}.${TYPES[type]}`,staging=`_uploads/videos/${id}/${uuid}.${TYPES[type]}`,now=Date.now();
   await db.runTransaction(async tx=>{
    const [v,entries]=await Promise.all([tx.get(villa(id)),tx.get(registry(id))]);if(!v.exists)throw villaError('conflict');
    if(entries.docs.filter(d=>['pending','ready','publishing'].includes(d.data().state)).length>=2)throw villaError('video');
    tx.create(asset(key),{villaId:id,key,staging,url:r2.url(key),type,size,state:'pending',createdAt:now,expiresAt:now+900000});
   });
   return {key,uploadUrl:await r2.sign(staging,type,size,900),headers:{'Content-Type':type},expiresAt:now+900000};
  },
  async complete({id,key}){
   validKey(id,key);const target=asset(key);
   const row=await db.runTransaction(async tx=>{
    const snap=await tx.get(target);if(!snap.exists)throw villaError('video');const row=snap.data();if(row.villaId!==id||row.key!==key)throw villaError('video');
    if(['ready','attached'].includes(row.state))return row;
    if(row.state!=='pending'||row.createdAt<Date.now()-86400000)throw villaError('conflict');
    tx.update(target,{state:'publishing',leaseUntil:Date.now()+120000});return row;
   });
   if(!['ready','attached'].includes(row.state)){
    try{await r2.publishVideo(row.staging,key,row.type,row.size);await target.update({state:'ready'});await r2.remove(row.staging).catch(()=>{});}
    catch(error){await target.update({state:'pending'});throw error;}
   }
   return {url:row.url,storageType:'r2',title:'',r2Key:key};
  },
  async discard({id,key}){await erase(id,key);return {ok:true};},
  async cleanup({id}){validVillaId(id);return {cleanupFailed:await cleanup(id)};}
 };
}
