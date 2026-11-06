import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PhotoCache} from '../packages/learning-ui/src/photo-cache.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('shared in-flight downloads, bounded speculation, retry and cancellation release resources',async()=>{
 const original={fetch:globalThis.fetch,Image:globalThis.Image,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
 const pending=new Map(),calls=[],revoked=[];let counter=0;
 globalThis.Image=class{naturalWidth=20;naturalHeight=10;async decode(){}};
 URL.createObjectURL=()=>`blob:test-${++counter}`;URL.revokeObjectURL=url=>revoked.push(url);
 globalThis.fetch=(url,{signal})=>new Promise((resolve,reject)=>{
  calls.push(url);pending.set(url,{resolve:()=>resolve(new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/png'}})),reject,signal});
  signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true});
 });
 try{
  const cache=new PhotoCache();cache.setWindow('0',['1','2','3','4','5','6']);
  const first=cache.acquire('0',()=>{}),second=cache.acquire('0',()=>{});
  assert.deepEqual(calls,['0']);pending.get('0').resolve();await first.promise;await tick();
  assert.equal(await second.promise,cache.peek('0'));assert.deepEqual(calls,['0','1','2']);
  // Selecting an in-flight speculative image uses the same promise.
  const selected=cache.acquire('1',()=>{});cache.setWindow('1',['2','3','4','5','6']);
  first.release();second.release();assert.equal(revoked.length,1);
  pending.get('1').resolve();await selected.promise;await tick();assert.equal(calls.filter(x=>x==='1').length,1);
  pending.get('2').reject(Error('offline'));await tick();
  const retry=cache.acquire('2',()=>{});assert.equal(calls.filter(x=>x==='2').length,2);
  pending.get('2').resolve();await retry.promise;retry.release();
  // Switching away cancels old prefetches, while a mounted image stays valid until released.
  const displayed=cache.peek('1').src;cache.setWindow('other',[]);assert.ok(!revoked.includes(displayed));
  selected.release();assert.ok(revoked.includes(displayed));
  for(const [url,job] of pending)if(!['1','2','other'].includes(url))assert.equal(job.signal.aborted,true);
  cache.setWindow(undefined);await tick();assert.equal(pending.get('other').signal.aborted,true);
  assert.equal(cache.peek('1'),undefined);assert.equal(new Set(revoked).size,revoked.length);
 }finally{globalThis.fetch=original.fetch;globalThis.Image=original.Image;URL.createObjectURL=original.create;URL.revokeObjectURL=original.revoke;}
});
