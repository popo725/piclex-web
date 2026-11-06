import {test} from 'node:test';
import assert from 'node:assert/strict';
import {upcomingPhotos} from '../packages/practice/src/upcoming-photos.mjs';
const deck={images:Array.from({length:9},(_,i)=>`photo-${i}`),words:Array.from({length:18},(_,i)=>({id:`word-${i}`,imageIndex:Math.floor(i/2)}))};
const state={index:0,module:'spelling',history:{},quick:false};
test('five distinct photos roll forward, deduplicate URLs and stop at the end',()=>{
 assert.deepEqual(upcomingPhotos(deck,state,[],[]),deck.images.slice(1,6));
 assert.deepEqual(upcomingPhotos(deck,{...state,index:2},[],[]),deck.images.slice(2,7));
 assert.deepEqual(upcomingPhotos(deck,{...state,index:16},[],[]),[]);
 assert.deepEqual(upcomingPhotos(deck,{...state,index:18},[],[]),[]);
 const alias={...deck,images:[...deck.images]};alias.images[1]=alias.images[0];
 assert.deepEqual(upcomingPhotos(alias,state,[],[]),deck.images.slice(2,7));
});
test('quick spelling skips mastered photos, speaking retains them',()=>{
 const quick={...state,quick:true,history:{'word-2':{mastered:true},'word-3':{mastered:true}}};
 assert.deepEqual(upcomingPhotos(deck,quick,[],[]),deck.images.slice(2,7));
 assert.deepEqual(upcomingPhotos(deck,{...quick,module:'speaking'},[],[]),deck.images.slice(1,6));
});
test('sentence modes follow prompts, playback follows its looping playlist',()=>{
 const prompts=[0,4,8,12,16].map(wordIndex=>({wordIndex}));
 const listening={...state,module:'listening',mode:'chunks',sentenceIndex:0};
 assert.deepEqual(upcomingPhotos(deck,listening,prompts,[]),[2,4,6,8].map(i=>deck.images[i]));
 assert.deepEqual(upcomingPhotos(deck,{...listening,index:16,sentenceIndex:4},prompts,[]),[]);
 assert.deepEqual(upcomingPhotos(deck,{...listening,index:16,sentenceIndex:4,mode:'listening'},prompts,[0,2,4]),['photo-0','photo-4']);
 assert.deepEqual(upcomingPhotos(deck,{...listening,sentenceFinished:true},prompts,[]),[]);
});
