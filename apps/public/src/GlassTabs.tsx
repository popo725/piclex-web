import {useRef,useState,type CSSProperties,type PointerEvent} from 'react';
import {NativeTabIcon} from '../../../packages/learning-ui/src/NativeIcon';

const tabs=[{id:'capture',title:'拍摄'},{id:'learn',title:'学习'},{id:'settings',title:'设置'}] as const;
export type MainTab=typeof tabs[number]['id'];
export default function GlassTabs({selected,onSelect}:{selected:MainTab;onSelect:(tab:MainTab)=>void}){
 const selectedIndex=tabs.findIndex(tab=>tab.id===selected);
 const [position,setPosition]=useState<number|null>(null),[pulse,setPulse]=useState(0);
 const gesture=useRef<{id:number;x:number;y:number;moved:boolean}|null>(null),suppressClick=useRef(false);
 const activate=(index:number)=>{setPulse(n=>n+1);onSelect(tabs[index].id);};
 const point=(event:PointerEvent<HTMLDivElement>)=>{
  const box=event.currentTarget.getBoundingClientRect(),slot=(box.width-12)/3;
  return Math.max(0,Math.min(2,(event.clientX-box.left-6)/slot-.5));
 };
 const reset=()=>{gesture.current=null;setPosition(null);};
 return <nav className="app-tabs" aria-label="底部导航">
  <div className={`app-tabs-glass${position!==null?' is-scrubbing':''}`} style={{'--tab-position':position??selectedIndex} as CSSProperties}
   onPointerDown={event=>{if(!event.isPrimary||event.button!==0)return;suppressClick.current=false;gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};}}
   onPointerMove={event=>{
    const drag=gesture.current;if(!drag||drag.id!==event.pointerId)return;
    if(!drag.moved&&Math.abs(event.clientX-drag.x)>7&&Math.abs(event.clientX-drag.x)>Math.abs(event.clientY-drag.y)){
     drag.moved=true;event.currentTarget.setPointerCapture(event.pointerId);
    }
    if(drag.moved)setPosition(point(event));
   }}
   onPointerUp={event=>{
    const drag=gesture.current;if(!drag||drag.id!==event.pointerId)return;
    if(drag.moved){
     suppressClick.current=true;
     const box=event.currentTarget.getBoundingClientRect();
     if(event.clientY>=box.top-24&&event.clientY<=box.bottom+24&&event.clientX>=box.left-24&&event.clientX<=box.right+24)activate(Math.round(point(event)));
    }
    reset();
   }}
   onPointerCancel={()=>{suppressClick.current=true;reset();}}
   onLostPointerCapture={reset}
   onClickCapture={event=>{if(suppressClick.current){suppressClick.current=false;if(event.detail>0){event.preventDefault();event.stopPropagation();}}}}>
   <span className="app-tab-lens" aria-hidden="true"/>
   {tabs.map(({id,title},index)=><button key={id} type="button" aria-label={title} aria-current={selected===id?'page':undefined} onClick={()=>activate(index)}>
    <NativeTabIcon key={`${id}:${pulse}`} name={id} animate={pulse>0&&selected===id}/><span>{title}</span>
   </button>)}
  </div>
 </nav>;
}
