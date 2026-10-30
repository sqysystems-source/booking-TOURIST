// Canonical write contract for booking-TOURIST/js/data/schema-map.js (EUR, no live booking claims).
export const TOURIST_ISLANDS=Object.freeze(['Santorini','Mykonos','Paros','Naxos','Crete','Milos','Corfu','Zakynthos']);
export const TOURIST_AMENITIES=Object.freeze(['pool','seaView','wifi','airConditioning','kitchen','chef','bbq','parking','beachNearby','outdoorDining','garden','jacuzzi','washer','petFriendly']);
const AMENITY_ALIASES={"pool":"pool","privatepool":"pool","swimmingpool":"pool","seaview":"seaView","view":"seaView","oceanview":"seaView","wifi":"wifi","internet":"wifi","airconditioning":"airConditioning","ac":"airConditioning","aircon":"airConditioning","kitchen":"kitchen","fullkitchen":"kitchen","equippedkitchen":"kitchen","chef":"chef","privatechef":"chef","chefservice":"chef","bbq":"bbq","barbecue":"bbq","barbeque":"bbq","grill":"bbq","parking":"parking","privateparking":"parking","freeparking":"parking","beachnearby":"beachNearby","walktobeach":"beachNearby","beachaccess":"beachNearby","nearbeach":"beachNearby","walktothebeach":"beachNearby","outdoordining":"outdoorDining","terracedining":"outdoorDining","alfrescodining":"outdoorDining","garden":"garden","privategarden":"garden","jacuzzi":"jacuzzi","hottub":"jacuzzi","whirlpool":"jacuzzi","washer":"washer","washingmachine":"washer","laundry":"washer","petfriendly":"petFriendly","petsallowed":"petFriendly","pets":"petFriendly"};
export function canonicalTouristAmenities(values){return [...new Set(values.map(v=>{const key=String(v).toLowerCase().replace(/[^a-z0-9]/g,'');return Object.hasOwn(AMENITY_ALIASES,key)?AMENITY_ALIASES[key]:String(v).trim();}))];}
export const MAX_VILLA_IMAGES=12,MAX_IMAGE_BYTES=8*1024*1024;
export const villaError=key=>Object.assign(new Error(key),{code:'villa/'+key});
const fail=key=>{throw villaError(key);};
export const villaSlug=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function text(v,max,required=false){const s=typeof v==='string'?v.trim():'';if(s.length>max||required&&!s||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s))fail('invalid');return s;}
export function validVillaId(id){if(typeof id!=='string'||!/^[-A-Za-z0-9_]{1,128}$/.test(id))fail('invalid');return id;}
export function safeVillaImageUrl(value){const s=text(value,2048,true);try{const u=new URL(s);if(u.protocol!=='https:'||u.username||u.password)fail('image');return u.href;}catch{if(/^assets\/[A-Za-z0-9_./-]+$/.test(s)&&!s.includes('..'))return s;fail('image');}}
export function validateVilla(input,id){
 validVillaId(id);const name=text(input.name,120,true),slug=text(input.slug,100,true);
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!TOURIST_ISLANDS.includes(input.island))fail('invalid');
 const count=(key,min,max)=>{const n=Number(input[key]);if(input[key]===''||input[key]==null||!Number.isInteger(n)||n<min||n>max)fail('invalid');return n;};
 const rawPrice=String(input.priceFrom??'').trim().replace(',','.');
 if(rawPrice&&!/^\d{1,7}(?:\.\d{1,2})?$/.test(rawPrice))fail('invalid');const priceFrom=rawPrice?Number(rawPrice):null;
 if(priceFrom!==null&&(priceFrom<=0||priceFrom>1000000))fail('invalid');
 if(!Array.isArray(input.amenities)||input.amenities.length>30||input.amenities.some(v=>typeof v!=='string'||!v.trim()||v.length>80)||new Set(input.amenities).size!==input.amenities.length)fail('invalid');
 if(!Array.isArray(input.images)||input.images.length>MAX_VILLA_IMAGES)fail('image');
 const images=input.images.map(image=>{
  if(!image||typeof image!=='object')fail('image');const storagePath=image.storagePath?text(image.storagePath,300,true):'';
  if(storagePath&&!new RegExp('^villas/'+id+'/[a-f0-9-]+\\.(jpg|png|webp)$').test(storagePath))fail('image');
  const r2Key=image.r2Key?text(image.r2Key,300,true):'';
  if(r2Key&&(storagePath||!new RegExp('^villas/'+id+'/[a-f0-9-]+\\.(jpg|png|webp)$').test(r2Key)))fail('image');
  return {url:safeVillaImageUrl(image.url),alt:text(image.alt||name,240),...(storagePath?{storagePath}:{}),...(r2Key?{r2Key}:{})};
 });
 if(new Set(images.map(i=>i.url)).size!==images.length)fail('image');
 if(typeof input.published!=='boolean'||typeof input.featured!=='boolean')fail('invalid');
 const description=text(input.description,12000),shortDescription=text(input.shortDescription,300);
 if(input.published&&!description)fail('publish');
 return {name,slug,island:input.island,area:text(input.area,120),description,shortDescription,images,maxGuests:count('maxGuests',1,100),bedrooms:count('bedrooms',0,50),bathrooms:count('bathrooms',0,50),amenities:canonicalTouristAmenities(input.amenities),priceFrom,currency:'EUR',featured:input.featured,published:input.published};
}
export function validateImageFile(file){if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||!Number.isFinite(file.size)||file.size<=0||file.size>MAX_IMAGE_BYTES)fail('image');return file;}
export function villaImageUrl(bucket,path){if(typeof bucket!=='string'||!bucket||/[/?#]/.test(bucket))fail('image');return 'https://firebasestorage.googleapis.com/v0/b/'+encodeURIComponent(bucket)+'/o/'+encodeURIComponent(path)+'?alt=media';}
export function filterTouristVillas(rows,{search='',island='',status=''}={}){const q=search.trim().toLowerCase();return rows.filter(v=>(!island||v.island===island)&&(!status||v.published===(status==='published'))&&(!q||[v.name,v.area,v.slug].some(s=>String(s||'').toLowerCase().includes(q))));}
