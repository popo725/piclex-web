import {useEffect,useRef} from 'react';

// Port of IridescentProcessingHalo.swift. Same palette, four diffuse waves,
// highlight rim, eight-second colour circulation and perimeter sampling.
const palette=[[.12,.76,1],[.26,.34,1],[.66,.30,1],[1,.28,.67],[1,.47,.34],[1,.76,.42],[.67,.57,1]];
const epoch=performance.now();
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
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const element=canvas.current,context=element?.getContext('2d');if(!element||!context)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,width=0,height=0;
  const draw=()=>{
   frame=0;if(!active||document.hidden||!width||!height)return;
   const time=motion.matches?0:(performance.now()-epoch)/1000,scale=Math.min(1.2,Math.min(width,height)/340);
   context.clearRect(0,0,width,height);
   const shading=(white=0)=>{
    const gradient=context.createConicGradient(0,width*(.5+.04*Math.sin(time*.39)),height*(.5+.05*Math.cos(time*.33)));
    for(let i=0;i<=48;i++){const p=i/48,phase=p-time/8+.035*Math.sin(p*Math.PI*4-time*.9)+.018*Math.sin(p*Math.PI*6+time*.6);gradient.addColorStop(p,color(phase,white));}return gradient;
   };
   const stroke=(path:Path2D,lineWidth:number,blur:number,opacity:number,highlight=false)=>{
    context.save();context.strokeStyle=shading(highlight?.32:0);context.lineWidth=lineWidth*scale;context.lineCap='round';context.lineJoin='round';context.globalAlpha=opacity;context.filter=`blur(${blur*scale}px)`;context.stroke(path);context.restore();
   };
   stroke(wave(width,height,0,2.5,0,scale,time),40,12,.30);
   stroke(wave(width,height,0,5.5,.4,scale,time),17,4.5,.78);
   stroke(wave(width,height,5,4,1.8,scale,time),6,3.4,.32);
   stroke(wave(width,height,2,1.6,2.6,scale,time),2,1.1,.42,true);
   const rim=new Path2D();rim.rect(.6*scale,.6*scale,width-1.2*scale,height-1.2*scale);stroke(rim,1.4,.7,.66,true);
   if(!motion.matches)frame=requestAnimationFrame(draw);
  };
  const refresh=()=>{cancelAnimationFrame(frame);frame=0;draw();};
  const resize=new ResizeObserver(()=>{const rect=element.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(2,devicePixelRatio||1);element.width=Math.round(width*dpr);element.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);refresh();});resize.observe(element);
  motion.addEventListener('change',refresh);document.addEventListener('visibilitychange',refresh);refresh();
  return()=>{cancelAnimationFrame(frame);resize.disconnect();motion.removeEventListener('change',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[active]);
 return <canvas ref={canvas} className="recognition-halo" aria-hidden="true"/>;
}
