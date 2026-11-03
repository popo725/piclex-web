import {test} from 'node:test';
import assert from 'node:assert/strict';
import {downloadBytes} from '../packages/learning-ui/src/download.mjs';
const response=(headers={})=>new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array([1,2]));controller.enqueue(new Uint8Array([3,4]));controller.close();}}),{headers});
test('download reports real chunk progress and preserves every byte',async()=>{
 const progress=[];const result=await downloadBytes('test',{fetcher:async()=>response({'content-length':'4','content-type':'image/jpeg'}),onProgress:p=>progress.push(p)});
 assert.deepEqual([...result.bytes],[1,2,3,4]);assert.equal(result.type,'image/jpeg');assert.deepEqual(progress.slice(0,3),[{received:0,total:4},{received:2,total:4},{received:4,total:4}]);
});
test('compressed and unknown lengths never claim an invented percentage',async()=>{
 for(const headers of [{},{'content-length':'2','content-encoding':'gzip'}]){
  const progress=[];await downloadBytes('test',{fetcher:async()=>response(headers),onProgress:p=>progress.push(p)});
  assert.deepEqual(progress.slice(0,3).map(p=>p.total),[null,null,null]);assert.deepEqual(progress.at(-1),{received:4,total:4});
 }
});
test('download limits cancel the response instead of buffering oversized data',async()=>{
 let cancelled=false;const fetcher=async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(5));},cancel(){cancelled=true;}}));
 await assert.rejects(downloadBytes('test',{fetcher,maxBytes:4}),/文件过大/);assert.equal(cancelled,true);
 await assert.rejects(downloadBytes('test',{fetcher:async()=>response({'content-length':'100'}),maxBytes:4}),/文件过大/);
});
test('cancellation cannot publish a completed or stale download',async()=>{
 const controller=new AbortController(),progress=[];
 await assert.rejects(downloadBytes('test',{signal:controller.signal,fetcher:async()=>response({'content-length':'4'}),onProgress:p=>{progress.push(p);if(p.received===2)controller.abort();}}),{name:'AbortError'});
 assert.equal(progress.at(-1).received,2);
});
