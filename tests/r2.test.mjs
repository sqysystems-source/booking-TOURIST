import test from 'node:test';
import assert from 'node:assert/strict';
import {createVillaService,validKey} from '../server/villa-service.js';
import {createR2,r2Config,imageSignature} from '../server/r2.js';
import {makeHandler,allowedOrigins} from '../api/r2.js';
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
function fixture(){const db=database(),removed=[];const r2={url:k=>'https://images.example.com/'+k,sign:async()=> 'https://upload.example.com/signed',publish:async()=>{},remove:async key=>removed.push(key)};return {db,r2,removed,service:createVillaService(db,r2)};}
test('upload, validate, attach, protect referenced image, detach and delete',async()=>{
 const {service,db,removed}=fixture();await service.save({id:'test',input:draft,expected:null});
 const signed=await service.presign({id:'test',type:'image/png',size:42});assert.equal(signed.headers['Content-Type'],'image/png');
 const image=await service.complete({id:'test',key:signed.key});assert(!image.url.includes('signed'));
 await service.save({id:'test',input:{...draft,images:[{...image,alt:'Cover'}]},expected:1});assert.equal(db.records.get('villas/test').images[0].alt,'Cover');
 await assert.rejects(service.discard({id:'test',key:signed.key}),{code:'villa/referenced'});assert(!removed.includes(signed.key));
 await service.save({id:'test',input:draft,expected:2});assert(removed.includes(signed.key));
 await assert.rejects(service.save({id:'test',input:{...draft,images:[image]},expected:3}),{code:'villa/image'});
});
test('invalid files, failed validation, foreign paths and stale saves fail closed',async()=>{
 const {service,r2}=fixture();await service.save({id:'test',input:draft,expected:null});
 for(const request of [{type:'image/svg+xml',size:10},{type:'image/png',size:8388609},{type:'image/png',size:0}])await assert.rejects(service.presign({id:'test',...request}),{code:'villa/image'});
 const signed=await service.presign({id:'test',type:'image/jpeg',size:12});r2.publish=async()=>{throw new Error('interrupted');};await assert.rejects(service.complete({id:'test',key:signed.key}));
 await assert.rejects(service.save({id:'test',input:{...draft,images:[{url:r2.url(signed.key),r2Key:signed.key}]},expected:1}),{code:'villa/image'});
 assert.throws(()=>validKey('other',signed.key));assert.throws(()=>validKey('test','https://evil.example/delete'));
 await assert.rejects(service.save({id:'test',input:draft,expected:null}),{code:'villa/conflict'});
});
test('legacy Firebase images survive edits and are never deleted',async()=>{
 const {service,db,removed}=fixture(),old={url:'https://firebasestorage.googleapis.com/old',alt:'Old',storagePath:'villas/test/abcd.jpg'};
 db.records.set('villas/test',{...draft,images:[old],revision:1});await service.save({id:'test',input:{...draft,images:[old]},expected:1});await service.remove({id:'test',expected:2});assert.equal(removed.length,0);
});
test('unsaved image discard, villa deletion, and public URL/cover/alt compatibility',async()=>{
 const {service,removed}=fixture();await service.save({id:'test',input:draft,expected:null});
 const a=await service.presign({id:'test',type:'image/webp',size:20});await service.complete({id:'test',key:a.key});await service.discard({id:'test',key:a.key});assert(removed.includes(a.key));
 const b=await service.presign({id:'test',type:'image/png',size:30});const image=await service.complete({id:'test',key:b.key});await service.save({id:'test',input:{...draft,images:[{...image,alt:'Sea'}]},expected:1});
 const publicVilla=normalizeVilla({...draft,images:[{...image,alt:'Sea'}]},'test');assert.equal(publicVilla.images[0].url,image.url);assert.equal(publicVilla.images[0].alt,'Sea');
 await service.remove({id:'test',expected:2});assert(removed.includes(b.key));
});
test('presigned PUT binds account, bucket, MIME and length for 120 seconds',async()=>{
 const env={R2_ACCOUNT_ID:'a'.repeat(32),R2_ACCESS_KEY_ID:'example',R2_SECRET_ACCESS_KEY:'example',R2_BUCKET_NAME:'tourist-images',R2_PUBLIC_BASE_URL:'https://images.example.com'};
 const url=new URL(await createR2(r2Config(env)).sign('_uploads/test/example.png','image/png',123));
 assert.equal(url.hostname,'a'.repeat(32)+'.r2.cloudflarestorage.com');assert(url.pathname.startsWith('/tourist-images/_uploads/test/'));assert.equal(url.searchParams.get('X-Amz-Expires'),'120');
 const headers=url.searchParams.get('X-Amz-SignedHeaders');assert(headers.includes('content-type'));assert(headers.includes('content-length'));
 assert.throws(()=>r2Config({...env,R2_PUBLIC_BASE_URL:'http://unsafe.example'}));assert(imageSignature(Buffer.from([137,80,78,71,13,10,26,10]),'image/png'));assert(!imageSignature(Buffer.from('<svg></svg>'),'image/png'));
});
test('origin does not grant access: missing/foreign/revoked tokens and non-admin fail',async()=>{
 const origin='https://sqy.example.com';assert.deepEqual(allowedOrigins(origin),[origin]);assert.throws(()=>allowedOrigins('*'));let storageCalls=0;
 async function request({token,role='admin',foreign=false,requestOrigin=origin,method='POST'}={}){
  const handler=makeHandler({origins:()=>[origin],storage:()=>{storageCalls++;throw new Error('must not reach');},admin:()=>({auth:{verifyIdToken:async(value,revoked)=>{assert.equal(revoked,true);if(foreign)throw new Error('wrong tenant or revoked');return {uid:'admin'};}},db:{collection:()=>({doc:()=>({get:async()=>({data:()=>({role})})})})}})});
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(s){this.code=s;return this;},json(b){this.body=b;return this;},end(){return this;}};
  await handler({method,headers:{origin:requestOrigin,authorization:token?'Bearer '+token:undefined},body:{action:'presign'}},res);return res;
 }
 assert.equal((await request()).code,401);assert.equal((await request({token:'foreign',foreign:true})).code,401);assert.equal((await request({token:'valid',role:'customer'})).code,403);assert.equal((await request({token:'valid',requestOrigin:'https://evil.example'})).code,403);assert.equal((await request({method:'OPTIONS'})).code,204);assert.equal(storageCalls,0);
});

test('publication checks actual bytes and uses an immutable destination distinct from upload key',async()=>{
 const {Readable}=await import('node:stream');const calls=[];let invalid=false;
 const png=Buffer.from([137,80,78,71,13,10,26,10]);
 const client={send:async command=>{calls.push(command);if(command.constructor.name==='GetObjectCommand')return {ContentLength:8,ContentType:'image/png',Body:Readable.from([invalid?Buffer.from('<svgbad>'):png])};return {};}};
 const r2=createR2({client,bucket:'only-this-bucket',base:'https://images.example.com'});
 await r2.publish('_uploads/test/stage.png','villas/test/final.png','image/png',8);
 assert.equal(calls[1].input.Key,'villas/test/final.png');assert.equal(calls[1].input.Bucket,'only-this-bucket');assert.deepEqual(calls[1].input.Body,png);
 invalid=true;await assert.rejects(r2.publish('_uploads/test/stage.png','villas/test/final.png','image/png',8),{code:'villa/image'});
 assert.equal(calls.filter(c=>c.constructor.name==='PutObjectCommand').length,1);
});

test('server enforces saved gallery and pending upload limits independently',async()=>{
 const {service,db}=fixture();await service.save({id:'test',input:draft,expected:null});
 for(let i=0;i<12;i++)await service.presign({id:'test',type:'image/png',size:8});
 await assert.rejects(service.presign({id:'test',type:'image/png',size:8}),{code:'villa/image'});
 await assert.rejects(service.save({id:'test',input:{...draft,images:Array.from({length:13},(_,i)=>({url:'https://images.example.com/'+i,alt:''}))},expected:1}),{code:'villa/image'});
 assert.equal(db.records.get('villas/test').images.length,0);
});
