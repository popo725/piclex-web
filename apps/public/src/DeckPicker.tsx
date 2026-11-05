import {useLayoutEffect,useRef} from 'react';

type Choice={id:string;title:string;cover:string};
function DeckTitle({title}:{title:string}){
 const ref=useRef<HTMLElement>(null);
 useLayoutEffect(()=>{
  const element=ref.current!;
  let active=true;
  const fit=()=>{
   if(!active)return;
   element.style.fontSize='16px';
   if(element.scrollWidth>element.clientWidth){
    element.style.fontSize=`${Math.max(12,16*element.clientWidth/element.scrollWidth)}px`;
   }
  };
  const observer=new ResizeObserver(fit);
  observer.observe(element.parentElement!);
  fit();void document.fonts.ready.then(fit);
  return()=>{active=false;observer.disconnect();};
 },[title]);
 return <strong ref={ref} title={title}>{title}</strong>;
}
export default function DeckPicker({choices,selectedID,select}:{choices:Choice[];selectedID:string;select:(id:string)=>void}){
 return <div className="practice-deck-list" role="group" aria-label="切换卡组">
  {choices.map(item=><button key={item.id} className="practice-deck-option" data-deck-id={item.id} aria-label={item.title} aria-pressed={item.id===selectedID} onClick={()=>select(item.id)}>
   <span className="practice-deck-cover" aria-hidden="true">
    <span className="practice-deck-placeholder">▧</span>
    {item.cover&&<img key={item.cover} src={item.cover} alt="" loading="lazy" onError={event=>{event.currentTarget.style.visibility='hidden';}}/>}
    {item.id===selectedID&&<span className="deck-selection-mark">✓</span>}
   </span>
   <DeckTitle title={item.title}/>
  </button>)}
 </div>;
}
