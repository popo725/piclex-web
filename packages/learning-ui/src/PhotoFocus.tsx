import { useEffect, useRef, useState } from 'react';
import { focusLayout } from './focus.mjs';
export type Focus = { visible: boolean; box: number[] } | null;
/** Same-photo focus moves for 0.5s. Decode the next photo before replacing the old one. */
export function PhotoFocus({ src, focus, alt, active = true }: { src: string; focus: Focus; alt: string; active?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({width:0,height:0});
  const [photo,setPhoto] = useState<{src:string;width:number;height:number}>();
  const [broken,setBroken] = useState(false);
  const retainedFocus=useRef(focus);
  useEffect(()=>{let current=true;setBroken(false);const image=new Image();image.src=src;
    const loaded=()=>{if(current)setPhoto({src,width:image.naturalWidth,height:image.naturalHeight});};
    if(image.complete&&image.naturalWidth)loaded();else {image.onload=loaded;image.onerror=()=>{if(current)setBroken(true);};}
    return ()=>{current=false;image.onload=null;image.onerror=null;};
  },[src]);
  useEffect(()=>{const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));if(host.current)observer.observe(host.current);return ()=>observer.disconnect();},[]);
  if(photo?.src===src)retainedFocus.current=focus;
  const layout=photo&&focusLayout(photo,size,retainedFocus.current),target=layout?.box;
  return <div className={`photo-focus ${active?'':'effects-paused'}`} ref={host}>
    {photo&&<img key={photo.src} src={photo.src} alt={alt} className="focus-image" style={layout?{left:layout.image.x,top:layout.image.y,width:layout.image.width,height:layout.image.height}:undefined}/>}
    {broken&&<p className="image-error">这张图片暂时无法显示，仍可继续练习。</p>}
    {!broken&&target&&<span className="focus-box" aria-hidden="true" style={{left:target.x+target.width/2,top:target.y+target.height/2,width:Math.max(30,target.width),height:Math.max(30,target.height)}}><span style={{width:Math.hypot(Math.max(30,target.width),Math.max(30,target.height)),height:Math.hypot(Math.max(30,target.width),Math.max(30,target.height))}}/></span>}
  </div>;
}
