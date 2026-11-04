import {useCallback,useEffect,useRef,useState} from 'react';
import type {AudioClip} from './NativePractice';
export function useSpeech(notify:(s:string)=>void){
 const generation=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),media=useRef<HTMLAudioElement|null>(null),blob=useRef('');
 const [playing,setPlaying]=useState(false),[position,setPosition]=useState(-1);
 const clearMedia=useCallback(()=>{const current=media.current;media.current=null;if(current){current.onended=null;current.onerror=null;current.pause();current.removeAttribute('src');current.load();}if(blob.current){URL.revokeObjectURL(blob.current);blob.current='';}},[]);
 const stop=useCallback(()=>{generation.current++;clearTimeout(timer.current);clearMedia();window.speechSynthesis?.cancel();setPlaying(false);setPosition(-1);},[clearMedia]);
 const play=useCallback((texts:string[],rate=1,onEnd?:()=>void,offset=0,clip?:AudioClip)=>{
  stop();const id=generation.current,queue=texts.filter(t=>t.trim());setPlaying(true);
  const next=(i:number)=>{if(id!==generation.current||document.hidden)return;
   if(i===queue.length){setPlaying(false);setPosition(-1);onEnd?.();return;}
   // Original audio belongs to this sentence occurrence only. A following word
   // still uses normal pronunciation; repeated lyrics keep their own clip.
   if(i===0&&clip){
    let source='';
    if(clip.dataBase64){const bytes=Uint8Array.from(atob(clip.dataBase64),c=>c.charCodeAt(0));source=URL.createObjectURL(new Blob([bytes],{type:'audio/mpeg'}));blob.current=source;}
    else if(clip.path)source=new URL(import.meta.env.BASE_URL+clip.path,location.href).href;
    if(!source){setPlaying(false);notify('这张卡片的原音频暂时无法播放。');return;}
    const player=new Audio(source);media.current=player;player.playbackRate=rate;player.preservesPitch=true;
    const failed=()=>{if(id!==generation.current||media.current!==player)return;clearMedia();setPlaying(false);setPosition(-1);notify('原音频播放失败，请检查网络并再次点击播放。');};
    player.onerror=failed;player.onended=()=>{if(id!==generation.current)return;clearMedia();timer.current=setTimeout(()=>next(i+1),i<queue.length-1?180:0);};
    void player.play().catch(failed);return;
   }
   if(!window.speechSynthesis){setPlaying(false);notify('此浏览器没有提供英文朗读功能。');return;}
   const utterance=new SpeechSynthesisUtterance(queue[i]);utterance.lang='en-US';utterance.rate=rate;
   const voice=speechSynthesis.getVoices().find(v=>/^en-US$/i.test(v.lang))||speechSynthesis.getVoices().find(v=>/^en/i.test(v.lang));if(voice)utterance.voice=voice;
   utterance.onboundary=e=>{if(id===generation.current&&i===0)setPosition(e.charIndex+offset);};
   utterance.onend=()=>{if(id===generation.current)timer.current=setTimeout(()=>next(i+1),i<queue.length-1?180:0);};
   utterance.onerror=e=>{if(id===generation.current){setPlaying(false);if(!['interrupted','canceled'].includes(e.error))notify('朗读暂时不可用，请检查浏览器的语音与播放权限。');}};
   speechSynthesis.speak(utterance);
  };next(0);
 },[stop,clearMedia,notify]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stop);return ()=>{stop();document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',stop);};},[stop]);
 return {playing,position,play,stop};
}
