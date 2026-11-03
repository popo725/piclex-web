import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {unzipSync,zipSync,strToU8} from 'fflate';
import {parseArchive,sha256} from '../packages/deck-format/src/archive.mjs';
import {parseEmbeddedCovers} from '../packages/deck-format/src/covers.mjs';
import {restoreStudyFromStorage,newStudy} from '../packages/practice/src/study.mjs';
const covers={};
for(const [role,width,height] of [['landscape',300,200],['portrait',200,300]]){const bytes=await readFile(new URL(`./fixtures/covers/${role}.jpg`,import.meta.url));covers[role]={width,height,mimeType:'image/jpeg',sha256:await sha256(bytes),bytes:bytes.length,dataBase64:bytes.toString('base64')};}
test('independent covers keep photo count, learning identity and old progress intact',async()=>{
 const original=await readFile(new URL('./fixtures/demo/decks/cafe.piclexdeck',import.meta.url)),before=await parseArchive(original),files=unzipSync(original),m=JSON.parse(new TextDecoder().decode(files['manifest.json']));
 m.covers=covers;files['manifest.json']=strToU8(JSON.stringify(m));const after=await parseArchive(zipSync(files));
 assert.notEqual(after.fingerprint,before.fingerprint);assert.equal(after.learningFingerprint,before.learningFingerprint);assert.deepEqual(after.words,before.words);assert.equal(after.photos.length,before.photos.length);
 assert.equal(after.covers.landscape.width,300);assert.equal(after.covers.portrait.height,300);
 const old=newStudy(before);old.index=1;old.hiddenChinese=true;old.module='listening';old.mode='free';
 const deck={...after,fingerprint:after.learningFingerprint,legacyFingerprints:[before.fingerprint]};
 const state=restoreStudyFromStorage(deck,key=>key===`piclex-web.study.v2.${before.fingerprint}`?old:null);
 assert.equal(state.index,1);assert.equal(state.hiddenChinese,true);assert.equal(state.module,'listening');assert.equal(state.mode,'free');assert.equal(state.fingerprint,after.learningFingerprint);
 const another={...deck,legacyFingerprints:[]};assert.equal(restoreStudyFromStorage(another,()=>old).index,0);
});
test('invalid, oversized, mismatched and executable cover content is rejected',async()=>{
 for(const mutate of [c=>delete c.portrait,c=>c.landscape=null,c=>c.landscape.mimeType='image/svg+xml',c=>c.landscape.width++,c=>c.landscape.sha256='0'.repeat(64),c=>c.landscape.bytes=3*1024*1024,c=>c.landscape.dataBase64='invalid',c=>{const b=Buffer.from(c.landscape.dataBase64,'base64').subarray(0,-2);c.landscape.dataBase64=b.toString('base64');c.landscape.bytes=b.length;c.landscape.sha256='0'.repeat(64);}]){const copy=structuredClone(covers);mutate(copy);await assert.rejects(parseEmbeddedCovers(copy));}
 assert.deepEqual(await parseEmbeddedCovers(undefined),{});
});
