import {useEffect,useRef,useState} from 'react';
/** A quiet bottom progress rail, with a brief completion glow. */
export default function SpellingGlow({progress,complete,revealed,error,active,scope}:{progress:number;complete:boolean;revealed:boolean;error:boolean;active:boolean;scope:string}){
 const node=useRef<SVGSVGElement>(null),[size,setSize]=useState({w:1,h:1}),[gold,setGold]=useState(false),last=useRef(false);
 useEffect(()=>{const observer=new ResizeObserver(([e])=>setSize({w:e.contentRect.width,h:e.contentRect.height}));if(node.current)observer.observe(node.current);return ()=>observer.disconnect();},[]);
 useEffect(()=>{if(complete&&!last.current)setGold(true);last.current=complete;},[complete]);
 useEffect(()=>{if(!active)setGold(false);},[active]);
 useEffect(()=>{if(!gold)return;const t=setTimeout(()=>setGold(false),1200);return ()=>clearTimeout(t);},[gold]);
 useEffect(()=>{setGold(false);last.current=false;},[scope]);
 const {w,h}=size,inset=Math.min(16,w/2),left=`M ${w/2} ${h-2} H ${inset}`;
 return <svg ref={node} className={`spelling-glow ${gold&&active?'completion-glow':''}`} aria-hidden="true" style={{opacity:revealed?0:error?.12:active?1:0}} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
  {[false,true].map(mirror=><path key={String(mirror)} d={left} transform={mirror?`translate(${w} 0) scale(-1 1)`:undefined} pathLength="100" strokeDasharray="100" strokeDashoffset={100-Math.min(1,Math.max(0,progress))*100}/>)}</svg>;
}
