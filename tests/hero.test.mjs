import test from 'node:test';
import assert from 'node:assert/strict';
import {createHeroService} from '../server/hero-service.js';
import {heroConfig,createSliderClock} from '../js/ui/hero-slider.js';
function database(){
 const records=new Map();
 const snapshot=ref=>({ref,id:ref.id,exists:records.has(ref.path),data:()=>records.get(ref.path)});
 function collection(name){return {
  doc(id){const ref={id,path:name+'/'+id,get:async()=>snapshot(ref),update:async value=>records.set(ref.path,{...records.get(ref.path),...value}),delete:async()=>records.delete(ref.path)};return ref;},
  where(field,op,value){return {get:async()=>{const docs=[...records].filter(([p,v])=>p.startsWith(name+'/')&&v[field]===value).map(([p])=>snapshot(collection(name).doc(p.slice(name.length+1))));return {docs,empty:!docs.length};}};}
 };}
 return {records,collection,async runTransaction(fn){const writes=[];const result=await fn({get:r=>r.get(),set:(r,v)=>writes.push(()=>records.set(r.path,v)),create:(r,v)=>writes.push(()=>{assert(!records.has(r.path));records.set(r.path,v);}),update:(r,v)=>writes.push(()=>records.set(r.path,{...records.get(r.path),...v})),delete:r=>writes.push(()=>records.delete(r.path))});writes.forEach(f=>f());return result;}};
}

function fixture(){const db=database(),removed=[];const r2={url:key=>'https://images.example.com/'+key,sign:async()=> 'https://r2.example/signed',publish:async()=>{},remove:async key=>removed.push(key)};return {db,removed,service:createHeroService(db,r2)};}
async function upload(service){const signed=await service.presign({id:'hero',type:'image/png',size:8});return service.complete({id:'hero',key:signed.key});}
test('hero upload/save/reorder/alt/duration protects attached images and checks revisions',async()=>{
 const {service,db,removed}=fixture();const a=await upload(service),b=await upload(service);
 assert(a.r2Key.startsWith('hero/'));assert(!a.url.includes('signed'));
 await service.save({id:'hero',input:{slides:[{...b,alt:'Sea'},{...a,alt:'Terrace'}],intervalMs:7000},expected:null});
 const saved=db.records.get('site_content/hero');assert.equal(saved.intervalMs,7000);assert.equal(saved.slides[0].id,b.id);assert.equal(saved.slides[1].order,1);assert.equal(saved.slides[0].alt,'Sea');
 await assert.rejects(service.discard({id:'hero',key:b.r2Key}),{code:'villa/referenced'});assert(!removed.includes(b.r2Key));
 await assert.rejects(service.save({id:'hero',input:{slides:[],intervalMs:5000},expected:null}),{code:'villa/conflict'});
 await service.save({id:'hero',input:{slides:[a],intervalMs:5000},expected:1});assert(removed.includes(b.r2Key));assert(!removed.includes(a.r2Key));
 await service.save({id:'hero',input:{slides:[],intervalMs:5000},expected:2});assert(removed.includes(a.r2Key));assert.equal(db.records.get('site_content/hero').slides.length,0);
});
test('hero rejects spoofed URL, wrong scope/key, duplicate images and invalid duration/size',async()=>{
 const {service}=fixture();const slide=await upload(service);
 for(const input of [{slides:[{...slide,url:'https://evil.example/photo'}],intervalMs:5000},{slides:[slide,slide],intervalMs:5000},{slides:[],intervalMs:500},{slides:[],intervalMs:NaN}])await assert.rejects(service.save({id:'hero',input,expected:null}));
 await assert.rejects(service.complete({id:'hero',key:'villas/test/11111111-1111-4111-8111-111111111111.png'}));
 await assert.rejects(service.presign({id:'other',type:'image/png',size:8}));await assert.rejects(service.presign({id:'hero',type:'image/png',size:8388609}));
 await service.discard({id:'hero',key:slide.r2Key});await assert.rejects(service.save({id:'hero',input:{slides:[slide],intervalMs:5000},expected:null}));
});
test('clock resets full interval on manual next and stops when paused',()=>{
 let active=null,next=0,clears=0;const clock=createSliderClock({next:()=>next++,intervalMs:5000,setTimer:(fn,ms)=>{assert.equal(ms,5000);active=fn;return ++clears;},clearTimer:()=>{active=null;}});
 clock.start();active();assert.equal(next,1);const previous=active;clock.advance();assert.equal(next,2);assert(active);assert.equal(clears,2);clock.stop();assert.equal(active,null);clock.advance(false);assert.equal(next,3);assert.equal(active,null);
});
test('public config defaults and stable ordering exclude unsafe URLs',()=>{
 assert.deepEqual(heroConfig(null),{slides:[],intervalMs:5000});
 const result=heroConfig({slides:[{url:'https://images.example/b',order:1},{url:'javascript:bad',order:0},{url:'https://images.example/a',order:0}],intervalMs:1});assert.equal(result.intervalMs,5000);assert.equal(result.slides[0].url,'https://images.example/a');assert.equal(result.slides.length,2);
});
test('existing authenticated API routes hero actions to fixed tenant scope, not browser IDs',async()=>{
 const {makeHandler}=await import('../api/r2.js');const {db}=fixture();db.records.set('users/admin',{role:'admin'});
 const handler=makeHandler({origins:()=>['https://www.sqysystems.com'],admin:()=>({db,auth:{verifyIdToken:async()=>({uid:'admin'})}}),storage:()=>({url:key=>'https://images.example/'+key,sign:async()=> 'https://r2.example/signed',remove:async()=>{}})});
 const res={setHeader(){},status(n){this.statusCode=n;return this;},json(value){this.value=value;return this;}};
 await handler({method:'POST',headers:{origin:'https://www.sqysystems.com',authorization:'Bearer tenant-token'},body:{action:'hero-presign',id:'some-other-tenant',type:'image/png',size:8,bucket:'attacker-bucket'}},res);
 assert.equal(res.statusCode,200);assert(res.value.key.startsWith('hero/'));assert.equal(db.records.has('villas/some-other-tenant'),false);
});
