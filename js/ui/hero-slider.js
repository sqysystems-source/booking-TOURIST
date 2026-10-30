export function heroConfig(raw){
 const slides=(Array.isArray(raw?.slides)?raw.slides:[]).slice(0,12).filter(s=>{try{const u=new URL(s.url);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
 const intervalMs=Number.isInteger(raw?.intervalMs)&&raw.intervalMs>=3000&&raw.intervalMs<=30000?raw.intervalMs:5000;
 return {slides,intervalMs};
}
export function createSliderClock({next,intervalMs,setTimer=setInterval,clearTimer=clearInterval}){
 let timer=null;
 const stop=()=>{if(timer!==null)clearTimer(timer);timer=null;};
 const start=()=>{stop();timer=setTimer(next,intervalMs);};
 return {start,stop,advance(play=true){next();if(play)start();else stop();}};
}
export async function mountHeroSlider(){
 const track=document.getElementById('hero-slider-track'),button=document.getElementById('hero-next-btn'),pause=document.getElementById('hero-pause-btn');
 if(!track||!button||!pause)return;
 try{
  const {fetchHero}=await import('../data/sources/firestore-source.js');
  const {slides,intervalMs}=heroConfig(await fetchHero());if(!slides.length)return;
  // Keep the static fallback until at least one real image has loaded.
  const images=(await Promise.all(slides.map(slide=>new Promise(resolve=>{
   const img=new Image();img.className='hero-slide';img.alt=String(slide.alt||'Villa on the Greek islands');img.decoding='async';
   const timeout=setTimeout(()=>resolve(null),12000);
   img.onload=()=>{clearTimeout(timeout);resolve(img);};img.onerror=()=>{clearTimeout(timeout);resolve(null);};img.src=slide.url;
  })))).filter(Boolean);
  if(!images.length)return;
  let index=0;images[0].classList.add('is-active');images.forEach((img,i)=>img.setAttribute('aria-hidden',String(i!==0)));track.replaceChildren(...images);
  if(images.length<2)return;
  button.hidden=false;pause.hidden=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduced.matches;
  const canPlay=()=>!paused&&!document.hidden;
  const next=()=>{images[index].classList.remove('is-active');images[index].setAttribute('aria-hidden','true');index=(index+1)%images.length;images[index].classList.add('is-active');images[index].setAttribute('aria-hidden','false');};
  const clock=createSliderClock({next,intervalMs});
  const sync=()=>{pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');if(canPlay())clock.start();else clock.stop();};
  const advance=()=>clock.advance(canPlay()),toggle=()=>{paused=!paused;sync();};
  const motion=()=>{if(reduced.matches)paused=true;sync();};
  button.addEventListener('click',advance);pause.addEventListener('click',toggle);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',motion);
  window.addEventListener('pagehide',()=>clock.stop());window.addEventListener('pageshow',sync);sync();
 }catch(error){console.warn('[Hero] Using default homepage image.',error?.code||'unavailable');}
}
