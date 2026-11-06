import test from 'node:test';
import assert from 'node:assert/strict';
import {editSpellingText} from '../packages/learning-ui/src/spelling-edit.mjs';
import {newStudy,reduceStudy,studyKey} from '../packages/practice/src/study.mjs';
import {promptsFor,newSentence} from '../packages/practice/src/sentence.mjs';
const word={id:'a',english:'glass partition',example:'The glass partition provides privacy.',exampleChinese:'',imageIndex:0};
const deck={fingerprint:'input-test',words:[word,{...word,id:'b'}]};
const act=(s,a)=>reduceStudy(deck,s,{...a,question:studyKey(s)},promptsFor(deck));
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value))freeze(v);}return value;}
test('caret follows automatic spaces, hyphens, apostrophes, leading numbers and trailing punctuation',()=>{
 for(const expected of ['glass partition','ice-cream',"don't",'3D printer','hello!','rock & roll']){
  let value='',cursor=0;for(const key of expected.replace(/[^a-z]/gi,'')){
   const edit=editSpellingText(expected,value,cursor,cursor,key);value=edit.value;cursor=edit.cursor;
   assert.equal(cursor,value.length,`${expected}: ${value}`);
  }assert.equal(value,expected);
 }
});
test('middle edits, selected replacement, repeated deletion and rejected additions preserve the caret',()=>{
 assert.deepEqual(editSpellingText(word.english,'glass p',7,7,'a'),{value:'glass pa',cursor:8,end:8});
 assert.deepEqual(editSpellingText(word.english,'glass pa',7,7,'Delete'),{value:'glass p',cursor:7,end:7});
 assert.deepEqual(editSpellingText(word.english,'glass xa',6,7,'p'),{value:'glass pa',cursor:7,end:7});
 assert.deepEqual(editSpellingText(word.english,'glass x',7,7,'a'),{value:'glass x',cursor:7,end:7});
 assert.deepEqual(editSpellingText(word.english,'glass p',7,7,'Backspace'),{value:'glass',cursor:5,end:5});
 assert.deepEqual(editSpellingText(word.english,'glass',5,5,'Backspace'),{value:'glas',cursor:4,end:4});
 assert.deepEqual(editSpellingText('pr','p',1,1,'r'),{value:'pr',cursor:2,end:2});
});
test('spelling updates only its own draft, preserves frozen history, rejects stale events and grades corrections',()=>{
 let s=newStudy(deck);const p=promptsFor(deck)[0];s.sentences[p.key]=newSentence(p);s.words.b={input:'g',result:null,hadMistake:false,quickIndices:null};freeze(s);
 const n=act(s,{type:'input',value:'glassp'});assert.equal(n.words.a.input,'glass p');assert.equal(n.sentences,s.sentences);assert.equal(n.history,s.history);assert.equal(n.words.b,s.words.b);
 assert.equal(reduceStudy(deck,n,{type:'input',value:'wrong',question:'stale'}),n);
 const wrong=act(freeze(n),{type:'input',value:'glass px'});assert.equal(wrong.words.a.hadMistake,true);assert.deepEqual(wrong.history.a.mistakes,[7]);assert.equal(n.history.a,undefined);
 assert.equal(act(freeze(wrong),{type:'input',value:'glass pxx'}),wrong);
 const fixed=act(act(wrong,{type:'input',value:'glass p'}),{type:'input',value:word.english});assert.equal(fixed.words.a.result,'reviewed');assert.equal(fixed.pending,'word');
 const next=act(freeze(fixed),{type:'next'});assert.equal(next.index,1);assert.equal(fixed.index,0);
});
test('dictation does not copy spelling history or unrelated sentence drafts',()=>{
 let s=act(newStudy(deck),{type:'module',value:'listening'});s=act(s,{type:'mode',value:'free'});const prompts=promptsFor(deck);s.sentences["unrelated"]={pending:null};freeze(s);
 const n=act(s,{type:'sentence',action:{type:'input',value:'The glass'}});assert.equal(n.words,s.words);assert.equal(n.history,s.history);assert.equal(n.sentences.unrelated,s.sentences.unrelated);assert.equal(n.sentences[prompts[0].key].freeText,'The glass');
});
