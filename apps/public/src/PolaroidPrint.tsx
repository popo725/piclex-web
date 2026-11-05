import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';

// PolaroidCaptureOverlay.swift: stationary mouth, rigid sheet, two feed speeds,
// release, development and a .72-second whole-paper handoff to the real preview.
export default function PolaroidPrint({image,finished,reveal,close}:{image?:Uint8Array;reveal:()=>void;finished:()=>void;close:()=>void}){
 const root=useRef<HTMLDivElement>(null),latest=useRef({finished,reveal});latest.current={finished,reveal};
 const [url,setURL]=useState(''),[ratio,setRatio]=useState(.75),[loaded,setLoaded]=useState(false);
 const opening=useRef<Promise<unknown>>(Promise.resolve());
 useLayoutEffect(()=>{
  const element=root.current!,slots=[...element.querySelectorAll<HTMLElement>('.print-slot')];
  const safe=parseFloat(getComputedStyle(element).getPropertyValue('--print-safe-top'))||0;
  const island=safe>=51,region=island?43+Math.min(8,Math.max(0,safe-51)):20;
  const top=island?safe-6-region:Math.max(8,safe+8),height=region+20,mouth=top+region+4;
  const width=Math.max(80,Math.min(innerWidth-76,420,Math.max(100,innerHeight-mouth-112)/(.9/.75+.35)));
  element.style.setProperty('--print-width',`${width}px`);element.style.setProperty('--print-mouth',`${mouth}px`);
  const initial={width:`${island?138:126}px`,height:`${island?49:height}px`,top:`${island?Math.max(11,safe-48)-6:top}px`};
  const final={width:`${width+28}px`,height:`${height}px`,top:`${top}px`};
  const animations:Animation[]=[];let disposed=false;
  slots.forEach(slot=>{Object.assign(slot.style,initial);slot.style.setProperty('--mouth-offset',`${mouth-top}px`);});
  const phase=(frames:Keyframe[],duration:number)=>Promise.all(slots.map(slot=>{const a=slot.animate(frames,{duration,easing:'ease-in-out',fill:'forwards'});animations.push(a);return a.finished;}));
  opening.current=(async()=>{
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){slots.forEach(slot=>Object.assign(slot.style,final));return;}
   await phase([initial,{...initial,width:final.width}],300);if(disposed)return;
   await phase([{...initial,width:final.width},final],180);
  })();void opening.current.catch(()=>{});
  return()=>{disposed=true;animations.forEach(a=>a.cancel());};
 },[]);
 useEffect(()=>{if(!image)return;const value=URL.createObjectURL(new Blob([image.slice().buffer],{type:'image/jpeg'}));setURL(value);return()=>URL.revokeObjectURL(value);},[image]);
 useEffect(()=>{
  if(!loaded||!root.current)return;
  const element=root.current,paper=element.querySelector<HTMLElement>('.print-paper')!,slots=[...element.querySelectorAll<HTMLElement>('.print-slot')],window=element.querySelector<HTMLElement>('.print-window')!,photo=paper.querySelector('img')!;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),animations=new Set<Animation>();let disposed=false;
  const animate=async(node:Element,frames:Keyframe[],duration:number,easing='linear')=>{
   if(disposed)throw Error('stopped');const animation=node.animate(frames,{duration,easing,fill:'forwards'});animations.add(animation);await animation.finished;if(disposed)throw Error('stopped');
  };
  const run=async()=>{
   await opening.current;if(disposed)return;
   const width=parseFloat(element.style.getPropertyValue('--print-width')),height=width*(.9/ratio+.35),footer=width*.30,fraction=footer/height;
   element.style.setProperty('--print-width',`${width}px`);element.style.setProperty('--print-height',`${height}px`);
   const fast=Math.min(.32,3.8*fraction/(1-fraction)/3)*1000;
   if(motion.matches){paper.style.transform='translateY(20px)';photo.style.opacity='1';await animate(element,[{opacity:1},{opacity:1}],550);}
   else{
    element.dataset.feeding='true';
    await animate(paper,[{transform:`translateY(${-height}px)`},{transform:`translateY(${-height+footer}px)`}],fast);
    await animate(paper,[{transform:`translateY(${-height+footer}px)`},{transform:'translateY(0px)'}],3800);
    await animate(paper,[{transform:'translateY(0) rotate(0deg)'},{transform:'translateY(24px) rotate(1.2deg)'}],460,'cubic-bezier(.2,.8,.2,1.1)');
    await animate(photo,[{opacity:.2,filter:'saturate(.16) brightness(1.14) blur(1.8px)'},{opacity:1,filter:'none'}],1100,'ease-in-out');
    await animate(photo,[{opacity:1},{opacity:1}],200);
    const destination=document.querySelector('.capture-card')?.getBoundingClientRect(),source=window.getBoundingClientRect();
    if(destination){
     // Only a uniform scale: the photograph is never compressed to match a box.
     const x=destination.x-source.x-20,y=destination.y-source.y,scale=destination.width/width;
     window.style.overflow='visible';
     slots.forEach(slot=>void animate(slot,[{opacity:1},{opacity:0}],240).catch(()=>{}));
     void animate(element,[{backgroundColor:'#000'},{backgroundColor:'transparent'}],240).catch(()=>{});
     await animate(paper,[{transform:'translateY(24px) rotate(1.2deg)',height:`${height}px`},{transform:`translate(${x}px,${y}px) scale(${scale}) rotate(0deg)`,height:`${destination.height/scale}px`}],720,'cubic-bezier(.32,0,.2,1)');
    }
   }
   // Reveal only once the flight has finished, then fade the stationary copy.
   // Two frames allow React to paint the destination beneath the opaque sheet.
   latest.current.reveal();
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   if(disposed)return;
   await animate(element,[{opacity:1},{opacity:0}],160);if(!disposed)latest.current.finished();
  };
  void run().catch(()=>{if(!disposed)latest.current.finished();});
  const reduce=()=>{if(motion.matches)latest.current.finished();};motion.addEventListener('change',reduce);
  return()=>{disposed=true;animations.forEach(a=>a.cancel());motion.removeEventListener('change',reduce);};
 },[loaded,ratio]);
 return <div ref={root} className="capture-printing" aria-label="正在出片" style={{'--print-ratio':ratio} as CSSProperties}><div className="print-slot print-slot-rear"/><div className="print-window"><div className="print-paper">{url&&<img src={url} alt="" onError={()=>latest.current.finished()} onLoad={e=>{setRatio(e.currentTarget.naturalWidth/e.currentTarget.naturalHeight);setLoaded(true);}}/>}</div></div><div className="print-slot print-slot-front"><i/></div>{loaded&&<button className="print-close" onClick={close}>关闭</button>}</div>;
}
