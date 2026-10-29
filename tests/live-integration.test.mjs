import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {SourceTextModule,createContext} from 'node:vm';
import {getDataMode,getVillas,resetCache} from '../js/data/villa-service.js';
import {SITE} from '../js/config/site-config.js';
import {normalizeVilla,normalizeVillas} from '../js/data/schema-map.js';
import {filterVillas,filtersFromParams,filtersToParams,guestOptions} from '../js/lib/filters.js';
const root=new URL('../',import.meta.url);
test('production mode cannot be switched back to demo, missing credentials fail explicitly',async()=>{for(const value of ['demo','auto','firestore']){SITE.dataSource=value;assert.equal(getDataMode().mode,'live');resetCache();await assert.rejects(()=>getVillas(),e=>e.code==='config');}SITE.dataSource='firestore';const source=readFileSync(new URL('../js/data/villa-service.js',import.meta.url),'utf8');assert.doesNotMatch(source,/import.*demo-source/);});
test('no demo banners, listing badges or noindex injection remain in the production UI',()=>{for(const file of ['js/ui/layout.js','js/ui/villa-card.js','js/pages/villa.js']){const code=readFileSync(new URL('../'+file,import.meta.url),'utf8');assert.doesNotMatch(code,/Demo mode\.|Demo listing|demo-bar|setNoIndexForDemo/);}});
test('admin write contract is consumed unchanged by the public schema and all filters',async()=>{
 // The same fixture also works when this project is checked out independently.
 const raw={name:'Real Villa',slug:'real-villa',island:'Paros',area:'Naoussa',description:'A real property.',shortDescription:'A villa.',images:[{url:'https://firebasestorage.googleapis.com/v0/b/test.firebasestorage.app/o/villas%2Freal-villa%2Fphoto.webp?alt=media',alt:'Pool',storagePath:'villas/real-villa/photo.webp'}],maxGuests:24,bedrooms:8,bathrooms:5,amenities:['pool','wifi','chef'],priceFrom:450,currency:'EUR',featured:true,published:true};
 const row=normalizeVilla(raw,'real-villa');assert.equal(row.name,raw.name);assert.equal(row.images[0].url,raw.images[0].url);assert.ok(row.amenities.some(v=>v.key==='chef'));assert.equal(filterVillas([row],{island:'paros',guests:20,amenities:['chef'],minPrice:400,maxPrice:500}).length,1);assert.equal(filterVillas([row],{minPrice:500}).length,0);assert.equal(guestOptions([row]).at(-1),24);assert.equal(normalizeVillas([{raw:{...raw,published:false},docId:'draft'}]).length,0);
 const filters=filtersFromParams(new URLSearchParams('minPrice=100&maxPrice=500'));assert.equal(filters.minPrice,100);assert.match(filtersToParams(filters).toString(),/maxPrice=500/);
});
test('live source queries server-only published documents for both catalog and slug, with no auth dependency',async()=>{
 const calls=[],record={name:'Live villa',slug:'live-villa',published:true};const context=createContext({console,setTimeout,clearTimeout});const modules=new Map();
 async function load(url){if(modules.has(url))return modules.get(url);let code;
  if(url.endsWith('/config/firebase-config.js'))code="export const FIREBASE_CONFIG={projectId:'tenant'},FIREBASE_SDK_VERSION='test',FIRESTORE_TIMEOUT_MS=1000,VILLAS_COLLECTION='villas';export const isFirebaseConfigured=()=>true;";
  else if(url.includes('gstatic.com')&&url.endsWith('firebase-app.js'))code="export const getApps=()=>[];export const initializeApp=c=>({options:c});export const getApp=()=>null;";
  else if(url.includes('gstatic.com'))code="export const getFirestore=a=>a;export const collection=(db,path)=>({db,path});export const where=(field,op,value)=>({field,op,value});export const limit=n=>({limit:n});export const query=(target,...filters)=>({target,filters});export async function getDocsFromServer(q){globalThis.calls.push(q);return {docs:[{id:'live-villa',data:()=>globalThis.record}]};}";
  else code=readFileSync(new URL(url),'utf8');const m=new SourceTextModule(code,{context,identifier:url,importModuleDynamically:async(specifier,parent)=>{const child=await load(new URL(specifier,parent.identifier).href);if(child.status==='unlinked')await child.link(link);if(child.status!=='evaluated')await child.evaluate();return child;}});modules.set(url,m);return m;}
 const link=(specifier,parent)=>load(new URL(specifier,parent.identifier).href);context.calls=calls;context.record=record;const module=await load(new URL('../js/data/sources/firestore-source.js',import.meta.url).href);await module.link(link);await module.evaluate();
 assert.equal((await module.namespace.fetchAllPublished())[0].raw.name,'Live villa');await module.namespace.fetchBySlug('live-villa');assert.equal(calls.length,2);for(const call of calls){assert.equal(call.target.path,'villas');assert.ok(call.filters.some(f=>f.field==='published'&&f.value===true));}assert.ok(calls[1].filters.some(f=>f.field==='slug'&&f.value==='live-villa'));
});

test('published villas without photos remain visible in the public catalog',()=>{
 const raw={name:'Villa without photos',slug:'villa-without-photos',island:'Paros',description:'A real property.',images:[],maxGuests:4,published:true};
 const rows=normalizeVillas([{raw,docId:'villa-without-photos'}]);
 assert.equal(rows.length,1);assert.deepEqual(rows[0].images,[]);assert.equal(rows[0].name,raw.name);
 const detail=readFileSync(new URL('../js/pages/villa.js',import.meta.url),'utf8');assert.match(detail,/Photos coming soon/);
 const images=readFileSync(new URL('../js/ui/images.js',import.meta.url),'utf8');assert.ok(images.includes('image?.url || PLACEHOLDER_IMAGE'));
 const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');assert.ok(rules.includes('(!d.published || d.description.size()>0)'));assert.ok(!rules.includes('d.images.size()>0'));
});
