import {useEffect,useRef,useState,type CSSProperties} from 'react';

// PolaroidCaptureOverlay.swift: stationary mouth, rigid sheet, two feed speeds,
// release, development and a .72-second whole-paper handoff to the real preview.
export default function PolaroidPrint({image,finished}:{image?:Uint8Array;finished:()=>void}){
 const root=useRef<HTMLDivElement>(null),latest=useRef(finished);latest.current=finished;
 const [url,setURL]=useState(''),[ratio,setRatio]=useState(4/3),[loaded,setLoaded]=useState(false);
 useEffect(()=>{if(!image)return;const value=URL.createObjectURL(new Blob([image.slice().buffer],{type:'image/jpeg'}));setURL(value);return()=>URL.revokeObjectURL(value);},[image]);
 useEffect(()=>{
  if(!loaded||!root.current)return;
  const element=root.current,paper=element.querySelector<HTMLElement>('.print-paper')!,slot=element.querySelector<HTMLElement>('.print-slot')!,window=element.querySelector<HTMLElement>('.print-window')!,photo=paper.querySelector('img')!;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),animations=new Set<Animation>();let disposed=false;
  const animate=async(node:Element,frames:Keyframe[],duration:number,easing='linear')=>{
   if(disposed)throw Error('stopped');const animation=node.animate(frames,{duration,easing,fill:'forwards'});animations.add(animation);await animation.finished;if(disposed)throw Error('stopped');
  };
  const run=async()=>{
   const width=Math.max(80,Math.min(innerWidth-76,420,(innerHeight-100)/(.9/ratio+.35))),height=width*(.9/ratio+.35),footer=width*.30,fraction=footer/height;
   element.style.setProperty('--print-width',`${width}px`);element.style.setProperty('--print-height',`${height}px`);
   const fast=Math.min(.32,3.8*fraction/(1-fraction)/3)*1000;
   if(motion.matches){paper.style.transform='translateY(20px)';photo.style.opacity='1';await animate(element,[{opacity:1},{opacity:1}],550);}
   else{
    await animate(slot,[{width:'126px',height:'8px'},{width:`${width+28}px`,height:'8px'}],300,'ease-in-out');
    await animate(slot,[{height:'8px'},{height:'20px'}],180,'ease-in-out');
    await animate(paper,[{transform:`translateY(${-height}px)`},{transform:`translateY(${-height+footer}px)`}],fast);
    await animate(paper,[{transform:`translateY(${-height+footer}px)`},{transform:'translateY(0px)'}],3800);
    await animate(paper,[{transform:'translateY(0) rotate(0deg)'},{transform:'translateY(24px) rotate(1.2deg)'}],460,'cubic-bezier(.2,.8,.2,1.1)');
    await animate(photo,[{opacity:.12,filter:'contrast(.4) saturate(.1)'},{opacity:1,filter:'none'}],1100,'ease-in-out');
    await animate(photo,[{opacity:1},{opacity:1}],200);
    const destination=document.querySelector('.capture-card')?.getBoundingClientRect(),source=window.getBoundingClientRect();
    if(destination){
     // Only a uniform scale: the photograph is never compressed to match a box.
     const x=destination.x-source.x-20,y=destination.y-source.y,scale=destination.width/width;
     window.style.overflow='visible';
     void animate(slot,[{opacity:1},{opacity:0}],240).catch(()=>{});
     void animate(element,[{backgroundColor:'#000'},{backgroundColor:'transparent'}],240).catch(()=>{});
     await animate(paper,[{transform:'translateY(24px) rotate(1.2deg)',height:`${height}px`},{transform:`translate(${x}px,${y}px) scale(${scale}) rotate(0deg)`,height:`${destination.height/scale}px`}],720,'cubic-bezier(.32,0,.2,1)');
    }
   }
   await animate(element,[{opacity:1},{opacity:0}],160);if(!disposed)latest.current();
  };
  void run().catch(()=>{if(!disposed)latest.current();});
  const reduce=()=>{if(motion.matches)latest.current();};motion.addEventListener('change',reduce);
  return()=>{disposed=true;animations.forEach(a=>a.cancel());motion.removeEventListener('change',reduce);};
 },[loaded,ratio]);
 return <div ref={root} className="capture-printing" aria-label="正在出片" style={{'--print-ratio':ratio} as CSSProperties}><div className="print-slot"/><div className="print-window"><div className="print-paper">{url&&<img src={url} alt="" onLoad={e=>{setRatio(e.currentTarget.naturalWidth/e.currentTarget.naturalHeight);setLoaded(true);}}/>}</div></div></div>;
}
