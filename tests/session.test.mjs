import test from 'node:test';
import assert from 'node:assert/strict';
import { newSession, reduceSession, restoreSession, questionKey } from '../packages/practice/src/session.mjs';
const deck = { fingerprint:'one', words:[{english:'apple'},{english:'ice cream'},{english:'apple'}] };
const act = (s, type, value) => reduceSession(deck,s,{type,value,question:questionKey(s)});
test('wrong input must be corrected; an assisted correct answer is recorded only once',()=>{
 let s=newSession(deck);s=act(s,'input','ax');assert.equal(s.hadMistake,true);
 assert.equal(act(s,'input','axp').input,'ax');s=act(s,'input','a');s=act(s,'input','apple');assert.equal(s.result,'reviewed');
 assert.equal(act(s,'reveal'),s);const key=questionKey(s);s=act(s,'next');assert.deepEqual(s.results,['reviewed']);
 assert.equal(reduceSession(deck,s,{type:'next',question:key}),s);
});
test('resume preserves unfinished spelling and repeated occurrences remain separate',()=>{
 let s=act(newSession(deck),'input','ap');s=restoreSession(deck,JSON.parse(JSON.stringify(s)));assert.equal(s.input,'ap');
 s=act(s,'input','apple');s=act(s,'next');s=act(s,'input','icecream');assert.equal(s.input,'ice cream');assert.equal(s.result,'correct');
 s=act(s,'next');assert.equal(s.index,2);assert.equal(s.input,'');s=act(s,'reveal');s=act(s,'next');
 assert.equal(s.index,3);assert.deepEqual(s.results,['correct','correct','revealed']);assert.equal(act(s,'next'),s);
 const resumed=restoreSession(deck,s);assert.equal(resumed.index,3);assert.equal(act(resumed,'restart').round,1);
});
test('corrupt, future or mismatched progress cannot break a new deck',()=>{
 const s=newSession(deck);
 for(const invalid of [null,{...s,version:2},{...s,fingerprint:'other'},{...s,index:-1},{...s,index:1},{...s,results:['wrong']},{...s,input:'x'.repeat(300)},{...s,input:'ap',result:'correct'}]) assert.deepEqual(restoreSession(deck,invalid),s);
});
