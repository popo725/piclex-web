import {useCallback,useEffect,useRef,useState} from 'react';
export function useSpeech(notify:(s:string)=>void){
 const generation=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [playing,setPlaying]=useState(false),[position,setPosition]=useState(-1);
 const stop=useCallback(()=>{generation.current++;clearTimeout(timer.current);window.speechSynthesis?.cancel();setPlaying(false);setPosition(-1);},[]);
 const play=useCallback((texts:string[],rate=1,onEnd?:()=>void,offset=0)=>{
  stop();if(!window.speechSynthesis){notify('此浏览器没有提供英文朗读功能。');return;}
  const id=generation.current,queue=texts.filter(t=>t.trim());setPlaying(true);
  const next=(i:number)=>{if(id!==generation.current||document.hidden)return;
   if(i===queue.length){setPlaying(false);setPosition(-1);onEnd?.();return;}
   const utterance=new SpeechSynthesisUtterance(queue[i]);utterance.lang='en-US';utterance.rate=rate;
   const voice=speechSynthesis.getVoices().find(v=>/^en-US$/i.test(v.lang))||speechSynthesis.getVoices().find(v=>/^en/i.test(v.lang));if(voice)utterance.voice=voice;
   utterance.onboundary=e=>{if(id===generation.current&&i===0)setPosition(e.charIndex+offset);};
   utterance.onend=()=>{if(id===generation.current)timer.current=setTimeout(()=>next(i+1),i<queue.length-1?180:0);};
   utterance.onerror=e=>{if(id===generation.current){setPlaying(false);if(!['interrupted','canceled'].includes(e.error))notify('朗读暂时不可用，请检查浏览器的语音与播放权限。');}};
   speechSynthesis.speak(utterance);
  };next(0);
 },[stop,notify]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stop);return ()=>{stop();document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',stop);};},[stop]);
 return {playing,position,play,stop};
}
