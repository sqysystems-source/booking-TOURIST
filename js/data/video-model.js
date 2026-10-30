export const MAX_VIDEO_BYTES=200*1024*1024;
export const VIDEO_TYPES={'video/mp4':'mp4','video/webm':'webm'};
const fail=()=>{throw Object.assign(new Error('Invalid villa video'),{code:'villa/video'});};
export function embedVideo(value){
 let u;try{u=new URL(value);}catch{return fail();}
 if(u.protocol!=='https:'||u.username||u.password||u.port)fail();
 const host=u.hostname.toLowerCase();let id;
 if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host))id=u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/embed\/([\w-]{11})\/?$/)?.[1];
 else if(host==='youtu.be')id=u.pathname.slice(1).replace(/\/$/,'');
 if(id&&/^[\w-]{11}$/.test(id))return {url:'https://www.youtube-nocookie.com/embed/'+id,storageType:'youtube'};
 if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){id=u.pathname.match(/^\/(?:video\/)?([0-9]{1,12})\/?$/)?.[1];if(id)return {url:'https://player.vimeo.com/video/'+id,storageType:'vimeo'};}
 fail();
}
export function validateVideo(value,id){
 if(value==null)return null;
 if(typeof value!=='object'||Array.isArray(value)||typeof value.title!=='string'||value.title.length>200||typeof value.url!=='string'||value.url.length>2048)fail();
 const title=value.title.trim();
 if(value.storageType==='r2'){
  let u;try{u=new URL(value.url);}catch{return fail();}
  if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||typeof value.r2Key!=='string'||!/^[-A-Za-z0-9_]{1,128}$/.test(id)||!new RegExp('^villas/'+id+'/video/[a-f0-9-]+\\.(mp4|webm)$').test(value.r2Key))fail();
  return {url:u.href,storageType:'r2',r2Key:value.r2Key,title};
 }
 const embed=embedVideo(value.url);if(value.storageType!==embed.storageType)fail();return {...embed,title};
}
export function validateVideoFile(file){if(!file||!Object.hasOwn(VIDEO_TYPES,file.type)||!Number.isInteger(file.size)||file.size<16||file.size>MAX_VIDEO_BYTES)fail();return file;}
