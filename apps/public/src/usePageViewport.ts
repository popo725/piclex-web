import {useLayoutEffect} from 'react';

/** iOS browser chrome can resize AND pan the visual viewport without resizing the page. */
export default function usePageViewport(active=true,scope:'practice'|'capture'='practice'){
 useLayoutEffect(()=>{
  if(!active)return;
  const html=document.documentElement,body=document.body,viewport=window.visualViewport;
  html.dataset[scope]=body.dataset[scope]='true';
  window.scrollTo(0,0);
  let frame=0;
  const update=()=>{
   // Keep the normal page scale/pan when the user pinch-zooms.
   if(viewport&&Math.abs(viewport.scale-1)>.01)return;
   const height=viewport?.height||innerHeight,width=viewport?.width||innerWidth;
   for(const [key,value] of Object.entries({vh:height,vwidth:width,vtop:Math.max(0,viewport?.offsetTop||0),vleft:Math.max(0,viewport?.offsetLeft||0)}))html.style.setProperty(`--page-${key}`,`${value}px`);
   html.dataset.practiceCompact=String(width<=600&&height<=740);
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
  update();viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);
  window.addEventListener('resize',schedule);window.addEventListener('pageshow',schedule);
  return()=>{
   cancelAnimationFrame(frame);viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);
   window.removeEventListener('resize',schedule);window.removeEventListener('pageshow',schedule);
   delete html.dataset[scope];delete html.dataset.practiceCompact;delete body.dataset[scope];
   for(const key of ['vh','vwidth','vtop','vleft'])html.style.removeProperty(`--page-${key}`);
  };
 },[active,scope]);
}
