import {useMemo,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {PhotoLabel} from './capture-api';
import {resolveCardLabels,labelGlass,calloutRects,connector,center} from '../../../packages/deck-format/src/card-appearance.mjs';
function visible(label:PhotoLabel){const a=label.anchor,b=label.bbox;return label.relation==='visible'&&a?.length===2&&b?.length===4&&a.every(Number.isFinite)&&b.every(Number.isFinite)&&b[0]>=0&&b[1]>=0&&b[2]<=1000&&b[3]<=1000&&b[2]>b[0]&&b[3]>b[1]&&a[0]>=b[0]&&a[0]<=b[2]&&a[1]>=b[1]&&a[1]<=b[3];}
export default function PhotoAnnotations({labels,aspect,selected,select}:{labels:PhotoLabel[];aspect:number;selected:number|null;select:(i:number)=>void}){
 const stage=useRef<HTMLDivElement>(null),[scale,setScale]=useState(0);
 useLayoutEffect(()=>{const parent=stage.current!.parentElement!,measure=()=>setScale(parent.getBoundingClientRect().width/1000);measure();const observer=new ResizeObserver(measure);observer.observe(parent);return()=>observer.disconnect();},[]);
 const items=useMemo(()=>{
  const photo={width:1000,height:1000/aspect},g=document.createElement('canvas').getContext('2d')!;
  const fit=(text:string,size:number,weight:number)=>{g.font=`${weight} ${size}px system-ui`;while(text&&g.measureText(text).width>340)text=text.slice(0,-2)+'…';return {text,width:g.measureText(text).width};};
  const items=resolveCardLabels(labels).map((label:PhotoLabel,i:number)=>{const english=fit(label.english,28,700),chinese=fit(label.chinese,22.4,500),hasTarget=visible(label),anchor=hasTarget?{x:label.anchor![0],y:label.anchor![1]/aspect}:{x:1000*((i%3)+1)/4,y:photo.height*.82};return {label,english:english.text,chinese:chinese.text,anchor,visible:hasTarget,size:{width:Math.max(english.width,chinese.width)+40.32,height:82.88},glass:labelGlass(label.backgroundColor)};});
  const preferred=items.map((v:any)=>{const p=v.label.suggestedBubblePosition;return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1000&&p.y>=0&&p.y<=1000?{x:p.x,y:p.y/aspect}:null;});
  const rects=calloutRects(photo,items.map((i:any)=>i.anchor),items.map((i:any)=>i.size),preferred);
  return items.map((item:any,i:number)=>({...item,rect:rects[i],line:item.visible?connector(rects[i],item.anchor):null}));
 },[labels,aspect]);
 return <div ref={stage} className="capture-annotation-stage" style={{height:`${1000/aspect}px`,transform:`scale(${scale})`}}>{items.map((item:any,index:number)=>{const {label,rect,glass,line}=item,c=center(rect),b=label.bbox;return <div key={index} className="capture-annotation" style={{'--label-tint':glass.rgb.join(' '),'--label-entrance-x':`${item.anchor.x-c.x}`,'--label-entrance-y':`${item.anchor.y-c.y}`} as CSSProperties}>
 {selected===index&&item.visible&&<span className="capture-object-box" style={{left:`${b[0]/10}%`,top:`${b[1]/10}%`,width:`${(b[2]-b[0])/10}%`,height:`${(b[3]-b[1])/10}%`}}/>}
 {line&&<svg className="capture-connector" viewBox={`0 0 1000 ${1000/aspect}`} aria-hidden="true"><path className="connector-halo" d={`M${line.start.x} ${line.start.y}L${line.end.x} ${line.end.y}`}/><path className="connector-ink" d={`M${line.start.x} ${line.start.y}L${line.end.x} ${line.end.y}`}/><circle cx={line.end.x} cy={line.end.y} r="5.2"/></svg>}
 <button className={`capture-photo-label ${item.visible?'':'scene-label'}`} aria-pressed={selected===index} onClick={()=>select(index)} style={{left:`${rect.x/10}%`,top:`${rect.y*aspect/10}%`,width:`${rect.width/10}%`,height:`${rect.height*aspect/10}%`}}><strong>{item.english}</strong><span>{item.chinese}</span></button>
 </div>;})}</div>;
}
