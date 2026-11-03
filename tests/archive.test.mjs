import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { parseArchive, sha256 } from '../packages/deck-format/src/archive.mjs';
const root=new URL('../tests/fixtures/demo/',import.meta.url);
const cafe=()=>readFile(new URL('decks/cafe.piclexdeck',root));
test('all shipped examples satisfy archive checks and source protocol hashes',async()=>{
 const source=JSON.parse(await readFile(new URL('source.json',root),'utf8'));
 for(const id of ['cafe','travel','home']){
   const bytes=await readFile(new URL(`decks/${id}.piclexdeck`,root));const d=await parseArchive(bytes);
   assert.equal(d.words.length,6);assert.equal(d.photos.length,1);assert.equal(d.fingerprint,await sha256(bytes));
   assert.equal(d.words[0].focus.visible,true);assert.equal(d.words[0].focus.box.length,4);
   const item=source.decks.find(x=>x.packageURL.endsWith(`/${id}.piclexdeck`));assert.equal(item.packageSHA256,d.fingerprint);assert.equal(item.packageBytes,bytes.length);
 }
});
test('tampered photo and metadata fail before an import can be committed',async()=>{
 const files=unzipSync(await cafe()), manifest=JSON.parse(strFromU8(files['manifest.json']));
 const path=manifest.photos[0].jsonPath;files[path]=strToU8('{}');await assert.rejects(parseArchive(zipSync(files)),/校验失败/);
 const original=unzipSync(await cafe());const photo=Object.keys(original).find(x=>x.endsWith('.jpg'));original[photo][42]^=1;
 await assert.rejects(parseArchive(zipSync(original)),/校验失败/);
});
test('malformed packages, unsafe paths, excessive expansion, wrong versions and duplicate IDs are rejected',async()=>{
 await assert.rejects(parseArchive(new Uint8Array([1,2,3])));
 await assert.rejects(parseArchive(zipSync({'../secret':strToU8('x')})));
 await assert.rejects(parseArchive(zipSync({'manifest.json':new Uint8Array(3*1024*1024)})),/解压/);
 for(const mutate of [m=>m.formatVersion=2,m=>{m.photos.push(m.photos[0]);m.photoCount++},m=>m.trashCount=1,m=>m.photos[0]=null]){
   const files=unzipSync(await cafe());const m=JSON.parse(strFromU8(files['manifest.json']));mutate(m);files['manifest.json']=strToU8(JSON.stringify(m));await assert.rejects(parseArchive(zipSync(files)));
 }
});
