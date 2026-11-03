import { artwork } from './art.mjs';
import { animationFrame } from './animation.mjs';
import { spriteOrigin } from './animation-data.mjs';
import { overrides } from './data/prototype-overrides.mjs';
import { enemyVisual } from './enemy-visuals.mjs';

// Player light stays distinct from enemy threat ranks. Shape also carries the rank.
const playerLight={color:'#c4f3fb',width:1.8,shape:'solid'};
const threats={
  blob:{color:'#d9bd86',width:1.1,shape:'solid'},
  runner:{color:'#efa269',width:1.5,shape:'broken'},
  tank:{color:'#ef7380',width:1.8,shape:'double'},
  elite:{color:'#ef655f',width:2,shape:'double'},
  boss:{color:'#dc485a',width:2.4,shape:'boss'},
};
const halos=new Map(),sprites=new WeakMap();
const scale=2;
function surface(width,height){
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);
  const context=canvas.getContext('2d');context.scale(scale,scale);return {canvas,context};
}
function halo(ctx,x,y,r,light){
  const key=`${r}:${light.color}:${light.shape}`;
  let image=halos.get(key);
  const extent=r*2.2;
  if(!image){
    const {canvas,context:c}=surface(extent*2,extent*2);
    const gradient=c.createRadialGradient(extent,extent-r*.1,r*.2,extent,extent-r*.1,r*1.9);
    gradient.addColorStop(0,light.color+'38');gradient.addColorStop(.6,light.color+'1c');gradient.addColorStop(1,light.color+'00');
    c.fillStyle=gradient;c.fillRect(0,0,extent*2,extent*2);
    const ring=(radius,width,color)=>{c.beginPath();c.ellipse(extent,extent+r*1.3,radius,radius*.48,0,0,Math.PI*2);c.lineWidth=width;c.strokeStyle=color;c.stroke();};
    ring(r+3,light.width+2,'#131716b8');
    if(light.shape==='broken')c.setLineDash([7,4]);
    ring(r+3,light.width,light.color);
    c.setLineDash([]);
    if(light.shape==='double')ring(r+7,1.3,light.color+'b8');
    if(light.shape==='boss'){ring(r+8,1.5,light.color+'cc');ring(r+13,1,light.color+'78');}
    image=canvas;halos.set(key,image);
  }
  ctx.drawImage(image,x-extent,y-extent,extent*2,extent*2);
}
function readable(ctx,image,crop,x,y,width,height,color,flash=false){
  // Bake edging and light into a few small sprites, rather than blur every monster each frame.
  let cache=sprites.get(image);if(!cache){cache=new Map();sprites.set(image,cache);}
  const key=`${crop.join(':')}:${width}:${height}:${color}`;
  let pair=cache.get(key);
  const pad=4;
  if(!pair){
    const {canvas:mask,context:m}=surface(width,height);
    m.drawImage(image,...crop,0,0,width,height);m.globalCompositeOperation='source-in';m.fillStyle=color;m.fillRect(0,0,width,height);
    const {canvas:normal,context:n}=surface(width+pad*2,height+pad*2);
    n.globalAlpha=.4;
    for(let i=0;i<8;i++){const angle=i*Math.PI/4;n.drawImage(mask,pad+Math.cos(angle)*.8,pad+Math.sin(angle)*.8,width,height);}
    n.globalAlpha=1;n.globalCompositeOperation='destination-out';n.drawImage(image,...crop,pad,pad,width,height);
    n.globalCompositeOperation='source-over';n.drawImage(image,...crop,pad,pad,width,height);
    m.fillStyle='#fff';m.fillRect(0,0,width,height);
    n.globalAlpha=.1;n.drawImage(mask,pad,pad,width,height);n.globalAlpha=1;
    const {canvas:hit,context:h}=surface(width+pad*2,height+pad*2);
    h.drawImage(normal,0,0,width+pad*2,height+pad*2);h.globalAlpha=.35;h.drawImage(mask,pad,pad,width,height);
    pair={normal,hit};cache.set(key,pair);
  }
  ctx.drawImage(flash?pair.hit:pair.normal,x-pad,y-pad,width+pad*2,height+pad*2);
}
export function playerHalo(ctx,x,y,r=overrides.playerRadius){halo(ctx,x,y,r,playerLight);}
export function playerSprite(ctx,x,y,entity={}){
  const sheet=artwork.heroSheet;
  // The potato breathes while moving; hands never act out weapon attacks.
  if(sheet){const frame=entity.animation==='Death'?animationFrame(entity):Math.floor((entity.animationTime||0)*4)%2,size=overrides.playerSpriteSize;readable(ctx,sheet,[frame%4*64,Math.floor(frame/4)*64,64,64],x-spriteOrigin.x/64*size,y+16-spriteOrigin.y/64*size,size,size,playerLight.color,entity.hit>0);return true;}
  const image=artwork.hero;if(!image)return false;
  readable(ctx,image,[0,0,image.naturalWidth,image.naturalHeight],x-28,y-33,56,56,playerLight.color);return true;
}
function enemyThreat(enemy){const visual=enemyVisual(enemy.id,enemy.boss);return threats[visual?.rank]??threats[enemy.type]??threats.blob;}
export function enemyHalo(ctx,enemy){halo(ctx,enemy.x,enemy.y,enemy.r,enemyThreat(enemy));}
export function enemySprite(ctx,enemy){
  const visual=enemyVisual(enemy.id,enemy.boss),variant=artwork.enemyVariants;
  if(visual&&variant){
    const sourceScale=variant.naturalWidth/2172,x=visual.crop[0]*sourceScale,w=(visual.crop[1]-visual.crop[0])*sourceScale;
    const drawWidth=enemy.r*(visual.rank==='boss'?3.15:visual.rank==='elite'?3.6:4.2),drawHeight=drawWidth*variant.naturalHeight/w;
    const hover=['plague_moth','void_cultist'].includes(visual.key)&&enemy.animation!=='Death'?Math.sin((enemy.age||0)*4+visual.index)*1.5:0;
    readable(ctx,variant,[x,0,w,variant.naturalHeight],enemy.x-drawWidth/2,enemy.y+enemy.r*1.3-drawHeight+hover,drawWidth,drawHeight,enemyThreat(enemy).color,enemy.hit>0);return true;
  }
  const sheet=artwork[`${enemy.type}Sheet`];
  if(sheet){const frame=animationFrame(enemy),size=enemy.r*3.8;readable(ctx,sheet,[frame%4*64,Math.floor(frame/4)*64,64,64],enemy.x-spriteOrigin.x/64*size,enemy.y+enemy.r*1.3-spriteOrigin.y/64*size,size,size,(threats[enemy.type]??threats.blob).color,enemy.hit>0);return true;}
  const image=artwork.enemies;if(!image)return false;
  const index={blob:0,runner:1,tank:2}[enemy.type]??0,w=image.naturalWidth/3,size=enemy.r*3;
  readable(ctx,image,[index*w,0,w,image.naturalHeight],enemy.x-size/2,enemy.y-size*.6,size,size*1.2,(threats[enemy.type]??threats.blob).color,enemy.hit>0);return true;
}
