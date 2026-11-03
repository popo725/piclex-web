import {artwork} from './art.mjs';
import {combatVisuals} from './data/combat-visuals.mjs';
import {overrides} from './data/prototype-overrides.mjs';

function tile(ctx,index,x,y,size,angle=0,opacity=1){
  const image=artwork.combatFx;if(!image)return false;
  const w=image.naturalWidth/4,h=image.naturalHeight/2;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=opacity;
  // Sample the inner cell so faint generator residue in transparent gutters never appears.
  ctx.drawImage(image,index%4*w+w*.04,Math.floor(index/4)*h+h*.04,w*.92,h*.92,-size/2,-size/2,size,size);ctx.restore();return true;
}
export function drawPulse(ctx,b){
  if(!['laser','shredder'].includes(b.w?.id))return false;
  const laser=b.w.id==='laser',data=laser?combatVisuals.laser:combatVisuals.shredder;
  const startup=(b.age||0)<data.startupSeconds,angle=Math.atan2(b.dy,b.dx);
  const index=laser?(startup?0:1):2;
  // Correct for the generated atlas' transparent padding, preserving observed ink width.
  const bounds=laser&&startup?data.startupBounds:data.pulseBounds;
  const size=(bounds[2]-bounds[0])*overrides.worldScale/.68;
  const offset=(laser?combatVisuals.laser.hitboxOffset:23)*overrides.worldScale;
  return tile(ctx,index,b.x+Math.cos(angle)*offset,b.y+Math.sin(angle)*offset,size,angle);
}
export function drawExplosion(ctx,e){
  const data=combatVisuals.explosion,age=e.duration-e.life;
  if(age<data.flashSeconds)return tile(ctx,3,e.x,e.y,e.radius*2/.68,0,.8);
  const t=Math.max(0,Math.min(1,(age-data.flashSeconds)/data.smokeSeconds));
  const index=4+Math.min(3,Math.floor(t*4));
  const radius=data.smokeEmissionRadius*e.effectScale*overrides.worldScale*e.sizeMultiplier;
  const size=data.smokeSpriteSize*data.smokeScale*e.effectScale*overrides.worldScale/.68;
  let drawn=false;
  for(let i=0;i<data.smokeAmount;i++){
    // Visual offsets never consume gameplay RNG or alter subsequent explosion chances.
    const angle=i*2.399963+e.x*.01+e.y*.013,distance=radius*Math.sqrt((i+.5)/data.smokeAmount)+data.smokeVelocity*overrides.worldScale*t*data.smokeSeconds;
    drawn=tile(ctx,index,e.x+Math.cos(angle)*distance,e.y+Math.sin(angle)*distance,size*(1+t*.25),angle*(1-t),1-t)||drawn;
  }
  return drawn;
}

const smooth=t=>t*t*(3-2*t),outCubic=t=>1-(1-t)**3;
export function damageNumberFrame(number){
  const data=combatVisuals.damageNumber,duration=number.duration||data.duration;
  const progress=Math.max(0,Math.min(1,(duration-number.life)/duration));
  const entrance=smooth(Math.min(1,progress/.08));
  const fade=progress<=data.fadeStart?1:1-smooth((progress-data.fadeStart)/(1-data.fadeStart));
  let scale=1;
  if(progress<data.popEnd)scale=.56+.6*outCubic(progress/data.popEnd);
  else if(progress<data.settleEnd)scale=1.16-.16*smooth((progress-data.popEnd)/(data.settleEnd-data.popEnd));
  return {opacity:entrance*fade,scale,yOffset:progress?-data.rise*outCubic(progress):0,xOffset:progress?(number.driftX||0)*smooth(progress):0};
}
export function drawDamageNumber(ctx,number){
  const frame=damageNumberFrame(number),critical=number.critical;
  ctx.save();ctx.translate(number.x+frame.xOffset,number.y+frame.yOffset);ctx.scale(frame.scale,frame.scale);ctx.globalAlpha*=frame.opacity;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.miterLimit=2;
  ctx.font=`${critical?850:800} ${critical?24:20}px ui-rounded, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.lineWidth=critical?3.5:2.5;ctx.strokeStyle=critical?'#5d390f':'rgba(255,255,255,.96)';ctx.fillStyle=critical?'#f5c74c':'#555b61';
  ctx.shadowColor=critical?'rgba(255,190,50,.45)':'rgba(0,0,0,.34)';ctx.shadowBlur=critical?5:3;ctx.shadowOffsetY=2;
  const label=String(number.value);ctx.strokeText(label,0,0);ctx.fillText(label,0,0);ctx.restore();
}
