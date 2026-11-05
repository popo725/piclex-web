import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {UI_ASSETS,createUIAssetWarmup} from '../packages/learning-ui/src/ui-assets.mjs';

test('manifest covers all shipped button icons, without duplicates',()=>{
 const files=readdirSync(new URL('../apps/public/public/icons/',import.meta.url)).filter(x=>x.endsWith('.png')).map(x=>`icons/${x}`);
 assert.deepEqual([...UI_ASSETS].sort(),files.sort());
 assert.equal(new Set(UI_ASSETS).size,UI_ASSETS.length);
});
test('warmup waits for scheduling, runs once, limits concurrency and tolerates failure',async()=>{
 let scheduled,active=0,maximum=0;const seen=[];
 const start=createUIAssetWarmup({schedule:run=>{scheduled=run;},load:async path=>{
  seen.push(path);active++;maximum=Math.max(maximum,active);
  await new Promise(resolve=>setTimeout(resolve,1));active--;
  if(path===UI_ASSETS[0])throw Error('offline');
 }});
 start();start();assert.equal(seen.length,0);
 await scheduled();start();assert.equal(maximum,2);assert.deepEqual(seen,UI_ASSETS);
});
