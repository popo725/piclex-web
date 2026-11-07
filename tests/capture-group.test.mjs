import test from 'node:test';
import assert from 'node:assert/strict';
import {groupCapturedDecks,defaultCaptureID,isDefaultCapture,studyEventScope,studySentenceKey} from '../packages/practice/src/capture-group.mjs';
import {newStudy,restoreStudyFromStorage,reduceStudy,studyKey} from '../packages/practice/src/study.mjs';
import {promptsFor,newSentence,reduceSentence} from '../packages/practice/src/sentence.mjs';
const photo=n=>`${String(n).padStart(8,'0')}-1111-4111-8111-111111111111`;
const source=(n,word='cup')=>({id:`local-capture-${photo(n)}`,title:'我的照片卡组',addedAt:n,fingerprint:`fingerprint-${n}`,images:[`blob:${n}`],words:[{id:photo(n)+':0',english:word,chinese:'杯子',imageIndex:0,example:'This is a cup.',exampleChinese:'这是一个杯子。'}]});
const reader=states=>key=>states.find(s=>key===`piclex-web.study.v2.${s.fingerprint}`);
const input=(deck,state,value)=>reduceStudy(deck,state,{type:'input',value,question:studyKey(state)});
test('three independently saved photos form one ordered deck without changing the originals',()=>{
 const sources=[source(3),source(1),source(2)],before=structuredClone(sources),deck=groupCapturedDecks(sources);
 assert.equal(deck.id,defaultCaptureID);assert.equal(deck.images.length,3);assert.deepEqual(deck.words.map(w=>w.imageIndex),[0,1,2]);assert.deepEqual(deck.words.map(w=>w.id),[1,2,3].map(n=>photo(n)+':0'));assert.deepEqual(sources,before);
 assert.equal(isDefaultCapture(sources[0]),true);assert.equal(isDefaultCapture({...sources[0],title:'旅行'}),false);assert.equal(isDefaultCapture({...sources[0],id:'local-imported'}),false);
});
test('legacy drafts, mistakes and completed answers from every photo survive, with the original reward IDs',()=>{
 const a=source(1),b=source(2,'cat'),c=source(3),deck=groupCapturedDecks([a,b,c]);
 let sa=input(a,newStudy(a),'cup');sa.round=4;const sb=input(b,newStudy(b),'cx'),sc=input(c,newStudy(c),'cu');
 const restored=restoreStudyFromStorage(deck,reader([sa,sb,sc]));
 assert.equal(restored.words[a.words[0].id].result,'correct');assert.equal(restored.words[b.words[0].id].input,'cx');assert.equal(restored.words[c.words[0].id].input,'cu');assert.deepEqual(restored.history[b.words[0].id],sb.history[b.words[0].id]);
 assert.equal(studyEventScope(deck,restored,deck.words[0]),'fingerprint-1:4');assert.equal(studyEventScope(deck,restored,deck.words[1]),'fingerprint-2:0');
 const restarted=reduceStudy(deck,restored,{type:'restart',question:studyKey(restored)});
 assert.equal(studyEventScope(deck,restarted,deck.words[0]),'fingerprint-1:5');assert.equal(Object.keys(restarted.words).length,0);
 const reopened=restoreStudyFromStorage(deck,reader([restarted,sa,sb,sc]));assert.equal(Object.keys(reopened.words).length,0);assert.equal(studyEventScope(deck,reopened,deck.words[0]),'fingerprint-1:5');
});
test('adding photos retains a partial answer and resumes a finished deck at the first new photo',()=>{
 const a=source(1),b=source(2),old=groupCapturedDecks([a]);let state=restoreStudyFromStorage(old,reader([]));state=input(old,state,'cu');
 const deck=groupCapturedDecks([a,b]),restored=restoreStudyFromStorage(deck,reader([state]));assert.equal(restored.words[a.words[0].id].input,'cu');assert.equal(restored.index,0);
 state.index=1;const appended=restoreStudyFromStorage(deck,reader([state]));assert.equal(appended.index,1);assert.equal(appended.words[a.words[0].id].input,'cu');
});
test('photo removal remaps the cursor by word ID and keeps surviving drafts',()=>{
 const a=source(1),b=source(2),c=source(3),deck=groupCapturedDecks([a,b,c]);let state=restoreStudyFromStorage(deck,reader([]));state.index=1;state=input(deck,state,'cu');
 const next=groupCapturedDecks([b,c]),restored=restoreStudyFromStorage(next,reader([state]));assert.equal(restored.index,0);assert.equal(restored.words[b.words[0].id].input,'cu');
});
test('identical sentences in different photos retain separate drafts and original award keys',()=>{
 const a=source(1),b=source(2),deck=groupCapturedDecks([a,b]);const sa=newStudy(a),sb=newStudy(b);
 for(const [source,state,value] of [[a,sa,'This'],[b,sb,'This is']]){const p=promptsFor(source)[0];state.sentences[p.key]=reduceSentence(p,newSentence(p),'free',{type:'input',key:p.key,value});}
 const restored=restoreStudyFromStorage(deck,reader([sa,sb])),prompts=promptsFor(deck);assert.equal(prompts.length,2);assert.notEqual(prompts[0].key,prompts[1].key);
 assert.equal(restored.sentences[prompts[0].key].freeText,'This');assert.equal(restored.sentences[prompts[1].key].freeText,'This is');
 assert.equal(studySentenceKey(deck,prompts[1]),promptsFor(b)[0].key);
 const after=restoreStudyFromStorage(groupCapturedDecks([b]),reader([restored]));assert.equal(Object.values(after.sentences)[0].freeText,'This is');
});

test('finished listening stays finished on reload and opens appended sentences',()=>{
 const a=source(1),b=source(2),deck=groupCapturedDecks([a]);const state=restoreStudyFromStorage(deck,reader([]));state.module='listening';state.sentenceFinished=true;
 assert.equal(restoreStudyFromStorage(deck,reader([state])).sentenceFinished,true);
 const next=restoreStudyFromStorage(groupCapturedDecks([a,b]),reader([state]));assert.equal(next.sentenceFinished,false);assert.equal(next.sentenceIndex,1);assert.equal(next.index,1);
});
