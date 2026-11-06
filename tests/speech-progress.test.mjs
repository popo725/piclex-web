import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSpeechProgress} from '../apps/public/src/speech-progress.mjs';

const sentence='You have always been the caretaker. I should know, sir.';
test('speech advances between callbacks, monotonically, without completing early',()=>{
 const clock=createSpeechProgress(sentence,1,0),values=[];
 for(let now=33;now<=12000;now+=33)values.push(clock.sample(now));
 assert.ok(values[0]>0);assert.ok(values[25]>.05);
 assert.ok(values.every((value,i)=>value<1&&(!i||value>=values[i-1])));
 assert.ok(new Set(values.slice(0,100)).size>90);
 assert.ok(values.every((value,i)=>!i||value-values[i-1]<.03));
});
test('rate changes the pace and a new playback starts at zero',()=>{
 const slow=createSpeechProgress(sentence,.75,0),fast=createSpeechProgress(sentence,1.15,0);
 let a,b;for(let now=33;now<=1000;now+=33){a=slow.sample(now);b=fast.sample(now);}
 assert.ok(b>a*1.3);assert.equal(createSpeechProgress(sentence,1,1000).sample(1000),0);
});
test('pause time never advances the clock or causes a jump on resume',()=>{
 const clock=createSpeechProgress(sentence,1,0);
 let before;for(let now=33;now<=990;now+=33)before=clock.sample(now);
 clock.setPaused(true,990);assert.equal(clock.sample(8000),before);
 clock.setPaused(false,8000);const resumed=clock.sample(8033);
 assert.ok(resumed>before&&resumed-before<.03);
});
test('sparse, late and out-of-order boundaries adjust smoothly without rewinding',()=>{
 const clock=createSpeechProgress(sentence,1,0);let last=0;
 for(let now=33;now<=3000;now+=33){
  if(now===330)clock.boundary(35,now);
  if(now===660)clock.boundary(2,now);
  if(now===990){clock.boundary(NaN,now);clock.boundary(sentence.length+10,now);}
  const next=clock.sample(now);assert.ok(next>=last&&next-last<.03);last=next;
 }
 assert.ok(last>.6&&last<1);
});
test('a delayed animation sample catches up gradually rather than jumping',()=>{
 const clock=createSpeechProgress('Hello',1,0);const start=clock.sample(33),delayed=clock.sample(3000);
 assert.ok(delayed>start&&delayed-start<.2);assert.ok(clock.sample(3033)<1);
});
