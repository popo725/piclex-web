import {useLayoutEffect,useMemo,useRef} from 'react';
import {bufferedSave} from '../../../packages/practice/src/buffered-save.mjs';
import {writePreference} from './storage';
export default function useStudyPersistence(key:string,state:unknown,checkpoint:string,onFailure:()=>void){
 const savedCheckpoint=useRef<string|null>(null);
 const failure=useRef(onFailure);failure.current=onFailure;
 const writer=useMemo(()=>bufferedSave((value:unknown)=>{const ok=writePreference(key,JSON.stringify(value));if(!ok)failure.current();return ok;}),[key]);
 // Stage after commit, never persist speculative renders or serialize in a key handler.
 useLayoutEffect(()=>{writer.schedule(state);if(document.hidden||savedCheckpoint.current!==checkpoint)writer.flush();savedCheckpoint.current=checkpoint;},[writer,state,checkpoint]);
 useLayoutEffect(()=>{
  const flush=()=>{writer.flush();},hide=()=>{if(document.hidden)flush();};
  document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',flush);
  return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',flush);flush();};
 },[writer]);
}
