import test from 'node:test';
import assert from 'node:assert/strict';
import {listeningPlaylist,listeningNeighbor} from '../packages/practice/src/listening.mjs';
import {newStudy,reduceStudy,studyKey} from '../packages/practice/src/study.mjs';
const prompts=[{key:'a',imageIndex:0,wordIndex:0},{key:'b',imageIndex:0,wordIndex:1},{key:'c',imageIndex:1,wordIndex:2},{key:'d',imageIndex:1,wordIndex:3},{key:'e',imageIndex:1,wordIndex:4}];
const words=[{},{},{},{occurrenceID:'song-1'},{occurrenceID:'song-2'}];
test('one photo retains current sentence and every explicit song occurrence',()=>{
 assert.deepEqual(listeningPlaylist(prompts,words,false,'b'),[0,1,2,3,4]);
 assert.deepEqual(listeningPlaylist(prompts,words,true,'b'),[1,2,3,4]);
 assert.deepEqual(listeningPlaylist(prompts,words,true,'e'),[0,2,3,4]);
});
test('manual and automatic navigation wrap in both directions in the filtered list',()=>{
 const list=listeningPlaylist(prompts,words,true,'b');
 assert.equal(listeningNeighbor(list,1,-1),4);assert.equal(listeningNeighbor(list,4,1),1);assert.equal(listeningNeighbor(list,1,1),2);
 assert.equal(listeningNeighbor([2],2,1),2);
});
test('jump selects exact sentence even when multiple sentences share a word',()=>{
 const deck={fingerprint:'test',words:[{id:'a',english:'desk',example:'This is a desk. It is white.',exampleChinese:'',imageIndex:0}]};
 let s={...newStudy(deck),module:'listening',mode:'listening'};
 s=reduceStudy(deck,s,{type:'listeningJump',index:1,question:studyKey(s)});assert.equal(s.sentenceIndex,1);assert.equal(s.index,0);assert.equal(s.sentenceFinished,false);
 s=reduceStudy(deck,s,{type:'listeningJump',index:0,question:studyKey(s)});assert.equal(s.sentenceIndex,0);
});
