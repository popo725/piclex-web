import {selectedSpeechVoice} from './speech-voice';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {AudioClip} from './NativePractice';
import {createPlaybackProgress} from './playback-progress';
import {createSpeechProgress} from './speech-progress.mjs';
export function useSpeech(notify:(s:string)=>void){
 const generation=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),media=useRef<HTMLAudioElement|null>(null),blob=useRef('');
 const [playing,setPlaying]=useState(false),[preparing,setPreparing]=useState(false),[position,setPosition]=useState(-1);
 const mediaClock=useRef<ReturnType<typeof setInterval>|undefined>(undefined);
 const speechClock=useRef<ReturnType<typeof setInterval>|undefined>(undefined);
 const [error,setError]=useState('');
 const [progress]=useState(createPlaybackProgress);
 // Capture the media clock synchronously; timeupdate may lag a quick pause, sheet or rate change.
 const readProgress=useCallback(()=>{const player=media.current;return player&&Number.isFinite(player.duration)&&player.duration>0?Math.min(1,Math.max(0,player.currentTime/player.duration)):progress.getSnapshot().value;},[progress]);
 const clearMedia=useCallback(()=>{
  clearInterval(mediaClock.current);mediaClock.current=undefined;
  const current=media.current;media.current=null;
  if(current){current.onended=null;current.onerror=null;current.ontimeupdate=null;current.onplaying=null;current.onwaiting=null;current.onstalled=null;current.onloadedmetadata=null;current.pause();current.removeAttribute('src');current.load();}
  if(blob.current){URL.revokeObjectURL(blob.current);blob.current='';}
 },[]);
 const stop=useCallback(()=>{
  generation.current++;clearTimeout(timer.current);clearInterval(speechClock.current);speechClock.current=undefined;clearMedia();window.speechSynthesis?.cancel();
  setPlaying(false);setPreparing(false);setPosition(-1);progress.update(0);
 },[clearMedia,progress]);
 const play=useCallback((texts:string[],rate=1,onEnd?:()=>void,offset=0,clip?:AudioClip,startFraction=0)=>{
  stop();setError('');const id=generation.current,queue=texts.filter(t=>t.trim());
  const valid=()=>id===generation.current&&!document.hidden;
  // Queue progress is weighted by text length. Original audio uses its media
  // clock; Web Speech interpolates its estimated position between real events.
  const total=queue.reduce((sum,text)=>sum+text.length,0);
  const update=(i:number,fraction:number,indeterminate=false,estimated=false)=>{
   if(!valid())return;
   const before=queue.slice(0,i).reduce((sum,text)=>sum+text.length,0);
   const value=total?(before+(queue[i]?.length||0)*Math.min(1,Math.max(0,fraction)))/total:0;
   progress.update(Math.max(progress.getSnapshot().value,estimated?Math.min(.99,value):value),indeterminate);
  };
  const fail=(message?:string)=>{if(!valid())return;stop();if(message){setError(message);notify(message);}};
  const next=(i:number)=>{
   if(!valid())return;
   if(i===queue.length){stop();onEnd?.();return;}
   let finished=false;
   const current=()=>valid()&&!finished;
   const started=()=>{if(current()){setPreparing(false);setPlaying(true);}};
   const ended=(settle=0)=>{if(!current())return;finished=true;clearInterval(speechClock.current);speechClock.current=undefined;update(i,1);setPosition(-1);timer.current=setTimeout(()=>next(i+1),i<queue.length-1?180:settle);};
   // Original audio belongs to this sentence occurrence only; the following word uses TTS.
   if(i===0&&clip){
    try{
     let source='';
     if(clip.dataBase64){const bytes=Uint8Array.from(atob(clip.dataBase64),c=>c.charCodeAt(0));source=URL.createObjectURL(new Blob([bytes],{type:'audio/mpeg'}));blob.current=source;}
     else if(clip.path)source=new URL(import.meta.env.BASE_URL+clip.path,location.href).href;
     if(!source){fail('这张卡片的原音频暂时无法播放。');return;}
     const player=new Audio(source);media.current=player;player.playbackRate=rate;player.preservesPitch=true;
     const failed=()=>{if(media.current===player)fail('原音频播放失败，请检查网络并再次点击播放。');};
     let observedTime=0;
     const time=()=>{if(media.current!==player||!current())return;
      // Some media backends omit/reorder playing after a seek. A moving decoded
      // media clock is also evidence of playback; metadata/seek alone is not.
      if(player.currentTime>observedTime&&!player.paused&&!player.seeking&&player.readyState>=2)started();
      observedTime=player.currentTime;update(i,Number.isFinite(player.duration)&&player.duration>0?player.currentTime/player.duration:0,!Number.isFinite(player.duration)||player.duration<=0);
     };
     player.onplaying=()=>{if(media.current===player){started();time();}};
     player.onwaiting=player.onstalled=()=>{if(valid()&&media.current===player&&player.readyState<3)setPreparing(true);};
     player.onloadedmetadata=()=>{if(!valid()||media.current!==player)return;if(Number.isFinite(player.duration)&&player.duration>0)player.currentTime=player.duration*Math.min(.999,Math.max(0,startFraction));time();};
     player.ontimeupdate=time;player.onerror=failed;
     // Like App, sample the actual audio clock; a stall cannot advance the fill.
     mediaClock.current=setInterval(time,33);
     player.onended=()=>{if(!valid()||media.current!==player)return;clearMedia();ended();};
     void player.play().then(()=>{if(media.current===player&&current()&&!player.paused)started();}).catch(failed);
    }catch{fail('这张卡片的原音频暂时无法播放。');}
    return;
   }
   if(!window.speechSynthesis){fail('此浏览器没有提供英文朗读功能。');return;}
   try{
    const utterance=new SpeechSynthesisUtterance(queue[i]);utterance.lang='en-US';utterance.rate=rate;
    const voice=selectedSpeechVoice();if(voice)utterance.voice=voice;
    let clock:ReturnType<typeof createSpeechProgress>|undefined,paused=false;
    const begin=()=>{
     if(!current()||clock)return;
     started();clock=createSpeechProgress(queue[i],rate);update(i,0);
     speechClock.current=setInterval(()=>{
      if(!current()||!clock)return;
      const now=performance.now();clock.setPaused(paused||!!speechSynthesis.paused,now);
      update(i,clock.sample(now),false,true);
     },33);
    };
    utterance.onstart=begin;
    utterance.onboundary=e=>{if(current()){begin();clock?.boundary(e.charIndex,performance.now());if(i===0)setPosition(e.charIndex+offset);}};
    utterance.onpause=()=>{if(current()){paused=true;clock?.setPaused(true,performance.now());}};
    utterance.onresume=()=>{if(current()){paused=false;clock?.setPaused(false,performance.now());}};
    // Let the short completion animation finish before hiding the button's
    // fill. The next segment still starts after the established 180 ms gap.
    utterance.onend=()=>ended(180);
    utterance.onerror=e=>{if(current())fail(['interrupted','canceled'].includes(e.error)?undefined:'朗读暂时不可用，请检查浏览器的语音与播放权限。');};
    speechSynthesis.speak(utterance);
   }catch{fail('朗读暂时不可用，请检查浏览器的语音与播放权限。');}
  };
  setPreparing(queue.length>0);next(0);
 },[stop,clearMedia,notify,progress]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stop);return ()=>{stop();document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',stop);};},[stop]);
 return {error,playing,preparing,position,progress,readProgress,play,stop};
}
