import {useEffect,useMemo,useRef,useState} from 'react';
import {tokens} from '../../../packages/practice/src/sentence.mjs';
import {accumulateReading} from '../../../packages/practice/src/reading.mjs';
import {readingDialogue} from '../../../packages/practice/src/dialogue.mjs';
import {emitExperience} from '../../../packages/learning-ui/src/experience-effects';
import {NativeIcon as Icon} from '../../../packages/learning-ui/src/NativeIcon';
import type {Word} from './NativePractice';
import type {useSpeech} from './useSpeech';
import './reading.css';
export type ReadingDraft={transcript:string;matched:number[];turn?:number;turns?:Record<number,{transcript:string;matched:number[]}>};
type Props={word:Word;active:boolean;audio:ReturnType<typeof useSpeech>;rate:number;notify:(s:string)=>void;saved:Map<string,ReadingDraft>;next:()=>void;reward:(matched:number,count:number)=>void;continuation:{current:boolean}};
export default function Reading({word,active,audio,rate,notify,saved,next,reward,continuation}:Props){
 const dialogue=useMemo(()=>readingDialogue(word.example),[word.example]);
 const turns:{role:string;text:string}[]=dialogue||[{role:'learner',text:word.example}];
 const [draft,setDraft]=useState<ReadingDraft>(()=>saved.get(word.id)||{transcript:'',matched:[],turn:0,turns:{}});
 const turn=Math.min(draft.turn||0,turns.length),current=turns[turn],machine=current?.role==='machine';
 const receipt=draft.turns?.[turn]||(!dialogue?draft:{transcript:'',matched:[]});
 const target=current?.text||'',matched=receipt.matched,transcript=receipt.transcript;
 const total=turns.reduce((sum,t)=>sum+(t.role==='learner'?tokens(t.text).length:0),0);
 const count=turns.reduce((sum,t,i)=>sum+(t.role==='learner'?(draft.turns?.[i]?.matched.length??(!dialogue?draft.matched.length:0)):0),0);
 const turnPassed=!!current&&!machine&&tokens(target).length===matched.length;
 const passed=count===total&&total>0&&(!dialogue||turn===turns.length);
 const [listening,setListening]=useState(false),[running,setRunning]=useState(()=>continuation.current);
 const recognition=useRef<any>(null),generation=useRef(0),evidence=useRef(matched),nextRef=useRef(next),rewardRef=useRef(reward);
 nextRef.current=next;rewardRef.current=reward;evidence.current=matched;
 const supported=!!((window as any).SpeechRecognition||(window as any).webkitSpeechRecognition);
 const stop=()=>{generation.current++;const old=recognition.current;recognition.current=null;if(old){old.onresult=null;old.onerror=null;old.onend=null;old.abort();}setListening(false);};
 const pause=()=>{continuation.current=false;setRunning(false);stop();audio.stop();};
 const save=(value:ReadingDraft)=>{saved.set(word.id,value);setDraft(value);};
 const move=(index:number)=>{stop();audio.stop();save({...draft,turn:Math.max(0,Math.min(turns.length,index))});};
 const begin=()=>{
  stop();audio.stop();if(!active||!current||machine||turnPassed)return;
  const Ctor=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!Ctor)return;
  const r=new Ctor();r.lang='en-US';r.continuous=true;r.interimResults=true;recognition.current=r;
  r.onresult=(event:any)=>{if(recognition.current!==r)return;let text='';for(let i=0;i<event.results.length;i++)text+=event.results[i][0].transcript+' ';text=text.trim();
   const result=accumulateReading(target,text,evidence.current);evidence.current=result.matched;
   const receipt={transcript:text,matched:result.matched};save({...draft,...receipt,turn,turns:{...draft.turns,[turn]:receipt}});
   if(result.passed)stop();
  };
  r.onerror=(e:any)=>{if(recognition.current!==r)return;pause();notify(e.error==='not-allowed'?'未获得麦克风权限，可继续听示范并自行跟读。':'语音识别暂时不可用，可继续听示范并自行跟读。');};
  r.onend=()=>{if(recognition.current===r){stop();setRunning(false);continuation.current=false;}};
  try{setListening(true);r.start();}catch{pause();notify('麦克风暂时不可用，请稍后重试。');}
 };
 useEffect(()=>{
  if(!active){pause();return;}
  if(!running&&!continuation.current)return;
  if(!current)return;
  let timer:ReturnType<typeof setTimeout>|undefined;
  if(machine)audio.play([target],rate,()=>move(turn+1));
  else if(turnPassed){if(dialogue)timer=setTimeout(()=>move(turn+1),500);}
  else if(!recognition.current)timer=setTimeout(begin,120);
  // Explicit pause/move owns microphone and audio cleanup. Effect cleanup must
  // not stop a demonstration just started by the same click that paused reading.
  return()=>{clearTimeout(timer);};
 },[active,turn,running,turnPassed]);
 useEffect(()=>{const hide=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',pause);return()=>{stop();audio.stop();document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',pause);};},[]);
 useEffect(()=>{if(active&&passed&&running){const timer=setTimeout(()=>nextRef.current(),1000);return()=>clearTimeout(timer);}},[active,passed,running]);
 const prior=useRef(count);
 useEffect(()=>{if(active&&count>prior.current){emitExperience([...document.querySelectorAll('.reading-sentence .matched')].map(n=>n.getBoundingClientRect()),passed,passed);rewardRef.current(count,total);}prior.current=count;},[count,active]);
 const display=useMemo(()=>{let cursor=0;return (target.match(/\S+\s*/gu)||[]).map(text=>{const count=tokens(text).length,indices=Array.from({length:count},(_,i)=>cursor+i);cursor+=count;return {text,indices};});},[target]);
 const restart=()=>{pause();save({transcript:'',matched:[],turn:0,turns:{}});};
 return <section className="reading-content" aria-label="口语跟读"><div className="reading-copy">
  {dialogue&&<div className="dialogue-navigation"><button className="text-button" disabled={turn===0} onClick={()=>move(turn-1)}>上一句</button><strong>{current?`${machine?'B · 机器朗读':'A · 轮到你读'} · ${turn+1}/${turns.length}`:'对话结束'}</strong><button className="text-button" disabled={turn>=turns.length-1} onClick={()=>move(turn+1)}>下一句</button></div>}
  <p className="reading-sentence">{current?display.map(({text,indices},index)=><span key={index} className={!machine&&indices.length&&indices.every(i=>matched.includes(i))?'matched':''}>{text}</span>):'本轮对话已结束'}</p><p className="muted">{word.exampleChinese}</p>
  {!dialogue&&word.phonetic&&<p className="reading-pronunciation">{word.phonetic}</p>}
  {supported?<p className="muted small">浏览器可能将语音发送给其识别服务；点击后授权麦克风。</p>:<p className="muted small">当前浏览器未提供语音识别，可听示范并跟读。</p>}
  {(transcript||turn===turns.length)&&<div className="reading-transcript"><p>识别结果：{transcript}</p><button className="text-button" onClick={restart}>{dialogue?'再练一轮':'重新跟读'}</button></div>}
 </div><div className="reading-controls"><div className="reading-state" role="status"><Icon name="microphone"/><span>{machine&&audio.playing?'机器朗读中':listening?'正在收音':passed?'朗读完成':'麦克风已关闭'}</span><span>已读对 {count}/{total} 个词</span></div>
 <div className="reading-actions"><button className="native-button" disabled={!current} onClick={()=>{pause();audio.play([target],rate,undefined,0,dialogue?undefined:word.audio);}}><Icon name="sound"/>听示范</button>{supported&&<button className="native-button" disabled={passed||!current} onClick={()=>{if(running||listening)pause();else{continuation.current=true;setRunning(true);if(!machine)begin();}}}><Icon name="microphone"/>{running?'结束跟读':dialogue?'继续对话':'开始跟读'}</button>}</div>
 <button className="native-button reading-next" onClick={()=>{pause();next();}}>下一句</button></div></section>;
}
