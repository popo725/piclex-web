import {useEffect,useRef} from 'react';

// Port of IridescentProcessingHalo.swift. Same palette, four diffuse waves,
// highlight rim, eight-second colour circulation and perimeter sampling.
const palette=[[.12,.76,1],[.26,.34,1],[.66,.30,1],[1,.28,.67],[1,.47,.34],[1,.76,.42],[.67,.57,1]];
const epoch=performance.now();
// Bake each diffuse mask into the bitmap using Canvas shadows, supported by
// iOS Safari as well as desktop browsers. Neither Canvas filter nor a separate
// CSS-filter compositor layer is required. Blur before the final photo clip.
const layers=[
 {inset:0,amplitude:2.5,phase:0,width:40,blur:12,opacity:.30},
 {inset:0,amplitude:5.5,phase:.4,width:17,blur:4.5,opacity:.78},
 {inset:5,amplitude:4,phase:1.8,width:6,blur:3.4,opacity:.32},
 {inset:2,amplitude:1.6,phase:2.6,width:2,blur:1.1,opacity:.42},
 {inset:0,amplitude:0,phase:0,width:1.4,blur:.7,opacity:.66},
];
function color(position:number,white:number){
 const value=(position-Math.floor(position))*palette.length,index=Math.floor(value),fraction=value-index,blend=fraction*fraction*(3-2*fraction);
 return `rgb(${palette[index].map((a,i)=>{const v=a+(palette[(index+1)%palette.length][i]-a)*blend;return Math.round((v+(1-v)*white)*255);}).join(',')})`;
}
function wave(width:number,height:number,inset:number,amplitude:number,phase:number,scale:number,time:number){
 const points:number[][]=[],perimeter=2*(width+height);let distance=0;
 for(let side=0;side<4;side++){
  const length=side%2===0?width:height,count=Math.max(12,Math.ceil(length/18));
  for(let step=0;step<count;step++){
   const progress=step/count,around=(distance+progress*length)/perimeter*Math.PI*2;
   const depth=scale*(inset+amplitude*(.68*Math.sin(around*3-time*2.35+phase)+.32*Math.sin(around*5-time*3.2+phase*1.7)));
   points.push(side===0?[depth+progress*(width-2*depth),depth]:side===1?[width-depth,depth+progress*(height-2*depth)]:side===2?[width-depth-progress*(width-2*depth),height-depth]:[depth,height-depth-progress*(height-2*depth)]);
  }
  distance+=length;
 }
 const path=new Path2D(),first=points[0],last=points[points.length-1];path.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
 points.forEach((point,i)=>{const next=points[(i+1)%points.length];path.quadraticCurveTo(point[0],point[1],(point[0]+next[0])/2,(point[1]+next[1])/2);});path.closePath();return path;
}
export default function RecognitionHalo({active}:{active:boolean}){
 const surface=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=surface.current;if(!element)return;
  const canvases=[...element.querySelectorAll('canvas')];
  const contexts=canvases.map(canvas=>canvas.getContext('2d'));
  if(contexts.some(context=>!context))return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,width=0,height=0,padding=0,dpr=1;
  const draw=()=>{
   frame=0;if(!active||document.hidden||!width||!height)return;
   const time=motion.matches?0:(performance.now()-epoch)/1000,scale=Math.min(1.2,Math.min(width,height)/340);
   layers.forEach((layer,index)=>{
    const context=contexts[index]!;
    context.clearRect(-padding,-padding,width+2*padding,height+2*padding);
    const gradient=context.createConicGradient(0,width*(.5+.04*Math.sin(time*.39)),height*(.5+.05*Math.cos(time*.33)));
    for(let i=0;i<=48;i++){const p=i/48,phase=p-time/8+.035*Math.sin(p*Math.PI*4-time*.9)+.018*Math.sin(p*Math.PI*6+time*.6);gradient.addColorStop(p,color(phase,index>=3?.32:0));}
    let path:Path2D;
    if(index===4){path=new Path2D();path.rect(.6*scale,.6*scale,width-1.2*scale,height-1.2*scale);}
    else path=wave(width,height,layer.inset,layer.amplitude,layer.phase,scale,time);
    // Move the hard stroke outside the bitmap; only its soft shadow lands here.
    // shadowBlur/offset use device pixels and ignore the canvas transform.
    const offset=2*(width+2*padding);
    context.save();context.translate(-offset,0);
    context.shadowColor='#000';context.shadowBlur=2*layer.blur*scale*dpr;context.shadowOffsetX=offset*dpr;
    context.strokeStyle='#000';context.lineWidth=layer.width*scale;context.lineCap='round';context.lineJoin='round';context.stroke(path);context.restore();
    // Tint the blurred alpha mask without reintroducing an unblurred colour rim.
    context.save();context.globalCompositeOperation='source-in';context.globalAlpha=layer.opacity;context.fillStyle=gradient;
    context.fillRect(-padding,-padding,width+2*padding,height+2*padding);context.restore();
   });
   if(!motion.matches)frame=requestAnimationFrame(draw);
  };
  const refresh=()=>{cancelAnimationFrame(frame);frame=0;draw();};
  const resize=new ResizeObserver(()=>{
   const rect=element.getBoundingClientRect();width=rect.width;height=rect.height;
   dpr=Math.min(2,devicePixelRatio||1);const scale=Math.min(1.2,Math.min(width,height)/340);padding=Math.ceil(64*scale);
   canvases.forEach((canvas,index)=>{
    canvas.width=Math.ceil((width+2*padding)*dpr);canvas.height=Math.ceil((height+2*padding)*dpr);
    Object.assign(canvas.style,{left:`${-padding}px`,top:`${-padding}px`,width:`${width+2*padding}px`,height:`${height+2*padding}px`});
    contexts[index]!.setTransform(dpr,0,0,dpr,padding*dpr,padding*dpr);
   });refresh();
  });resize.observe(element);
  motion.addEventListener('change',refresh);document.addEventListener('visibilitychange',refresh);refresh();
  return()=>{cancelAnimationFrame(frame);resize.disconnect();motion.removeEventListener('change',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[active]);
 return <div ref={surface} className="recognition-halo" aria-hidden="true">{layers.map((_,index)=><canvas key={index}/>)}</div>;
}
