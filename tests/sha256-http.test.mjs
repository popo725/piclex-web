import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {unzipSync,zipSync} from 'fflate';
import {sha256,parseArchive} from '../packages/deck-format/src/archive.mjs';

function cryptoFor(t,value){
 const original=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 Object.defineProperty(globalThis,'crypto',{configurable:true,value});
 t.after(()=>original?Object.defineProperty(globalThis,'crypto',original):delete globalThis.crypto);
}
for(const [name,crypto] of [['WebCrypto',webcrypto],['HTTP without subtle',{}],['without crypto',undefined]]){
 test(`SHA-256 matches Node for ${name}`,async t=>{
  cryptoFor(t,crypto);
  const padded=new TextEncoder().encode('prefix摄影学英语suffix');
  const vectors=[new Uint8Array(),new TextEncoder().encode('abc'),new TextEncoder().encode('摄影学英语🌈'),new Uint8Array(1025).fill(173),padded.subarray(6,padded.length-6)];
  for(const bytes of vectors)assert.equal(await sha256(bytes),createHash('sha256').update(bytes).digest('hex'));
 });
}
test('HTTP fallback imports valid archives and still rejects tampered photos',async t=>{
 cryptoFor(t,{});
 const bytes=new Uint8Array(await readFile(new URL('./fixtures/demo/decks/cafe.piclexdeck',import.meta.url)));
 const deck=await parseArchive(bytes);assert.equal(deck.words.length,6);assert.equal(deck.fingerprint,createHash('sha256').update(bytes).digest('hex'));
 const files=unzipSync(bytes),photo=Object.keys(files).find(p=>p.endsWith('.jpg'));files[photo][42]^=1;
 await assert.rejects(parseArchive(zipSync(files)),/校验失败/);
});
test('available WebCrypto failures are not silently swallowed',async t=>{
 const error=new Error('digest failed');cryptoFor(t,{subtle:{digest:async()=>{throw error;}}});
 await assert.rejects(sha256(new Uint8Array([1])),e=>e===error);
});
