import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createVillaService} from '../server/villa-service.js';
import {createVideoService} from '../server/video-service.js';
import {embedVideo,validateVideoFile,MAX_VIDEO_BYTES} from '../server/video-model.js';
import {createR2} from '../server/r2.js';
import {normalizeVilla} from '../js/data/schema-map.js';
function database(){
 const records=new Map();
 const snapshot=ref=>({ref,id:ref.id,exists:records.has(ref.path),data:()=>records.get(ref.path)});
 function collection(name){return {
  doc(id){const ref={id,path:name+'/'+id,get:async()=>snapshot(ref),update:async value=>records.set(ref.path,{...records.get(ref.path),...value}),delete:async()=>records.delete(ref.path)};return ref;},
  where(field,op,value){return {get:async()=>{const docs=[...records].filter(([p,v])=>p.startsWith(name+'/')&&v[field]===value).map(([p])=>snapshot(collection(name).doc(p.slice(name.length+1))));return {docs,empty:!docs.length};}};}
 };}
 return {records,collection,async runTransaction(fn){const writes=[];const result=await fn({get:r=>r.get(),set:(r,v)=>writes.push(()=>records.set(r.path,v)),create:(r,v)=>writes.push(()=>{assert(!records.has(r.path));records.set(r.path,v);}),update:(r,v)=>writes.push(()=>records.set(r.path,{...records.get(r.path),...v})),delete:r=>writes.push(()=>records.delete(r.path))});writes.forEach(f=>f());return result;}};
}
const draft={name:'Test',slug:'test',island:'Crete',area:'',description:'Villa',shortDescription:'',maxGuests:2,bedrooms:1,bathrooms:1,priceFrom:null,amenities:[],images:[],published:true,featured:false};

function fixture(){const db=database(),removed=[];const r2={url:key=>'https://images.example/'+key,sign:async()=> 'https://upload.example/signed',publishVideo:async()=>{},remove:async key=>removed.push(key)};return {db,r2,removed,villas:createVillaService(db,r2),videos:createVideoService(db,r2)};}
async function upload(videos){const signed=await videos.presign({id:'test',type:'video/mp4',size:1024});return videos.complete({id:'test',key:signed.key});}
test('video lifecycle protects saved video, preserves old-client edits, replaces with embed and cleans R2',async()=>{
 const {db,removed,villas,videos}=fixture();await villas.save({id:'test',input:draft,expected:null});const video=await upload(videos);
 await villas.save({id:'test',input:{...draft,video:{...video,title:'Tour'}},expected:1});
 assert.equal(db.records.get('villas/test').video.title,'Tour');assert.match(db.records.get('villas/test').video.updatedAt,/^20/);
 await assert.rejects(videos.discard({id:'test',key:video.r2Key}),{code:'villa/referenced'});
 await villas.save({id:'test',input:draft,expected:2});assert.equal(db.records.get('villas/test').video.url,video.url);
 const embed={...embedVideo('https://youtu.be/abcdefghijk'),title:'YouTube Tour'};
 await villas.save({id:'test',input:{...draft,video:embed},expected:3});assert(removed.includes(video.r2Key));
 const publicVilla=normalizeVilla(db.records.get('villas/test'),'test');assert.equal(publicVilla.video.storageType,'youtube');
 await assert.rejects(villas.save({id:'test',input:{...draft,video:null},expected:3}),{code:'villa/conflict'});
 await villas.save({id:'test',input:{...draft,video:null},expected:4});assert.equal(db.records.get('villas/test').video,null);
});
test('villa deletion cleans its video; unsaved discard cannot later attach deleted video',async()=>{
 const {removed,villas,videos}=fixture();await villas.save({id:'test',input:draft,expected:null});const video=await upload(videos);
 await videos.discard({id:'test',key:video.r2Key});await assert.rejects(villas.save({id:'test',input:{...draft,video},expected:1}));
 const next=await upload(videos);await villas.save({id:'test',input:{...draft,video:next},expected:1});await villas.remove({id:'test',expected:2});assert(removed.includes(next.r2Key));
});
test('video file and provider validation rejects unsafe URLs, unsupported files and forged R2 references',async()=>{
 assert.throws(()=>validateVideoFile({type:'video/mp4',size:MAX_VIDEO_BYTES+1}));assert.throws(()=>validateVideoFile({type:'video/quicktime',size:100}));
 for(const url of ['javascript:alert(1)','https://youtube.com.evil.example/watch?v=abcdefghijk','https://evil.example/video','http://vimeo.com/123'])assert.throws(()=>embedVideo(url));
 assert.equal(embedVideo('https://www.youtube.com/watch?v=abcdefghijk').url,'https://www.youtube-nocookie.com/embed/abcdefghijk');assert.equal(embedVideo('https://vimeo.com/123456').url,'https://player.vimeo.com/video/123456');
 const {villas}=fixture();await villas.save({id:'test',input:draft,expected:null});await assert.rejects(villas.save({id:'test',input:{...draft,video:{url:'https://evil.example/file.mp4',storageType:'r2',title:'Bad',r2Key:'villas/test/video/abcd.mp4'}},expected:1}));
 assert.equal(normalizeVilla({...draft,video:{url:'javascript:alert(1)'}},'test').video,null);
});
test('video completion uses bounded byte range and conditional copy, never downloads entire video',async()=>{
 const calls=[],header=Buffer.alloc(64);header.write('ftyp',4);
 const client={send:async cmd=>{calls.push(cmd);if(cmd.constructor.name==='HeadObjectCommand')return {ContentLength:1024,ContentType:'video/mp4',ETag:'etag'};if(cmd.constructor.name==='GetObjectCommand')return {ETag:'etag',ContentLength:64,Body:Readable.from([header])};return {};}};
 const storage=createR2({client,bucket:'configured-only',base:'https://images.example'});await storage.publishVideo('_uploads/videos/test/stage.mp4','villas/test/video/final.mp4','video/mp4',1024);
 assert.equal(calls[1].input.Range,'bytes=0-63');assert.equal(calls[1].input.IfMatch,'etag');assert.equal(calls[2].input.CopySourceIfMatch,'etag');assert.equal(calls[2].input.Bucket,'configured-only');assert.equal(calls[2].input.ContentType,'video/mp4');
 header.write('bad!',4);await assert.rejects(storage.publishVideo('_uploads/videos/test/stage.mp4','villas/test/video/final.mp4','video/mp4',1024),{code:'villa/video'});
});
