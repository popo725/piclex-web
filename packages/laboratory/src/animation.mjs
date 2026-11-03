import { animations } from './animation-data.mjs';
export const animationDuration=name=>animations[name].frames.length/animations[name].fps;
export function cueAnimation(entity,name){
  if(entity.animation==='Death')return;
  if(name==='Attack'&&['Attack','Hurt'].includes(entity.animation)&&entity.animationTime<animationDuration(entity.animation))return;
  entity.animation=name;entity.animationTime=0;
}
export function advanceAnimation(entity,dt,moving=false,walkRate=1){
  const current=entity.animation||'Idle';
  entity.animationTime=(entity.animationTime||0)+dt*(current==='Walk'?walkRate:1);
  if(current==='Death')return;
  if(!animations[current].loop&&entity.animationTime<animationDuration(current))return;
  const next=moving?'Walk':'Idle';
  if(next!==current){entity.animation=next;entity.animationTime=0;}
}
export function animationFrame(entity){
  const animation=animations[entity.animation]||animations.Idle;
  let index=Math.floor((entity.animationTime||0)*animation.fps);
  index=animation.loop?index%animation.frames.length:Math.min(index,animation.frames.length-1);
  return animation.frames[index];
}
