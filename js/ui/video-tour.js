import {h} from '../lib/dom.js';
export function createVideoTour(villa){
 const video=villa.video;if(!video)return null;
 const title=video.title||'Video walkthrough';
 const host=h('div',{class:'video-tour-player'});
 if(video.storageType==='r2'){
  const player=h('video',{controls:true,playsinline:true,preload:'metadata',src:video.url,'aria-label':title,poster:villa.images[0]?.url},'Your browser cannot play this video.');
  player.addEventListener('error',()=>{note.textContent='Video unavailable. Please try again later.';});
  const note=h('p',{role:'status'});host.append(player);
  return h('section',{class:'detail-block video-tour','aria-labelledby':'video-tour-title'},h('h2',{id:'video-tour-title'},title),host,note);
 }
 const provider=video.storageType==='youtube'?'YouTube':'Vimeo';
 const load=h('button',{type:'button'},'Play video on '+provider);
 load.addEventListener('click',()=>{host.replaceChildren(h('iframe',{src:video.url,title,loading:'lazy',allow:'fullscreen; picture-in-picture',allowfullscreen:true,referrerpolicy:'strict-origin-when-cross-origin'}));});host.append(load);
 return h('section',{class:'detail-block video-tour','aria-labelledby':'video-tour-title'},h('h2',{id:'video-tour-title'},title),host,h('p',{},'The player connects to '+provider+' when you press Play.'));
}
