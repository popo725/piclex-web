import test from 'node:test';
import assert from 'node:assert/strict';
import {bufferedSave} from '../packages/practice/src/buffered-save.mjs';
function clock(){let now=0,id=0;const timers=new Map();return {setTimer(fn,ms){timers.set(++id,{fn,at:now+ms});return id;},clearTimer(id){timers.delete(id);},advance(ms){const end=now+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=end;}};}
test('a burst saves only the newest snapshot and explicit exit flush cancels delayed writes',()=>{
 const time=clock(),writes=[],writer=bufferedSave(s=>{writes.push(s);return true;},time);
 for(const value of ['g','gl','gla','glas','glass']){writer.schedule(value);time.advance(20);}assert.deepEqual(writes,[]);time.advance(180);assert.deepEqual(writes,['glass']);
 writer.schedule('glass p');writer.flush();time.advance(1000);assert.deepEqual(writes,['glass','glass p']);writer.flush();assert.equal(writes.length,2);
});
test('continuous typing has a bounded save delay',()=>{
 const time=clock(),writes=[],writer=bufferedSave(s=>{writes.push(s);return true;},time);
 for(let i=0;i<10;i++){writer.schedule(i);time.advance(100);}assert.deepEqual(writes,[9]);writer.schedule(10);time.advance(180);assert.deepEqual(writes,[9,10]);
});
test('failed saves retain the latest pending snapshot and retry without overwriting another writer',()=>{
 const time=clock(),writes=[];let available=false;const writer=bufferedSave(s=>{if(!available)return false;writes.push(s);return true;},time);
 writer.schedule('old');time.advance(180);writer.schedule('new');assert.equal(writer.flush(),false);available=true;assert.equal(writer.flush(),true);assert.deepEqual(writes,['new']);
});
