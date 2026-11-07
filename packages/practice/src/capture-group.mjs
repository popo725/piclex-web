import {newStudy,restoreStudyFromStorage,restoreStudy} from './study.mjs';
import {promptsFor} from './sentence.mjs';

export const defaultCaptureID='local-default-photos';
export const defaultCaptureTitle='我的照片卡组';
export const isDefaultCapture=deck=>deck.id.startsWith('local-capture-')&&deck.title===defaultCaptureTitle;

// A view over the original per-photo records: no archive rewriting or deletion.
export function groupCapturedDecks(sources){
 const sorted=[...sources].sort((a,b)=>a.addedAt-b.addedAt||a.id.localeCompare(b.id));
 const words=[],images=[],studySources=[];
 for(const source of sorted){
  const offset=images.length;images.push(...source.images);
  words.push(...source.words.map(w=>({...w,imageIndex:w.imageIndex+offset})));
  studySources.push(source);
 }
 return {id:defaultCaptureID,title:defaultCaptureTitle,fingerprint:defaultCaptureID,words,images,studySources};
}

// The group has a stable progress key. Import each old photo's drafts once, and
// keep its original award scope so regrouping cannot award completed words twice.
export function restoreCaptureStudy(deck,read){
 const raw=read(`piclex-web.study.v2.${deck.fingerprint}`);
 const saved=raw?.version===2&&raw.fingerprint===deck.fingerprint?raw:null;
 const order=deck.words.map(w=>w.id),promptOrder=promptsFor(deck).map(p=>p.key);
 const groupPrompts=new Map(promptsFor(deck).map(p=>[promptIdentity(deck,p),p]));
 let adjusted=saved;
 if(saved){
  const index=remapIndex(saved.captureWordOrder,order,saved.index);
  const sentenceIndex=remapIndex(saved.capturePromptOrder,promptOrder,saved.sentenceFinished?saved.capturePromptOrder?.length:saved.sentenceIndex);
  adjusted={...saved,index:saved.module==='listening'&&saved.sentenceFinished&&sentenceIndex<promptOrder.length?promptsFor(deck)[sentenceIndex].wordIndex:index,sentenceIndex,sentenceFinished:saved.sentenceFinished&&sentenceIndex>=promptOrder.length};
 }
 const state=adjusted?restoreStudy(deck,adjusted):newStudy(deck);
 state.captureScopes={};
 for(const source of deck.studySources){
  const oldScope=saved?.captureScopes?.[source.id];
  const valid=oldScope&&typeof oldScope.fingerprint==='string'&&oldScope.fingerprint.length<=200&&Number.isSafeInteger(oldScope.round)&&oldScope.round>=0;
  if(valid){state.captureScopes[source.id]=oldScope;continue;}
  const old=restoreStudyFromStorage(source,read);
  state.captureScopes[source.id]={fingerprint:source.fingerprint,round:old.round};
  for(const word of source.words){if(old.words[word.id])state.words[word.id]=old.words[word.id];if(old.history[word.id])state.history[word.id]=old.history[word.id];}
  for(const prompt of promptsFor(source)){
   const grouped=groupPrompts.get(promptIdentity(source,prompt));
   if(grouped&&old.sentences[prompt.key])state.sentences[grouped.key]=old.sentences[prompt.key];
  }
 }
 state.captureWordOrder=order;state.capturePromptOrder=promptOrder;
 return state;
}
function remapIndex(oldOrder,order,index){
 if(!Array.isArray(oldOrder)||!Number.isInteger(index)||index<0)return 0;
 // Appending a photo resumes at the first new word if the old deck was finished.
 if(index===oldOrder.length){const known=new Set(oldOrder),firstNew=order.findIndex(id=>!known.has(id));return firstNew>=0?firstNew:order.length;}
 for(const id of oldOrder.slice(index)){const at=order.indexOf(id);if(at>=0)return at;}
 return order.length;
}
export function studyEventScope(deck,state,word){
 const source=sourceFor(deck,word);
 const scope=source&&state.captureScopes?.[source.id];
 return scope?`${scope.fingerprint}:${scope.round+state.round}`:`${deck.fingerprint}:${state.round}`;
}

export function studySentenceKey(deck,prompt){
 const source=sourceFor(deck,deck.words[prompt.wordIndex]);
 if(!source)return prompt.key;
 if(!promptKeys.has(source))promptKeys.set(source,new Map(promptsFor(source).map(p=>[promptIdentity(source,p),p.key])));
 return promptKeys.get(source).get(promptIdentity(deck,prompt))||prompt.key;
}

const sourcesByWord=new WeakMap(),promptKeys=new WeakMap();
const promptIdentity=(deck,prompt)=>JSON.stringify([deck.words[prompt.wordIndex].id,prompt.sentence]);
function sourceFor(deck,word){
 if(!deck.studySources)return undefined;
 if(!sourcesByWord.has(deck))sourcesByWord.set(deck,new Map(deck.studySources.flatMap(source=>source.words.map(w=>[w.id,source]))));
 return sourcesByWord.get(deck).get(word.id);
}
