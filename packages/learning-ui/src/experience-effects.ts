import {makeFlight,flightPoint,symbols,MAX_PARTICLES} from './experience-flight.mjs';
import {emojiSprite,prepareEmojiSprites,stopEmojiPreparation} from './emoji-sprites';
export {prepareEmojiSprites as prepareExperienceEffects} from './emoji-sprites';
let canvas:HTMLCanvasElement|null=null,frame=0,particles:any[]=[];
export function clearExperienceEffects(){stopEmojiPreparation();cancelAnimationFrame(frame);frame=0;particles=[];canvas?.remove();canvas=null;}
export function emitExperience(sources:DOMRect[],complete=false,perfect=false,effect='socialCode'){
 if(!sources.length||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 prepareEmojiSprites();
 const origin=document.querySelector('.native-answer')?.getBoundingClientRect()||sources[0],photo=document.querySelector('.photo-browse')?.getBoundingClientRect()||origin;
 const meter=document.querySelector('.learning-experience');if(!meter)return;
 const bounds=document.querySelector('.native-practice')?.getBoundingClientRect();
 canvas??=Object.assign(document.createElement('canvas'),{className:'experience-particles'});canvas.setAttribute('aria-hidden','true');if(!canvas.isConnected)document.body.append(canvas);
 const ratio=Math.min(2,devicePixelRatio||1),width=Math.round(innerWidth*ratio),height=Math.round(innerHeight*ratio);
 // Assigning even the same dimensions clears every live particle and resets
 // the backing store. Reuse it throughout a burst; resize only when needed.
 if(canvas.width!==width)canvas.width=width;
 if(canvas.height!==height)canvas.height=height;
 const now=performance.now(),count=complete?32:Math.min(15,sources.length*5);
 for(let i=0;i<count&&particles.length<MAX_PARTICLES;i++){const flight=makeFlight({source:sources[i%sources.length],origin,photo,width:bounds?.right||innerWidth,leftBound:bounds?.left||0,perfect});particles.push({...flight,start:now,effect});}
 if(frame)return;
 const draw=(time:number)=>{const ctx=canvas?.getContext('2d');if(!ctx||document.hidden){clearExperienceEffects();return;}ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);
  const meter=document.querySelector('.learning-experience'),bounds=meter?.getBoundingClientRect();if(!bounds){clearExperienceEffects();return;}const fraction=Number(meter?.getAttribute('aria-valuenow')||0)/100,target={x:bounds.left+bounds.width*fraction,y:bounds.top+bounds.height/2};
  particles=particles.filter(p=>time<p.start+p.delay+p.duration);
  for(const p of particles){const t=(time-p.start-p.delay)/p.duration;if(t<0)continue;const pt=flightPoint(p,t,target),distance=Math.hypot(pt.x-target.x,pt.y-target.y),scale=t>=p.stages[4]?Math.min(1,distance/3):1;ctx.save();ctx.translate(pt.x,pt.y);ctx.rotate(p.rotation+p.spin*t);ctx.scale(scale,scale);ctx.globalAlpha=Math.min(1,t*35);if(p.effect==='judgmentLight'){ctx.fillStyle='#fff';ctx.shadowColor='#8dbafc';ctx.shadowBlur=6;const r=p.radius*1.8;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.23,-r*.23);ctx.lineTo(r,0);ctx.lineTo(r*.23,r*.23);ctx.lineTo(0,r);ctx.lineTo(-r*.23,r*.23);ctx.lineTo(-r,0);ctx.lineTo(-r*.23,-r*.23);ctx.closePath();ctx.fill();}else{const sprite=emojiSprite(p.emoji);if(sprite){const size=sprite.cell/sprite.ratio*Math.min(14,p.radius*4)/14;ctx.drawImage(sprite.image,sprite.x,sprite.y,sprite.cell,sprite.cell,-size/2,-size/2,size,size);}else{ctx.font=`${Math.min(14,p.radius*4)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(symbols[p.emoji],0,0);}}ctx.restore();}
  if(particles.length)frame=requestAnimationFrame(draw);else clearExperienceEffects();
 };frame=requestAnimationFrame(draw);
}
if(typeof window!=='undefined'){window.addEventListener('pagehide',clearExperienceEffects);window.addEventListener('resize',clearExperienceEffects);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearExperienceEffects();});matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)clearExperienceEffects();});}
