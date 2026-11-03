import {useEffect,useState,type CSSProperties} from 'react';
const tabs=['capture','learn','settings'];
const readyFrames=new Map<string,string>();
// Keep the three atlases in memory for the app lifetime. CSS masks use these
// decoded blob URLs, so a tab click can never start another HTTP request.
const warmImages:HTMLImageElement[]=[];
for(const name of tabs){
 const icon=new Image();icon.crossOrigin='anonymous';icon.decoding='async';icon.fetchPriority='high';icon.src=`${import.meta.env.BASE_URL}icons/tab-${name}.png`;warmImages.push(icon);
 void(async()=>{let url='';try{
  const response=await fetch(`${import.meta.env.BASE_URL}icons/tab-${name}-frames.png`);if(!response.ok)return;
  url=URL.createObjectURL(await response.blob());const image=new Image();image.src=url;await image.decode();
  warmImages.push(image);readyFrames.set(name,url);
 }catch{if(url)URL.revokeObjectURL(url);}})();
}
// Assets come from App's UIKit drawing. Alpha masks preserve the selected theme.
export function NativeIcon({name}:{name:string}){return <span className="native-icon" aria-hidden="true" style={{'--native-icon':`url("${import.meta.env.BASE_URL}icons/${name}.png")`} as CSSProperties}/>;}
export function NativeTabIcon({name,animate=false}:{name:string;animate?:boolean}){
 const [moving,setMoving]=useState(()=>animate&&readyFrames.has(name));
 useEffect(()=>{setMoving(animate&&readyFrames.has(name));},[name,animate]);
 return <span className={`native-icon native-tab-icon ${moving?'native-tab-motion':''}`} aria-hidden="true" onAnimationEnd={()=>setMoving(false)} style={{'--native-icon':`url("${import.meta.env.BASE_URL}icons/tab-${name}.png")`,'--native-frames':readyFrames.has(name)?`url("${readyFrames.get(name)}")`:'none','--native-duration':name==='learn'?'.72s':name==='capture'?'.66s':'.5s'} as CSSProperties}/>;
}
