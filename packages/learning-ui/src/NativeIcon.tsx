import {useEffect,useState,type CSSProperties} from 'react';
const tabs=['capture','learn','settings'];
const readyFrames=new Set<string>();
// Warm static images and native animation atlases at startup, not at the first tap.
const warmImages:HTMLImageElement[]=[];
for(const name of tabs)for(const suffix of ['', '-frames']){
 const image=new Image();image.decoding='async';image.fetchPriority=suffix?'auto':'high';image.src=`${import.meta.env.BASE_URL}icons/tab-${name}${suffix}.png`;warmImages.push(image);
 void image.decode().then(()=>{if(suffix)readyFrames.add(name);}).catch(()=>{});
}
// Assets come from App's UIKit drawing. Alpha masks preserve the selected theme.
export function NativeIcon({name}:{name:string}){return <span className="native-icon" aria-hidden="true" style={{'--native-icon':`url("${import.meta.env.BASE_URL}icons/${name}.png")`} as CSSProperties}/>;}
export function NativeTabIcon({name,animate=false}:{name:string;animate?:boolean}){
 const [moving,setMoving]=useState(()=>animate&&readyFrames.has(name));
 useEffect(()=>{setMoving(animate&&readyFrames.has(name));},[name,animate]);
 return <span className={`native-icon native-tab-icon ${moving?'native-tab-motion':''}`} aria-hidden="true" onAnimationEnd={()=>setMoving(false)} style={{'--native-icon':`url("${import.meta.env.BASE_URL}icons/tab-${name}.png")`,'--native-frames':`url("${import.meta.env.BASE_URL}icons/tab-${name}-frames.png")`,'--native-duration':name==='learn'?'.72s':name==='capture'?'.66s':'.5s'} as CSSProperties}/>;
}
