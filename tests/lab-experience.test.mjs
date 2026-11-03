import test from 'node:test';
import assert from 'node:assert/strict';
import { experienceBridge,levelProgress,skipExperienceCost,waveExperienceReward } from '../packages/laboratory/src/experience.mjs';

const wordID='12345678-1234-4234-8234-1234567890ab';
const spendID='22345678-1234-4234-8234-1234567890ab';
const storage=()=>{const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};

test('shared level math matches native thresholds and wave rewards total 70 per full run',()=>{
  assert.deepEqual(levelProgress(0),{schemaVersion:1,total:0,level:0,earned:0,required:2,remaining:2,fraction:0});
  assert.equal(levelProgress(2).level,1);assert.equal(levelProgress(5).remaining,1);assert.equal(levelProgress(6).level,2);
  assert.deepEqual([1,5,6,10,11,15,16,20].map(waveExperienceReward),[2,2,3,3,4,4,5,5]);
  assert.equal(Array.from({length:20},(_,i)=>waveExperienceReward(i+1)).reduce((a,b)=>a+b,0),70);
  assert.deepEqual([1,2,3,4].map(skipExperienceCost),[12,18,26,36]);
});

test('browser ledger is idempotent, earns words and waves, and refuses an unaffordable skip',async()=>{
  const st=storage(),changes=[];
  const bridge=experienceBridge({scope:{PICLEX_USER_LEVEL:levelProgress(20)},storage:st,onChange:value=>changes.push(value.total)});
  assert.equal((await bridge.transact({id:wordID,action:'word',tier:0,cost:0,amount:1})).status,'accepted');
  assert.equal(bridge.snapshot.total,21);
  assert.equal((await bridge.transact({id:wordID,action:'word',tier:0,cost:0,amount:1})).status,'accepted');
  assert.equal(bridge.snapshot.total,21);
  assert.equal((await bridge.transact({id:spendID,action:'spend',tier:2,cost:18,amount:-18})).status,'accepted');
  assert.equal(bridge.snapshot.total,3);
  assert.equal((await bridge.transact({id:'32345678-1234-4234-8234-1234567890ab',action:'spend',tier:1,cost:12,amount:-12})).status,'insufficient');
  assert.equal(bridge.snapshot.total,3);assert.deepEqual(changes,[21,3]);
});

test('browser storage failure leaves both the visible balance and transaction pending',async()=>{
  const bridge=experienceBridge({scope:{PICLEX_USER_LEVEL:levelProgress(20)},storage:{getItem:()=>null,setItem:()=>{throw Error('disk full');}}});
  const event={id:wordID,action:'word',tier:0,cost:0,amount:1};
  assert.equal((await bridge.transact(event)).status,'failed');
  assert.equal(bridge.snapshot.total,20);
  assert.equal((await bridge.transact(event)).status,'failed');
  assert.equal(bridge.snapshot.total,20);
});

test('native ledger posts validated signed events and applies acknowledged snapshots',async()=>{
  const messages=[],timers=new Map();let next=0;
  const scope={PICLEX_USER_LEVEL:levelProgress(6),webkit:{messageHandlers:{labExperience:{postMessage:value=>messages.push(value)}}}};
  const bridge=experienceBridge({scope,setTimer:fn=>{timers.set(++next,fn);return next;},clearTimer:id=>timers.delete(id)});
  const promise=bridge.transact({id:wordID,action:'wave',tier:6,cost:0,amount:3});
  assert.deepEqual(messages,[{id:wordID,action:'wave',tier:6,cost:0,amount:3}]);
  bridge.acknowledge(wordID,'accepted',levelProgress(9));
  const result=await promise;assert.equal(result.status,'accepted');assert.equal(result.snapshot.total,9);assert.equal(timers.size,0);
  assert.equal((await bridge.transact({id:spendID,action:'wave',tier:6,cost:0,amount:2})).status,'invalid');
});
