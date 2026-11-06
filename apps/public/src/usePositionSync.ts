import {useEffect,useRef} from 'react';
import {positionAnchor,positionIndex,positionScope} from '../../../packages/backup/src/positions.mjs';
import {reduceStudy,studyKey,wordDraft} from '../../../packages/practice/src/study.mjs';
import {positions,recordPosition} from './position-store';
import {parseLearningURL} from '../../../packages/practice/src/learning-url.mjs';
export default function usePositionSync(deck:any,state:any,setState:(f:(s:any)=>any)=>void,onFailure:(s:string)=>void){
 const initialRoute=useRef(parseLearningURL(location.hash));
 const current=useRef(state);current.current=state;
 const control=useRef<{scope:string;signature:string;interacted:boolean;revision:string;ready:boolean}>({scope:'',signature:'',interacted:false,revision:'',ready:false});
 const error=useRef(onFailure);error.current=onFailure;
 useEffect(()=>{
  let cancelled=false;const c:typeof control.current=control.current={scope:'',signature:JSON.stringify(positionAnchor(deck,current.current)),interacted:false,revision:'',ready:false};
  const route=initialRoute.current;const explicit=!!(route?.word||route?.photo||route?.sentenceWord);
  const apply=()=>{if(cancelled||!c.ready||c.interacted||document.hidden)return;
   try{const row=positions().find((r:any)=>r.deck===c.scope);if(!row||row.revision===c.revision)return;
    const snapshot=current.current,draft=wordDraft(deck,snapshot);if(draft.input&&!draft.result)return;
    const index=positionIndex(deck,row);if(index==null)return;
    setState(s=>{if(c.interacted)return s;const draft=wordDraft(deck,s);if(draft.input&&!draft.result)return s;
     c.revision=row.revision;
     const next=index>=deck.words.length?{...s,index:deck.words.length,pending:null,presentation:s.presentation+1}:reduceStudy(deck,s,{type:'selectWord',index,question:studyKey(s)});
     c.signature=JSON.stringify(positionAnchor(deck,next));return next;
    });
   }catch(e){error.current((e as Error).message);}
  };
  const interact=(e:Event)=>{if((e.target as HTMLElement)?.closest?.('.native-practice')||(e.type==='keydown'&&document.querySelector('.native-practice')&&!(e.target as HTMLElement)?.closest?.('[role=dialog]')))c.interacted=true;};
  const visibility=()=>{if(!document.hidden){c.interacted=false;apply();}};
  const storage=(e:StorageEvent)=>{if(e.key==='piclex-web.deck-positions.v1')apply();};
  document.addEventListener('pointerdown',interact,true);document.addEventListener('keydown',interact,true);document.addEventListener('visibilitychange',visibility);
  window.addEventListener('piclex-positions-imported',apply);window.addEventListener('storage',storage);
  positionScope(deck).then(scope=>{if(cancelled)return;c.scope=scope;c.ready=true;if(!explicit)apply();else c.interacted=true;}).catch(e=>error.current(e.message));
  return()=>{cancelled=true;document.removeEventListener('pointerdown',interact,true);document.removeEventListener('keydown',interact,true);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('piclex-positions-imported',apply);window.removeEventListener('storage',storage);};
 },[deck]);
 useEffect(()=>{const c=control.current,anchor=positionAnchor(deck,state),signature=JSON.stringify(anchor);if(!c.ready||!anchor||signature===c.signature)return;c.signature=signature;
  // Only navigation after a local interaction publishes a fresh timestamp.
  if(c.interacted)try{recordPosition(c.scope,anchor);}catch(e){error.current((e as Error).message);}
 },[deck,state.index]);
}
