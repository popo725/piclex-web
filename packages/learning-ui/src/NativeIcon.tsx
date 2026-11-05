import {useEffect,useState,type CSSProperties} from 'react';
import {createUIAssetWarmup} from './ui-assets.mjs';
const readyFrames=new Map<string,string>();
// Retain decoded images for the document lifetime, sharing URLs and CORS mode
// with CSS masks. No persistent cache can accidentally keep an old release.
const warmImages:HTMLImageElement[]=[];
const warmUIAssets=createUIAssetWarmup({
 schedule:(run:()=>void)=>{
  const idle=()=>{
   if('requestIdleCallback' in window) window.requestIdleCallback(run,{timeout:2000});
   else setTimeout(run,200);
  };
  if(document.readyState==='complete') idle();
  else window.addEventListener('load',idle,{once:true});
 },
 load:(path:string)=>new Promise<void>((resolve,reject)=>{
  const image=new Image();image.crossOrigin='anonymous';image.decoding='async';image.fetchPriority='low';
  const timer=setTimeout(()=>{image.onload=null;image.onerror=null;image.src='';reject(new Error('UI asset timeout'));},12000);
  image.onerror=()=>{clearTimeout(timer);reject(new Error('UI asset unavailable'));};
  image.onload=async()=>{
   try {
    await image.decode();warmImages.push(image);
    const match=path.match(/^icons\/tab-(.+)-frames\.png$/);
    if(match) readyFrames.set(match[1],image.src);
    resolve();
   }catch(error){reject(error);}finally{clearTimeout(timer);}
  };
  image.src=`${import.meta.env.BASE_URL}${path}`;
 }),
});
export function scheduleUIAssetWarmup(){warmUIAssets();}
// Assets come from App's UIKit drawing. Alpha masks preserve the selected theme.
export function NativeIcon({name}:{name:string}){return <span className="native-icon" aria-hidden="true" style={{'--native-icon':`url("${import.meta.env.BASE_URL}icons/${name}.png")`} as CSSProperties}/>;}
export function NativeTabIcon({name,animate=false}:{name:string;animate?:boolean}){
 const [moving,setMoving]=useState(()=>animate&&readyFrames.has(name));
 useEffect(()=>{setMoving(animate&&readyFrames.has(name));},[name,animate]);
 return <span className={`native-icon native-tab-icon ${moving?'native-tab-motion':''}`} aria-hidden="true" onAnimationEnd={()=>setMoving(false)} style={{'--native-icon':`url("${import.meta.env.BASE_URL}icons/tab-${name}.png")`,'--native-frames':readyFrames.has(name)?`url("${readyFrames.get(name)}")`:'none','--native-duration':name==='learn'?'.72s':name==='capture'?'.66s':'.5s'} as CSSProperties}/>;
}
