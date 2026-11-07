import test from 'node:test';
import assert from 'node:assert/strict';
import {newStudy,reduceStudy,studyKey,wordDraft} from '../packages/practice/src/study.mjs';
import {promptsFor,promptIndex} from '../packages/practice/src/sentence.mjs';

const deck={fingerprint:'parity-state',id:'parity-state',words:[
 {id:'a',english:'apple',chinese:'苹果',imageIndex:0,example:'I eat an apple.',exampleChinese:'我吃一个苹果。'},
 {id:'b',english:'bed',chinese:'床',imageIndex:1,example:'I am in bed.',exampleChinese:'我在床上。'},
 {id:'c',english:'cup',chinese:'杯子',imageIndex:2,example:'The cup is here.',exampleChinese:'杯子在这里。'}
]};
const act=(s,type,extra={})=>reduceStudy(deck,s,{type,...extra,question:studyKey(s)});
const sentenceAct=(s,action)=>reduceStudy(deck,s,{type:'sentence',action,question:studyKey(s)});

function finishDictation(state,mode='chunks'){
 let next=act(state,'module',{value:'listening'});
 next=act(next,'mode',{value:mode});
 let guard=0;
 while(!next.sentenceFinished&&guard++<20){
  next=sentenceAct(next,{type:'giveUp'});
  next=act(next,'sentenceNext');
 }
 return next;
}

test('restarting a finished dictation clears only sentence outcomes and drafts',()=>{
 let s=act(newStudy(deck),'input',{value:'apx'}); // keep a spelling mistake and partial draft
 s=finishDictation(s,'free');
 assert.equal(s.sentenceFinished,true);
 assert.ok(Object.keys(s.sentences).length>0);
 // Navigating sentences prepares empty drafts for later words; restart must keep
 // every spelling draft/history exactly as they were before the dictation reset.
 const spellingBefore=structuredClone(s.words),historyBefore=structuredClone(s.history);
 const round=s.round,mode=s.mode;
 s=act(s,'dictationRestart');
 assert.equal(s.sentenceFinished,false);
 assert.equal(Object.keys(s.sentences).length,1);
 assert.deepEqual(s.sentences[promptsFor(deck)[s.sentenceIndex].key].outcomes,{});
 assert.equal(s.sentences[promptsFor(deck)[s.sentenceIndex].key].freeText,'');
 assert.deepEqual(s.words,spellingBefore);
 assert.deepEqual(s.history,historyBefore);
 assert.equal(s.round,round);
 assert.equal(s.mode,mode);
 assert.equal(s.sentenceIndex,promptIndex(promptsFor(deck),deck,s.index));
 assert.equal(s.words.a.input,'apx');
});

test('challenge free dictation resumes the last sentence without clearing chunks',()=>{
 let s=finishDictation(newStudy(deck),'chunks'),last=promptsFor(deck)[s.sentenceIndex];
 assert.equal(s.sentenceFinished,true);
 assert.equal(s.sentences[last.key].outcomes.chunks,'assisted');
 assert.equal(s.sentences[last.key].outcomes.free,undefined);
 s=act(s,'dictationChallenge');
 assert.equal(s.sentenceFinished,false);
 assert.equal(s.mode,'free');
 assert.equal(s.sentences[last.key].outcomes.chunks,'assisted');
 assert.equal(s.sentences[last.key].outcomes.free,undefined);
 // A terminal free outcome is not offered again.
 s=sentenceAct(s,{type:'giveUp'});
 s=act(s,'sentenceNext');
 assert.equal(s.sentenceFinished,true);
 assert.equal(s.sentences[last.key].outcomes.free,'assisted');
 assert.equal(act(s,'dictationChallenge'),s);
});

test('revisiting a finished final photo opens fresh dictation instead of disabled outcomes',()=>{
 let s=finishDictation(newStudy(deck),'free');
 const finalIndex=s.index,last=promptsFor(deck)[s.sentenceIndex],wordsBefore=structuredClone(s.words);
 s=act(s,'selectWord',{index:finalIndex});
 assert.equal(s.sentenceFinished,false);
 assert.deepEqual(s.sentences[last.key].outcomes,{});
 assert.deepEqual(s.sentences[last.key].selected,[]);
 assert.deepEqual(s.words,wordsBefore);
 // The fresh sentence is writable and terminal controls are gone.
 const fresh=promptsFor(deck)[s.sentenceIndex];
 s=sentenceAct(s,{type:'input',value:'fresh draft'});
 assert.equal(s.sentences[fresh.key].freeText,'fresh draft');
 assert.equal(s.sentences[fresh.key].outcomes.free,undefined);
});

test('freshSentence resets the selected located sentence after a finished round',()=>{
 let s=finishDictation(newStudy(deck),'free');
 const before=promptsFor(deck)[s.sentenceIndex];
 s=act(s,'freshSentence');
 assert.equal(s.sentenceFinished,false);
 assert.deepEqual(s.sentences[before.key].outcomes,{});
 assert.equal(s.sentences[before.key].freeText,'');
 s=act(s,'module',{value:'spelling'});
 assert.equal(act(s,'freshSentence'),s); // spelling never loses sentence history
});

test('fresh dictation keeps the displayed chunk order through unrelated state updates',()=>{
 let s=finishDictation(newStudy(deck),'chunks');s=act(s,'selectWord',{index:s.index});const prompt=promptsFor(deck)[s.sentenceIndex],shown=[...s.sentences[prompt.key].bank];
 s=act(s,'pause');assert.deepEqual(s.sentences[prompt.key].bank,shown);s=sentenceAct(s,{type:'select',id:shown[0]});assert.deepEqual(s.sentences[prompt.key].selected,[shown[0]]);
});
