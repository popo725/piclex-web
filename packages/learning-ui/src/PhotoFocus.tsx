import { useEffect, useRef, useState } from 'react';
import { focusLayout } from './focus.mjs';
import {downloadBytes} from './download.mjs';
import LoadProgress,{type DownloadProgress} from './LoadProgress';
export type Focus = { visible: boolean; box: number[] } | null;
/** Keep the card's dimensions while downloading and decoding its current photo. */
export function PhotoFocus({ src, focus, alt, active = true,fit='focus',retry=0,onLoadState,onImageReady }: { src: string; focus: Focus; alt: string; active?: boolean;fit?:'focus'|'contain';retry?:number;onImageReady?:(image:HTMLImageElement)=>void;onLoadState?:(state:'loading'|'ready'|'error')=>void }) {
 const host=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:0,height:0});
 const [photo,setPhoto]=useState<{source:string;src:string;width:number;height:number}>();
 const [transfer,setTransfer]=useState<{source:string;progress:DownloadProgress;decoding:boolean}>();
 const [broken,setBroken]=useState('');
 useEffect(()=>{
  const controller=new AbortController();let objectURL='';setBroken('');setPhoto(undefined);setTransfer({source:src,progress:{received:0,total:null},decoding:false});onLoadState?.('loading');
  void(async()=>{try{
   const result=await downloadBytes(src,{maxBytes:64*1024*1024,signal:controller.signal,onProgress:progress=>{if(!controller.signal.aborted)setTransfer({source:src,progress,decoding:false});}});
   if(controller.signal.aborted)return;
   setTransfer({source:src,progress:{received:result.bytes.length,total:result.bytes.length},decoding:true});
   objectURL=URL.createObjectURL(new Blob([result.bytes],{type:result.type||'image/jpeg'}));
   const image=new Image();image.src=objectURL;await image.decode();
   if(!controller.signal.aborted){setPhoto({source:src,src:objectURL,width:image.naturalWidth,height:image.naturalHeight});onImageReady?.(image);onLoadState?.('ready');}
  }catch{if(!controller.signal.aborted){setBroken(src);onLoadState?.('error');}}})();
  return()=>{controller.abort();if(objectURL)URL.revokeObjectURL(objectURL);};
 },[src,retry,onLoadState,onImageReady]);
 useEffect(()=>{const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));if(host.current)observer.observe(host.current);return()=>observer.disconnect();},[]);
 const current=photo?.source===src?photo:undefined,layout=current&&focusLayout(current,size,focus,fit),target=layout?.box;
 return <div className={`photo-focus ${active?'':'effects-paused'}`} ref={host} aria-busy={!current&&broken!==src}>
  {current&&<img key={current.src} src={current.src} alt={alt} className="focus-image" style={layout?{left:layout.image.x,top:layout.image.y,width:layout.image.width,height:layout.image.height}:undefined}/>}
  {broken===src?<p className="image-error">图片加载失败，点击重试</p>:!current&&<div className="photo-loading"><LoadProgress label="正在加载图片" progress={transfer?.source===src?transfer.progress:null} finishing={transfer?.source===src&&transfer.decoding}/></div>}
  {current&&target&&<span className="focus-box" aria-hidden="true" style={{left:target.x+target.width/2,top:target.y+target.height/2,width:Math.max(30,target.width),height:Math.max(30,target.height)}}><span style={{width:Math.hypot(Math.max(30,target.width),Math.max(30,target.height)),height:Math.hypot(Math.max(30,target.width),Math.max(30,target.height))}}/></span>}
 </div>;
}
