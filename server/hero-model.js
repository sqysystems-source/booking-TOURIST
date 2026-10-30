import {villaError} from './villa-model.js';
export function validateHero(input){
 if(!input||!Array.isArray(input.slides)||input.slides.length>12||!Number.isInteger(input.intervalMs)||input.intervalMs<3000||input.intervalMs>30000)throw villaError('invalid');
 const slides=input.slides.map((slide,order)=>{
  if(!slide||typeof slide.r2Key!=='string'||!/^hero\/[a-f0-9-]+\.(jpg|png|webp)$/.test(slide.r2Key)||slide.id!==slide.r2Key.split('/')[1].split('.')[0]||typeof slide.url!=='string'||slide.url.length>2048||typeof slide.alt!=='string'||slide.alt.length>240)throw villaError('image');
  return {id:slide.id,url:slide.url,alt:slide.alt.trim(),r2Key:slide.r2Key,order};
 });
 if(new Set(slides.map(s=>s.r2Key)).size!==slides.length)throw villaError('image');
 return {slides,intervalMs:input.intervalMs};
}
