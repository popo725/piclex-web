import {usePhotoPalette} from './usePhotoPalette';
import {NativeIcon as Icon} from '../../../packages/learning-ui/src/NativeIcon';
import {playTypingSound,stopTypingSound} from '../../../packages/learning-ui/src/typing-sound';
import {PracticeProgress,useExperience} from './Experience';
import VirtualKeyboard,{useDesktopKeyboard} from '../../../packages/learning-ui/src/VirtualKeyboard';
import {editKeyboardText} from '../../../packages/learning-ui/src/keyboard-edit.mjs';
import {transactExperience} from '../../../packages/practice/src/experience-store.mjs';
import {clearExperienceEffects,emitExperience} from '../../../packages/learning-ui/src/experience-effects';
import {useEffect,useLayoutEffect,useMemo,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {PhotoFocus,type Focus} from '../../../packages/learning-ui/src/PhotoFocus';
import {AnswerSlots} from '../../../packages/learning-ui/src/AnswerSlots';
import SpellingGlow from '../../../packages/learning-ui/src/SpellingGlow';
import {maskExample,mismatch,completionProgress,exampleTokens,exampleWords,tokenForWord} from '../../../packages/learning-ui/src/spelling.mjs';
import {newStudy,restoreStudy,restoreStudyFromStorage,reduceStudy,studyKey,wordDraft,expectedInput} from '../../../packages/practice/src/study.mjs';
import {promptsFor,newSentence,rates,writtenWords,checkSentence,tokens} from '../../../packages/practice/src/sentence.mjs';
import {readPreference,writePreference} from './storage';
import {useSpeech} from './useSpeech';
import './practice.css';
import EnglishInput from './EnglishInput';
import {flushSync} from 'react-dom';
export type AudioClip={mediaType:string;sha256:string;byteCount:number;durationSeconds:number;dataBase64?:string;path?:string};
export type Word={audio?:AudioClip;id:string;english:string;chinese:string;imageIndex:number;focus:Focus;example:string;exampleChinese:string;phonetic:string;partOfSpeech:string;occurrenceID?:string};
export type PracticeDeck={id:string;title:string;fingerprint:string;legacyFingerprints?:string[];words:Word[];images:string[]};
type Action={type:string;[key:string]:unknown};
const modes=[['listening','随身听'],['chunks','词块拼句'],['free','自由听写']];
const modules=[['spelling','拼单词'],['listening','练听力'],['speaking','练口语']];
function readJSON(key:string){try{return JSON.parse(readPreference(key)||'null');}catch{return null;}}
function Dialog({title,close,children}:{title:string;close:()=>void;children:ReactNode}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const focused=document.activeElement as HTMLElement;dialog.current?.showModal();return()=>{dialog.current?.close();focused?.focus({preventScroll:true});};},[]);
 return <dialog ref={dialog} className="learning-dialog" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}><div className="dialog-body"><header><h2>{title}</h2><button autoFocus aria-label="关闭" onClick={close}><Icon name="close"/></button></header>{children}</div></dialog>;
}
function revealFocusedAnswer(){
 const field=document.activeElement as HTMLElement|null,body=field?.closest<HTMLElement>('.native-body');
 if(!body||!field?.matches('.guided-input input,.dictation-input'))return;
 const area=body.getBoundingClientRect(),box=field.getBoundingClientRect();
 if(box.bottom>area.bottom)body.scrollTop+=box.bottom-area.bottom+4;
 else if(box.top<area.top)body.scrollTop+=box.top-area.top-4;
}
function SpeakerIcon(){return <Icon name="sound"/>;}
function Playback({play,stop,playing,rate,setRate,label='播放句子'}:{play:()=>void;stop:()=>void;playing:boolean;rate:number;setRate:(n:number)=>void;label?:string}){
 return <div className="native-playback"><button className="native-button" onClick={play}><SpeakerIcon/>{playing?'重新播放':label}</button>{playing&&<button className="native-button" aria-label="停止播放" onClick={stop}><Icon name="stop"/></button>}<span className="playback-rate"><select aria-label="播放速度" value={rate} onChange={e=>setRate(Number(e.target.value))}>{rates.map(r=><option key={r} value={r}>{r===1?'1.0':r}×</option>)}</select><span aria-hidden="true">⌄</span></span></div>;
}
function SentenceLine({sentence,target,translation,hidden,position,open}:{sentence:string;target:string;translation:string;hidden:boolean;position:number;open:()=>void}){
 const display=exampleTokens(sentence,target),words=exampleWords(sentence),index=words.findIndex(w=>position>=w.start&&position<w.end),highlight=tokenForWord(display,index);
 return <button className="native-example" onClick={open} aria-label="查看例句并练口语"><span>{display.map((t,i)=><span key={i} className={i===highlight?'spoken-word':''}>{t.text} </span>)}</span>{!hidden&&<small>{maskExample(translation,target)}</small>}</button>;
}
function GuidedInput({sentence,value,difficulty,disabled,onChange,onWarning,onComposing,onSubmit,onVirtualKey}:{sentence:string;value:string[];difficulty:string;disabled:boolean;onChange:(values:string[])=>void;onWarning:(show:boolean)=>void;onComposing:(active:boolean)=>void;onSubmit:()=>void;onVirtualKey:(key:string)=>void}){
 const words:string[]=writtenWords(sentence),inputs=useRef<(HTMLInputElement|null)[]>([]),[peek,setPeek]=useState(-1),hold=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>()=>clearTimeout(hold.current),[]);
 const chars=(w:string)=>w.replace(/[^\p{L}\p{N}]/gu,'');
 const update=(i:number,v:string)=>{const next=words.map((_,j)=>value[j]||'');next[i]=v;onChange(next);};
 return <div className="guided-input" aria-label={difficulty==='easy'?'显示单词和字母数量':'只显示单词数量'}>{words.map((word,i)=>{
  const capacity=chars(word).length,entered=value[i]||'';
  return <label key={i} className="guided-word" style={{width:difficulty==='easy'?Math.max(28,Math.min(280,capacity*16+8)):80}}>
   <EnglishInput key={`${sentence}:${i}`} ref={n=>{inputs.current[i]=n as HTMLInputElement|null;}} label={`第 ${i+1} 个单词${difficulty==='easy'?`，${capacity} 个字母`:''}`} readOnly={disabled} onVirtualKey={onVirtualKey} value={entered} onWarning={onWarning} onComposing={onComposing}
    onValue={(raw,advance)=>{update(i,raw.replace(/\s/g,''));if(advance&&(raw.endsWith(' ')||(difficulty==='easy'&&chars(raw).length>=capacity)))inputs.current[i+1]?.focus({preventScroll:true});}}
    onPaste={e=>{const text=e.clipboardData.getData('text');if(!/\s/.test(text))return;e.preventDefault();const next=words.map((_,j)=>value[j]||'');text.trim().split(/\s+/).forEach((v,j)=>{if(i+j<next.length)next[i+j]=v;});onChange(next);}}
    onKeyDown={e=>{if(e.nativeEvent.isComposing)return;if(e.key==='Enter'){e.preventDefault();if(!disabled&&inputs.current[i+1])inputs.current[i+1]?.focus({preventScroll:true});else onSubmit();return;}if(disabled)return;if(e.key==='Backspace'&&!entered){e.preventDefault();inputs.current[i-1]?.focus({preventScroll:true});}}}/>
   {difficulty==='easy'&&<span className="guided-letters" aria-hidden="true">{[...chars(word)].map((c,j)=><i key={j} className={entered[j]&&entered[j].toLowerCase()!==c.toLowerCase()?'bad-letter':''}>{entered[j]||'\u00a0'}</i>)}</span>}
   <button className="peek-letter" aria-label={`按住查看第 ${i+1} 个单词`} onPointerDown={()=>{hold.current=setTimeout(()=>setPeek(i),450);}} onPointerUp={()=>{clearTimeout(hold.current);setPeek(-1);}} onPointerCancel={()=>{clearTimeout(hold.current);setPeek(-1);}} onBlur={()=>setPeek(-1)}><Icon name="peek"/></button>{peek===i&&<span className="word-peek">{word}</span>}
  </label>;
 })}</div>;
}
function Reading({word,active,audio,rate,notify,saved,next,reward}:{word:Word;active:boolean;audio:ReturnType<typeof useSpeech>;rate:number;notify:(s:string)=>void;saved:Map<string,string>;next:()=>void;reward:(matched:number,count:number)=>void}){
 const [transcript,setTranscript]=useState(()=>saved.get(word.id)||''),[listening,setListening]=useState(false),recognition=useRef<any>(null);
 const supported=!!((window as any).SpeechRecognition||(window as any).webkitSpeechRecognition);
 const stop=()=>{if(recognition.current){recognition.current.onresult=null;recognition.current.onend=null;recognition.current.onerror=null;recognition.current.abort();recognition.current=null;}setListening(false);};
 useEffect(()=>{if(!active)stop();const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stop);return ()=>{stop();document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',stop);};},[active]);
 const begin=()=>{audio.stop();if(listening){stop();return;}const Ctor=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!Ctor)return;const r=new Ctor();r.lang='en-US';r.continuous=true;r.interimResults=true;recognition.current=r;
  r.onresult=(event:any)=>{let text='';for(let i=0;i<event.results.length;i++)text+=event.results[i][0].transcript+' ';setTranscript(text.trim());saved.set(word.id,text.trim());};
  r.onerror=(e:any)=>{setListening(false);notify(e.error==='not-allowed'?'未获得麦克风权限，可继续听示范并自行跟读。':'语音识别暂时不可用，可继续听示范并自行跟读。');};r.onend=()=>setListening(false);
  try{r.start();setListening(true);}catch{notify('麦克风暂时不可用，请稍后重试。');}
 };
 const check=transcript?checkSentence(word.example,transcript):null;
 const previousMatches=useRef(check?.edits.filter((e:any)=>e.kind==='match').length||0);
 useEffect(()=>{if(!check||!active)return;const matched=check.edits.filter((e:any)=>e.kind==='match').length;if(matched>previousMatches.current){emitExperience([...document.querySelectorAll('.reading-sentence .matched')].slice(previousMatches.current).map(n=>n.getBoundingClientRect()),check.isCorrect,check.isCorrect);}previousMatches.current=matched;reward(matched,writtenWords(word.example).length);},[transcript,active]);
 return <section className="reading-content" aria-label="口语跟读"><p className="reading-sentence">{check?check.edits.filter((e:any)=>e.expected).map((e:any,i:number)=><span key={i} className={e.kind==='match'?'matched':''}>{e.expected} </span>):word.example}</p><p className="muted">{word.exampleChinese}</p>
  <button className="native-button" onClick={()=>audio.play([word.example],rate,undefined,0,word.audio)}>听示范</button>
  {supported?<><p className="muted small">浏览器可能将语音发送给其识别服务；点击后授权麦克风。</p><button className="native-primary" onClick={begin}>{listening?'结束跟读':'开始跟读'}</button></>:<p className="muted">当前浏览器未提供语音识别，可听示范并跟读。</p>}
  {transcript&&<div role="status"><p>识别结果：{transcript}</p><p>{check?.isCorrect?'本句单词已匹配。':'继续练习，已匹配的单词会标色。'}</p><button className="text-button" onClick={()=>{stop();setTranscript('');saved.delete(word.id);}}>重新跟读</button></div>}
  <button className="native-button" onClick={()=>{stop();next();}}>下一句</button>
 </section>;
}
export default function NativePractice({deck,deckChoices,selectDeck,spellingRequest=0,notify,exit,download,share}:{deck:PracticeDeck;deckChoices:{id:string;title:string}[];selectDeck:(id:string)=>void;spellingRequest?:number;notify:(s:string)=>void;exit:()=>void;download:()=>void;share:()=>void}){
 const desktopKeyboard=useDesktopKeyboard();
 const [photoState,setPhotoState]=useState<'loading'|'ready'|'error'>('loading'),[photoRetry,setPhotoRetry]=useState(0);
 const xp=useExperience(),[effect,setEffect]=useState(()=>readPreference('piclex-web.particle-effect')||'socialCode');
 const particleEffect=xp.level>=7?effect:'socialCode';
 const [typingSound,setTypingSound]=useState(()=>readPreference('piclex-web.typing-sound')==='true');
 const storageKey=`piclex-web.study.v2.${deck.fingerprint}`;
 // The model validates untrusted saved state and migrates the first public release's progress.
 const [state,setState]=useState<any>(()=>{const restored=restoreStudyFromStorage(deck,readJSON);return spellingRequest?reduceStudy(deck,restored,{type:'module',value:'spelling',question:studyKey(restored)}):restored;});
 const key=studyKey(state),input=useRef<HTMLInputElement>(null),warned=useRef(false),[panel,setPanel]=useState<'gallery'|'settings'|null>(null);
 const [visible,setVisible]=useState(!document.hidden),[composing,setComposing]=useState(false),[imeWarning,setImeWarning]=useState(false);
 const [repeat,setRepeat]=useState(()=>readPreference('piclex-web.listening.repeat')||'five'),[onePhoto,setOnePhoto]=useState(()=>readPreference('piclex-web.listening.single-photo')==='true');
 const [listenRun,setListenRun]=useState(false),[pass,setPass]=useState(0),[seek,setSeek]=useState(0);
 const readingSaved=useRef(new Map<string,string>()),audio=useSpeech(notify),prompts=useMemo(()=>promptsFor(deck),[deck]);
 const prompt=prompts[state.sentenceIndex],word=deck.words[state.index],draft=wordDraft(deck,state),sentence=prompt?(state.sentences[prompt.key]||newSentence(prompt)):null;
 const promptWord=prompt?deck.words[prompt.wordIndex]:undefined,promptAudio=promptWord?.example.trim()===prompt?.sentence.trim()?promptWord?.audio:undefined;
 const active=visible&&!panel,complete=!word,playback=state.module==='listening'&&state.mode==='listening';
 function dispatch(action:Action){setState((s:any)=>reduceStudy(deck,s,{...action,question:key}));}
 const credited=useRef(new Set<string>());
 const award=(event:any)=>{const stamp=event.id+':'+(event.matched||'');if(credited.current.has(stamp))return;credited.current.add(stamp);void transactExperience(event).catch(e=>{credited.current.delete(stamp);notify(e.message);});};
 useEffect(()=>()=>{clearExperienceEffects();stopTypingSound();},[]);
 useEffect(()=>{if(!active)stopTypingSound();},[active]);
 useEffect(()=>{if(!active||!typingSound||xp.level<3)return;const sound=(e:Event)=>{const node=e.target as HTMLElement;if(node.closest('.native-practice')&&node.matches('input,textarea')&&!(e as InputEvent).isComposing)playTypingSound();};document.addEventListener('input',sound);return()=>document.removeEventListener('input',sound);},[active,typingSound,xp.level]);
 const sentenceEffects=useRef(new Set<string>());
 useEffect(()=>{if(!active||state.module!=='listening'||!sentence||sentence.outcomes[state.mode]!=='correct')return;const stamp=`${key}:${state.mode}`;if(sentenceEffects.current.has(stamp))return;sentenceEffects.current.add(stamp);if(sentence.pending!==state.mode)return;const sources=[...document.querySelectorAll('.selected-chunk,.free-dictation,.guided-input')].map(n=>n.getBoundingClientRect());emitExperience(sources,true,true,particleEffect);},[key,state.mode,sentence?.outcomes,state.module,active]);
 useEffect(()=>{if(!active)clearExperienceEffects();},[active]);
 useEffect(()=>{
  for(const w of deck.words){const d=state.words[w.id];if(d?.result==='correct'||d?.result==='reviewed')award({id:`spell:${deck.fingerprint}:${state.round}:${w.id}`,kind:'spelling',result:d.result});}
  for(const p of prompts){const d=state.sentences[p.key];for(const mode of ['chunks','free'])if(d?.outcomes[mode]==='correct')award({id:`dictation:${deck.fingerprint}:${state.round}:${p.key}:${mode}`,kind:'dictation',mode,correct:true,wordCount:writtenWords(p.sentence).length});}
 },[state.words,state.sentences,state.round]);
 const act=(action:Action)=>dispatch({type:'sentence',action});
 // Create a stable shuffled bank once, even before the first chip is selected.
 useEffect(()=>{if(prompt&&!state.sentences[prompt.key])setState((s:any)=>({...s,sentences:{...s.sentences,[prompt.key]:newSentence(prompt)}}));},[prompt?.key]);
 useEffect(()=>{if(!writePreference(storageKey,JSON.stringify(state))&&!warned.current){warned.current=true;notify('浏览器无法保存进度；关闭页面后可能无法恢复。');}},[state]);
 useEffect(()=>{
  document.body.dataset.practice='true';const size=()=>document.documentElement.style.setProperty('--practice-vh',`${window.visualViewport?.height||window.innerHeight}px`);
  size();window.visualViewport?.addEventListener('resize',size);window.addEventListener('resize',size);
  const visibility=()=>{setVisible(!document.hidden);if(document.hidden){setListenRun(false);setState((s:any)=>reduceStudy(deck,s,{type:'pause',question:studyKey(s)}));}};
  document.addEventListener('visibilitychange',visibility);
  return()=>{delete document.body.dataset.practice;window.visualViewport?.removeEventListener('resize',size);window.removeEventListener('resize',size);document.removeEventListener('visibilitychange',visibility);};
 },[deck]);
 const focusAnswer=()=>{
  const fields=[...document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('.native-practice .spelling-input,.native-practice .guided-input input,.native-practice .dictation-input')];
  const target=fields.find(node=>node===document.activeElement)||fields.find(node=>!node.value)||fields[0];
  if(target&&target!==document.activeElement){target.focus({preventScroll:true});target.setSelectionRange(target.value.length,target.value.length);}
 };
 useEffect(()=>{audio.stop();setImeWarning(false);setComposing(false);setSeek(0);if(active&&!complete)focusAnswer();},[key,panel]);
 useLayoutEffect(()=>{if(active&&!complete&&(state.module==='spelling'||!state.sentenceFinished))focusAnswer();},[key,panel,state.difficulty,active]);
 useEffect(()=>{if(!active)return;const isWord=state.module==='spelling'&&state.pending==='word',isSentence=state.module==='listening'&&state.mode!=='listening'&&sentence?.pending===state.mode;
  if(!isWord&&!isSentence)return;const timer=setTimeout(()=>dispatch({type:isWord?'next':'sentenceNext'}),isWord?300:matchMedia('(prefers-reduced-motion: reduce)').matches?450:1000);return()=>clearTimeout(timer);
 },[key,active,state.pending,sentence?.pending]);
 const openPanel=(value:'gallery'|'settings')=>{setListenRun(false);audio.stop();dispatch({type:'pause'});setPanel(value);};
 // An explicit Learning entry opens spelling without discarding any saved drafts.
 useLayoutEffect(()=>{if(!spellingRequest)return;setListenRun(false);audio.stop();setPanel(null);setState((current:any)=>reduceStudy(deck,current,{type:'module',value:'spelling',question:studyKey(current)}));},[spellingRequest]);
 const selectModule=(value:string)=>{setListenRun(false);audio.stop();flushSync(()=>dispatch({type:'module',value}));focusAnswer();};
 const setMode=(value:string)=>{setListenRun(false);setPass(0);audio.stop();flushSync(()=>dispatch({type:'mode',value}));focusAnswer();};
 const setDifficulty=(value:string)=>{setComposing(false);setImeWarning(false);flushSync(()=>dispatch({type:'preference',name:'difficulty',value}));focusAnswer();};
 const replay=()=>{if(!active)return;if(state.module==='spelling'&&word)audio.play(word.example?[word.example,word.english]:[word.english],state.rate,undefined,0,word.example?word.audio:undefined);else if(prompt){act({type:'play',rate:state.rate});audio.play([prompt.sentence],state.rate,undefined,0,promptAudio);}};
 const setRate=(rate:number)=>{dispatch({type:'preference',name:'rate',value:rate});if(!playback&&word)audio.play(state.module==='spelling'?(word.example?[word.example,word.english]:[word.english]):[prompt.sentence],rate,undefined,0,state.module==='spelling'?(word.example?word.audio:undefined):promptAudio);};
 useEffect(()=>{if(!listenRun||!active||!playback||!prompt||state.sentenceFinished)return;
  const rate=repeat==='fastThreeSlowTwo'?(pass<3?1:.75):state.rate;
  audio.play([promptAudio?prompt.sentence:prompt.sentence.slice(seek)],rate,()=>{
   const count=repeat==='single'?Infinity:repeat==='once'?1:5;
   if(pass+1<count){setSeek(0);setPass(p=>p+1);}else{
    setPass(0);setSeek(0);
    if(onePhoto){const next=prompts.findIndex((p:any,i:number)=>i>state.sentenceIndex&&(deck.words[p.wordIndex].occurrenceID||p.imageIndex!==prompt.imageIndex));if(next<0){setListenRun(false);return;}dispatch({type:'selectWord',index:prompts[next].wordIndex});}
    else if(state.sentenceIndex+1<prompts.length)dispatch({type:'sentenceNext'});else{dispatch({type:'sentenceNext'});setListenRun(false);}
   }
  },promptAudio?0:seek,promptAudio);
  return audio.stop;
 },[listenRun,active,playback,prompt?.key,pass,repeat,state.rate,seek,onePhoto]);
 useEffect(()=>{const keyboard=(e:KeyboardEvent)=>{
  if(e.defaultPrevented||!active||composing||e.isComposing||e.keyCode===229||e.repeat||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;
  if(e.target!==input.current&&e.target!==document.body&&e.target!==document.documentElement)return;
  if(state.module==='spelling'){if(e.key===' '){e.preventDefault();replay();}if(e.key==='Escape'&&!draft.result){e.preventDefault();dispatch({type:'reveal'});}if(e.key==='Enter'&&draft.result){e.preventDefault();dispatch({type:'next'});}}
 };window.addEventListener('keydown',keyboard);return()=>window.removeEventListener('keydown',keyboard);});
 const virtualPress=(pressed:string)=>{
  if(!active||complete||composing)return;
  if(state.module==='spelling'){
   input.current?.focus({preventScroll:true});
   if(pressed===' '){replay();return;}
   if(pressed==='Escape'){if(!draft.result)dispatch({type:'reveal'});return;}
   if(pressed==='Enter'){if(draft.result)dispatch({type:'next'});return;}
   if(draft.result)return;
   const edited=editKeyboardText(draft.input,input.current?.selectionStart,input.current?.selectionEnd,pressed);
   if(edited){setImeWarning(false);if(typingSound&&xp.level>=3)playTypingSound();flushSync(()=>dispatch({type:'input',value:edited.value}));input.current?.setSelectionRange(edited.cursor,edited.cursor);}
  }else if(state.module==='listening'&&state.mode==='free'&&!state.sentenceFinished){
   if(sentenceResult){if(pressed==='Enter')dispatch({type:'sentenceNext'});return;}
   const inputs=[...document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('.guided-input input,.dictation-input')];
   const target=inputs.find(node=>node===document.activeElement)||inputs.find(node=>!node.value)||inputs[0];if(!target)return;target.focus({preventScroll:true});
   if(pressed==='Escape'){act({type:'giveUp'});return;}
   if(pressed==='Backspace'&&!target.value){inputs[inputs.indexOf(target)-1]?.focus({preventScroll:true});return;}
   if(pressed==='Enter'){const next=inputs[inputs.indexOf(target)+1];if(next)next.focus({preventScroll:true});else act({type:'submit'});return;}
   const edited=editKeyboardText(target.value,target.selectionStart,target.selectionEnd,pressed);if(!edited)return;
   const prototype=target instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
   Object.getOwnPropertyDescriptor(prototype,'value')!.set!.call(target,edited.value);target.setSelectionRange(edited.cursor,edited.cursor);flushSync(()=>target.dispatchEvent(new Event('input',{bubbles:true})));if(target===document.activeElement)target.setSelectionRange(Math.min(edited.cursor,target.value.length),Math.min(edited.cursor,target.value.length));
  }
 };
 const required=word?expectedInput(word,draft):'',wrong=word?mismatch(required,draft.input):-1;
 const progress=completionProgress(required,draft.input);
 const results=Object.values(state.words) as any[],correct=results.filter(d=>d.result==='correct').length,reviewed=results.filter(d=>d.result&&d.result!=='correct').length;
 const sentenceResult=sentence?.outcomes[state.mode],check=sentence?.checks[state.mode],revealed=sentence?.revealed.includes(state.mode);
 const sentenceWords=prompt?writtenWords(prompt.sentence):[];
 const photoPalette=usePhotoPalette();
 const layoutRoot=useRef<HTMLElement>(null);
 useLayoutEffect(()=>{
  const root=layoutRoot.current;if(!root)return;
  let frame=0;
  const update=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const photo=root.querySelector<HTMLElement>('.photo-browse');if(!photo)return;
    const style=getComputedStyle(root),body=root.querySelector<HTMLElement>('.native-body')!;
    const height=(node:Element)=>{const s=getComputedStyle(node);return node.getBoundingClientRect().height+parseFloat(s.marginTop)+parseFloat(s.marginBottom);};
    // Measure real controls, including feedback and wrapped dictation. Preserve a
    // readable photograph on exceptionally short screens; only those scroll.
    const siblings=[...root.children].filter(n=>n!==body&&getComputedStyle(n).position!=='absolute'&&getComputedStyle(n).position!=='fixed'&&n.tagName!=='DIALOG');
    const bodyExtras=[...body.children].reduce((sum,n)=>sum+(n.classList.contains('native-card')?height(n)-photo.getBoundingClientRect().height:height(n)),0);
    const available=root.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-parseFloat(style.rowGap)*siblings.length-siblings.reduce((sum,n)=>sum+height(n),0)-bodyExtras;
    const target=Math.max(desktopKeyboard?220:140,Math.min(word?.example?330:270,Math.floor(available)));
    if(root.style.getPropertyValue('--photo-height')!==`${target}px`)root.style.setProperty('--photo-height',`${target}px`);
    revealFocusedAnswer();
   });
  };
  const observer=new ResizeObserver(update);
  for(const element of [root,...root.querySelectorAll('.native-header,.module-tabs,.virtual-keyboard,.native-answer-footer,.native-hint,.sentence-toolbar,.native-example,.sentence-content')])observer.observe(element);
  update();return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[state.module,state.mode,state.difficulty,desktopKeyboard,!!word?.example,complete]);
 const held=useRef(new Set<number>()),swipe=useRef<{x:number;y:number}|null>(null),suppressPhoto=useRef(0);
 return <main onFocusCapture={revealFocusedAnswer} ref={layoutRoot} style={photoPalette.style} className="native-practice" data-example={!!word?.example} data-module={state.module} aria-label="学习">
  {imeWarning&&<div className="english-input-warning" role="status">请切换到英语输入法</div>}
  <header className="native-header">{state.module!=='spelling'&&<button className="native-back" aria-label="返回单词学习" onClick={()=>selectModule('spelling')}><Icon name="back"/></button>}<PracticeProgress deckTitle={deck.title} position={state.index} count={deck.words.length} openLevel={()=>{location.hash='/settings/level';}} openDeck={()=>openPanel('settings')}/><button className="practice-library" aria-label="全部卡组" onClick={exit}><strong>卡组</strong><small>选择与导入</small></button></header>
  <div className="module-tabs" role="tablist" aria-label="学习模块">{modules.map(([id,title])=><button role="tab" aria-selected={state.module===id} key={id} onClick={()=>selectModule(id)}>{state.module===id&&<Icon name={id==='spelling'?'keycap':id==='listening'?'headphones':'microphone'}/>}<span>{title}</span></button>)}</div>
  {complete?<section className="native-completion"><h1>本轮训练完成</h1><p>拼对 {correct} 个词，复习 {reviewed} 个词。</p><button className="native-primary" onClick={()=>dispatch({type:'restart'})}>再来一轮</button><button className="native-button" onClick={exit}>换个卡组</button><button className="text-button" onClick={download}>下载卡组，在 App 中打开</button></section>:<>
   <div className="native-body" onPointerDown={e=>{if(e.pointerType==='mouse'||(e.target as HTMLElement).closest('input,textarea,select,.chunk,.reading-content,.native-example'))return;swipe.current={x:e.clientX,y:e.clientY};}} onPointerUp={e=>{const start=swipe.current;swipe.current=null;if(!start||panel||held.current.size>1)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.4){const i=modules.findIndex(([id])=>id===state.module),target=modules[i+(dx<0?1:-1)];if(target){suppressPhoto.current=Date.now()+400;selectModule(target[0]);}}}} onPointerCancel={()=>{swipe.current=null;}}>
    <article className="native-card"><div className="photo-browse">
     <PhotoFocus onImageReady={photoPalette.read} src={deck.images[word.imageIndex]} fit={desktopKeyboard||state.module==='listening'?'contain':'focus'} focus={word.focus} alt={word.focus?'训练照片，彩色框标示当前物体':'完整场景照片'} active={active} retry={photoRetry} onLoadState={setPhotoState}/><button className="photo-open" aria-label={photoState==='error'?'重新加载图片':'选择照片'} onClick={()=>{if(photoState==='error'){setPhotoRetry(n=>n+1);return;}if(Date.now()<suppressPhoto.current){suppressPhoto.current=0;return;}openPanel('gallery');}} onPointerDown={e=>{held.current.add(e.pointerId);if(held.current.size>1)openPanel('gallery');}} onPointerUp={e=>held.current.delete(e.pointerId)} onPointerCancel={()=>held.current.clear()}></button></div>
     {state.module==='spelling'?<div className="native-hint"><button aria-label={state.hiddenChinese?'显示中文提示':'隐藏中文提示'} onClick={()=>dispatch({type:'preference',name:'hiddenChinese',value:!state.hiddenChinese})}><h1>{state.hiddenChinese?'点击显示释义':word.chinese}</h1><small>{word.phonetic}</small></button><button className="hint-speaker" aria-label="播放英文发音" onClick={replay}><SpeakerIcon/></button></div>:state.module==='listening'?<div className="sentence-toolbar"><select aria-label="句子练习模式" value={state.mode} onChange={e=>setMode(e.target.value)}>{modes.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select>{state.mode==='free'&&<select aria-label="听写难度" value={state.difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="easy">简单 · 字母数量</option><option value="medium">中等 · 单词数量</option><option value="hard">困难 · 无提示</option></select>}</div>:<div className="native-hint"><span>听示范，再读出句子</span></div>}
    </article>
    {state.module==='spelling'&&word.example&&<SentenceLine sentence={word.example} target={word.english} translation={word.exampleChinese} hidden={state.hiddenChinese} position={audio.position} open={()=>selectModule('speaking')}/>}
    {state.module==='listening'&&(!prompt?<p className="native-unavailable">这张卡片没有可练习的例句。</p>:state.sentenceFinished?<section className="native-completion"><h2>本轮句子练习完成</h2><p>已到达卡组末尾。</p><button className="native-button" onClick={()=>openPanel('gallery')}>选择照片继续练习</button></section>:<section className="sentence-content" aria-label={modes.find(([id])=>id===state.mode)?.[1]}>
     {state.mode==='listening'?<><p className="listening-sentence">{exampleWords(prompt.sentence).map((w,i)=><span className={audio.position>=w.start&&audio.position<w.end?'spoken-word':''} key={i}>{w.text} </span>)}</p><p className="muted">{prompt.translation}</p><label className="listening-seek">句子位置（按词）<input aria-label="句子播放位置" type="range" min="0" max={Math.max(0,exampleWords(prompt.sentence).length-1)} value={Math.max(0,exampleWords(prompt.sentence).findIndex(w=>(audio.position>=0?audio.position:seek)>=w.start&&(audio.position>=0?audio.position:seek)<w.end))} onChange={e=>{audio.stop();setSeek(exampleWords(prompt.sentence)[Number(e.target.value)]?.start||0);}}/></label><select aria-label="循环方式" value={repeat} onChange={e=>{setRepeat(e.target.value);setPass(0);writePreference('piclex-web.listening.repeat',e.target.value);}}>{[['five','单句播五遍'],['once','单句播一遍'],['fastThreeSlowTwo','单句快3慢2'],['single','仅单句循环']].map(([id,title])=><option key={id} value={id}>{title}</option>)}</select><label className="check-row"><input type="checkbox" checked={onePhoto} onChange={e=>{setOnePhoto(e.target.checked);writePreference('piclex-web.listening.single-photo',String(e.target.checked));}}/>每张照片只听一句</label></>:state.mode==='chunks'?<><p className="chunk-instruction">{sentence.selected.length?'点词块可撤回，长按或右键可调整位置':'听一句，点选词块拼成句子'}</p><div className="chunk-answer" aria-label="已选词块">{sentence.selected.map((id:number)=><Chunk key={id} text={sentence.chunks[id].text} disabled={!!sentenceResult} remove={()=>act({type:'remove',id})} move={offset=>act({type:'move',id,offset})}/>)}</div><div className="chunk-bank" aria-label="待选词块">{sentence.bank.filter((id:number)=>!sentence.selected.includes(id)).map((id:number)=><button className="chunk" key={id} disabled={!!sentenceResult} onClick={()=>act({type:'select',id})}>{sentence.chunks[id].text}</button>)}</div></>:state.difficulty==='hard'?<EnglishInput key={prompt.key} multiline className="dictation-input" label="听写句子" onWarning={setImeWarning} placeholder="听一句，写下听到的英文" value={sentence.freeText} maxLength={2000} onVirtualKey={virtualPress} readOnly={!!sentenceResult} onComposing={setComposing} onValue={value=>act({type:'input',value})} onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing&&!e.shiftKey){e.preventDefault();if(sentenceResult)dispatch({type:'sentenceNext'});else act({type:'submit'});}}}/>:<GuidedInput onVirtualKey={virtualPress} sentence={prompt.sentence} value={sentence.guided||sentenceWords.map((_:string,i:number)=>writtenWords(sentence.freeText)[i]||'')} difficulty={state.difficulty} disabled={!!sentenceResult} onWarning={setImeWarning} onComposing={setComposing} onSubmit={()=>sentenceResult?dispatch({type:'sentenceNext'}):act({type:'submit'})} onChange={values=>act({type:'guided',values})}/>}
     {sentenceResult==='assisted'?<p className="sentence-feedback" role="status">参考答案</p>:check&&<div className="sentence-feedback" role="status"><strong>{check.isCorrect?'听写正确！':'再听一次，试着修改答案'}</strong>{!check.isCorrect&&(state.mode==='chunks'?<p>词块顺序还需要调整。</p>:<><div className="sentence-diff">{check.edits.map((edit:any,i:number)=><span key={i} className={edit.kind==='match'?'matched':'needs-work'}>{edit.kind==='match'?edit.actual:edit.kind==='omission'?revealed?`遗漏：${edit.expected}`:'遗漏一词':edit.kind==='addition'?`多余：${edit.actual}`:revealed?`${edit.actual} → ${edit.expected}`:`替换：${edit.actual}`}</span>)}</div><button className="text-button" onClick={()=>act({type:revealed?'retry':'reveal'})}>{revealed?'重新拼写':'显示答案'}</button></>)}</div>}
     {revealed&&<div className="standard-answer"><p>{prompt.sentence}</p><p className="muted">{prompt.translation}</p></div>}
    </section>)}
    {state.module==='speaking'&&(word.example?<Reading key={word.id} word={word} active={active} audio={audio} rate={state.rate} notify={notify} saved={readingSaved.current} reward={(matched,count)=>award({id:`reading:${deck.fingerprint}:${state.round}:${word.id}`,kind:"reading",matched,wordCount:count})} next={()=>{if(state.index+1<deck.words.length)dispatch({type:'selectWord',index:state.index+1});else notify('已到达卡组末尾。');}}/>:<p className="native-unavailable">这张卡片没有可跟读的例句。</p>)}
   </div>
   {state.module==='spelling'?<div className="native-answer-footer"><p className={`answer-feedback ${wrong>=0?'error':''}`} role="status">{draft.result==='revealed'?`正确答案：${word.english}`:draft.result?`✓ ${draft.hadMistake?'已纠正':'答对了'}，${word.english}`:wrong>=0?'请删除错误字母后继续输入':''}</p>
    <div className={`native-answer ${wrong>=0?'wrong':''}`} onClick={()=>input.current?.focus()}><AnswerSlots expected={word.english} entered={draft.input} revealed={draft.result==='revealed'} quickIndices={draft.quickIndices} scope={key} active={active} effect={particleEffect} completed={draft.result==='correct'||draft.result==='reviewed'} perfect={draft.result==='correct'}/><SpellingGlow progress={progress} complete={draft.result==='correct'||draft.result==='reviewed'} revealed={draft.result==='revealed'} error={wrong>=0} active={active} scope={`${deck.fingerprint}:${state.round}`}/><EnglishInput key={key} ref={input} autoFocus label="输入英文" className="spelling-input" onVirtualKey={virtualPress} value={draft.input} readOnly={!!draft.result} onWarning={setImeWarning} onComposing={setComposing} onValue={value=>dispatch({type:'input',value})}/><button type="button" className="answer-backspace" aria-label="退格" disabled={!active||!draft.input||!!draft.result} onPointerDown={event=>event.preventDefault()} onClick={event=>{event.stopPropagation();virtualPress('Backspace');}}>⌫</button></div>
    <Playback play={replay} stop={audio.stop} playing={audio.playing} rate={state.rate} setRate={setRate} label={word.example?'播放句子和单词':'播放单词'}/>
    {draft.result==='revealed'||draft.result&&!state.pending?<button className="native-primary" onClick={()=>dispatch({type:'next'})}>{state.index+1===deck.words.length?'完成本轮':'下一个'}</button>:<button className="native-primary" disabled={!!draft.result} onClick={()=>dispatch({type:'reveal'})}>不认识 <kbd>Esc</kbd></button>}
   </div>:state.module==='listening'&&prompt&&!state.sentenceFinished?<div className="native-answer-footer sentence-footer">
    {playback?<><div className="native-playback"><button className="native-button" disabled={state.sentenceIndex===0} onClick={()=>{setPass(0);dispatch({type:'sentencePrevious'});}}>上一句</button><button className="native-primary" onClick={()=>{audio.stop();setListenRun(v=>!v);}}>{listenRun?'暂停':'播放'}</button><button className="native-button" onClick={()=>{setPass(0);dispatch({type:'sentenceNext'});}}>下一句</button></div><div className="listening-status"><span>第 {pass+1} 遍</span><select aria-label="播放速度" value={state.rate} onChange={e=>setRate(Number(e.target.value))}>{rates.map(r=><option key={r}>{r}</option>)}</select></div></>:<><Playback play={replay} stop={audio.stop} playing={audio.playing} rate={state.rate} setRate={setRate}/>{sentenceResult?<div className="sentence-actions">{state.mode==='chunks'&&sentenceResult==='correct'&&<button className="native-button" onClick={()=>setMode('free')}>挑战自由听写</button>}<button className="native-primary" onClick={()=>dispatch({type:'sentenceNext'})}>下一个</button></div>:<div className="sentence-actions">{state.mode==='free'&&<button className="native-button" disabled={!sentence.freeText.trim()} onClick={()=>act({type:'submit'})}>检查答案</button>}<button className="native-primary" onClick={()=>act({type:'giveUp'})}>听不懂</button></div>}</>}
   </div>:null}
  </>}
  {!complete&&(state.module==='spelling'||state.module==='listening'&&state.mode==='free'&&!!prompt&&!state.sentenceFinished)&&<VirtualKeyboard active={active} press={virtualPress} lettersOnly={state.module==='spelling'}/>}
  {panel&&<Dialog title={panel==='gallery'?'选择照片':'学习设置'} close={()=>setPanel(null)}>{panel==='settings'?<><p className="muted small">本轮进度 {Math.min(state.index+1,deck.words.length)} / {deck.words.length}</p><select className="native-deck-select" aria-label="切换卡组" value={deck.id} onChange={e=>{audio.stop();setPanel(null);selectDeck(e.target.value);}}>{deckChoices.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select><label className="check-row"><span>快拼{xp.level<6?" · LV6 解锁":""}</span><input type="checkbox" role="switch" aria-label="快拼" disabled={xp.level<6&&!state.quick} checked={state.quick} onChange={e=>dispatch({type:'preference',name:'quick',value:e.target.checked})}/></label><label className="check-row"><span>经典键盘声音{xp.level<3?' · LV3 解锁':''}</span><input type="checkbox" role="switch" aria-label="经典键盘声音" disabled={xp.level<3} checked={typingSound&&xp.level>=3} onChange={e=>{setTypingSound(e.target.checked);writePreference('piclex-web.typing-sound',String(e.target.checked));}}/></label><label className="check-row">粒子效果<select aria-label="粒子效果" value={particleEffect} onChange={e=>{setEffect(e.target.value);writePreference("piclex-web.particle-effect",e.target.value);}}><option value="socialCode">社交暗号</option><option value="judgmentLight" disabled={xp.level<7}>裁决之光{xp.level<7?" · LV7 解锁":""}</option></select></label><p className="muted small">优先练习出错的字母，跳过本浏览器中已掌握的单词。</p><label className="check-row"><span>显示中文提示</span><input type="checkbox" checked={!state.hiddenChinese} onChange={e=>dispatch({type:'preference',name:'hiddenChinese',value:!e.target.checked})}/></label><button className="native-button" onClick={()=>setPanel('gallery')}>选择照片</button><button className="native-button" onClick={share}>分享卡组</button><button className="native-button" onClick={download}>下载卡组</button><p className="muted small">学习进度保存在当前浏览器。</p></>:<><p className="muted small">选择照片，按卡片顺序练习</p><div className="native-photo-grid">{deck.images.map((src,imageIndex)=>{const first=deck.words.findIndex(w=>w.imageIndex===imageIndex);return <button key={src} aria-label={`照片 ${imageIndex+1}`} aria-pressed={word?.imageIndex===imageIndex} onClick={()=>{dispatch({type:'selectWord',index:word?.imageIndex===imageIndex?state.index:first});setPanel(null);}}><img src={src} alt="" loading="lazy"/><span>{imageIndex+1}</span></button>;})}</div></>}</Dialog>}
 </main>;
}
function Chunk({text,disabled,remove,move}:{text:string;disabled:boolean;remove:()=>void;move:(offset:number)=>void}){
 const [menu,setMenu]=useState(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),long=useRef(false);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 return <span className="selected-chunk"><button className="chunk" disabled={disabled} onClick={()=>{if(!long.current)remove();long.current=false;}} onContextMenu={e=>{e.preventDefault();setMenu(true);}} onPointerDown={()=>{long.current=false;timer.current=setTimeout(()=>{long.current=true;setMenu(true);},450);}} onPointerUp={()=>clearTimeout(timer.current)} onPointerCancel={()=>clearTimeout(timer.current)} onKeyDown={e=>{if(e.altKey&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}if(e.key==='Escape')setMenu(false);}}>{text}</button>{menu&&!disabled&&<span className="chunk-menu"><button aria-label={`向前移动 ${text}`} onClick={()=>{move(-1);setMenu(false);}}><Icon name="back"/></button><button aria-label={`向后移动 ${text}`} onClick={()=>{move(1);setMenu(false);}}><Icon name="arrow"/></button><button aria-label={`撤回 ${text}`} onClick={remove}>撤回</button><button aria-label="关闭词块菜单" onClick={()=>setMenu(false)}><Icon name="close"/></button></span>}</span>;
}
