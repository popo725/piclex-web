import {useEffect,useRef,useState} from 'react';
import {readPreference,writePreference} from './storage';
import {NativeIcon as Icon} from '../../../packages/learning-ui/src/NativeIcon';
const choices=[['off','关闭'],['cafe','咖啡厅'],['piano','轻柔钢琴']];
export default function useSentenceAmbience({active,speaking}:{active:boolean;speaking:boolean}){
 const [selection,setSelection]=useState(()=>{const saved=readPreference('piclex-web.sentence-ambience');return choices.some(([id])=>id===saved)?saved!:'cafe';});
 const [volume,setVolume]=useState(()=>{const saved=readPreference('piclex-web.sentence-ambience-volume');return saved!==null&&Number.isFinite(Number(saved))?Math.min(1,Math.max(0,Number(saved))):.28;});
 const [authorized,setAuthorized]=useState(false),[failed,setFailed]=useState(false),[revision,retry]=useState(0);
 const player=useRef<HTMLAudioElement|null>(null),menu=useRef<HTMLDetailsElement>(null),gain=useRef(0);
 gain.current=volume*.5*(speaking?.22:1);
 // Browser audio starts from a gesture, and must not resume itself after a tab is hidden.
 useEffect(()=>{
  const gesture=(e:Event)=>{if(active&&!document.hidden&&(e.target as HTMLElement)?.closest('.native-practice'))setAuthorized(true);};
  const stop=()=>{player.current?.pause();setAuthorized(false);if(menu.current)menu.current.open=false;};
  const hide=()=>{if(document.hidden)stop();};
  document.addEventListener('pointerdown',gesture);document.addEventListener('keydown',gesture);document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stop);
  return()=>{document.removeEventListener('pointerdown',gesture);document.removeEventListener('keydown',gesture);document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',stop);};
 },[active]);
 useEffect(()=>{
  if(!active||!authorized||selection==='off')return;
  const sound=new Audio(`${import.meta.env.BASE_URL}audio/ambience/${selection}.m4a`);player.current=sound;sound.loop=true;sound.volume=gain.current;
  let cancelled=false;const fail=()=>{if(!cancelled)setFailed(true);};sound.onerror=fail;setFailed(false);void sound.play().catch(fail);
  return()=>{cancelled=true;sound.onerror=null;sound.pause();sound.removeAttribute('src');sound.load();if(player.current===sound)player.current=null;};
 },[active,authorized,selection,revision]);
 useEffect(()=>{if(player.current)player.current.volume=gain.current;},[volume,speaking]);
 useEffect(()=>{if(!active){setAuthorized(false);if(menu.current)menu.current.open=false;}},[active]);
 useEffect(()=>{const close=(e:PointerEvent)=>{if(menu.current&&!menu.current.contains(e.target as Node))menu.current.open=false;};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 return <details className="sentence-ambience" ref={menu} onToggle={()=>{const root=menu.current,box=root?.querySelector<HTMLElement>('.ambience-menu');if(!root?.open||!box)return;const anchor=root.getBoundingClientRect(),v=window.visualViewport,top=v?.offsetTop||0,left=v?.offsetLeft||0,height=v?.height||innerHeight,width=v?.width||innerWidth;box.style.left=`${Math.max(left+12,Math.min(left+width-202,anchor.right-190))}px`;box.style.top=`${Math.max(top+12,Math.min(top+height-box.offsetHeight-12,anchor.bottom+4))}px`;}} onKeyDown={e=>{if(e.key==='Escape'&&menu.current){menu.current.open=false;menu.current.querySelector('summary')?.focus();}}}>
  <summary aria-label={`背景声：${choices.find(([id])=>id===selection)?.[1]}${failed?'，播放失败':''}`} title="背景声">{selection==='off'?<Icon name="sound"/>:<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">{selection==='cafe'?<><path d="M4 8h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 9h2a3 3 0 0 1 0 6h-2M7 3v3m4-3v3M2 22h18"/></>:<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m6-16v16"/><path d="M7 4v8h4V4m2 0v8h4V4" fill="currentColor"/></>}</svg>}</summary>
  <div className="ambience-menu"><strong>背景声</strong>{choices.map(([id,title])=><button key={id} aria-pressed={selection===id} onClick={()=>{setFailed(false);setSelection(id);writePreference('piclex-web.sentence-ambience',id);setAuthorized(true);retry(n=>n+1);if(menu.current)menu.current.open=false;}}>{title}<span aria-hidden="true">{selection===id?'✓':''}</span></button>)}<label>音量<select aria-label="背景声音量" value={volume} onChange={e=>{setVolume(Number(e.target.value));writePreference('piclex-web.sentence-ambience-volume',e.target.value);}}>{[[.15,'很轻'],[.28,'轻柔'],[.45,'适中']].map(([n,title])=><option key={n} value={n}>{title}</option>)}</select></label>{failed&&<button onClick={()=>{setAuthorized(true);retry(n=>n+1);}}>播放失败，点击重试</button>}</div>
 </details>;
}
