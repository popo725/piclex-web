import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateSnapshot,parsePublicCatalog,parsePublicDeck} from '../packages/deck-format/src/public.mjs';
const snapshot=JSON.parse(await readFile(new URL('../content/snapshot.json',import.meta.url)));
test('reviewed public snapshot excludes paid entitlements and rejects duplicates or foreign origins',()=>{
 assert.equal(validateSnapshot(structuredClone(snapshot)).decks.length,5);
 for(const mutate of [s=>s.decks[0].access='storekit',s=>s.decks[0].productID='paid',s=>s.decks.push(s.decks[0]),s=>s.decks[0].packageURL='https://other.example/deck.piclexdeck',s=>s.decks[0].packageBytes=65*1024*1024]){
  const value=structuredClone(snapshot);mutate(value);assert.throws(()=>validateSnapshot(value));
 }
});
test('catalog cannot replace local asset paths with external or traversal URLs',()=>{
 const entry={id:snapshot.decks[0].deckID,title:'Example',description:'',count:1,photoCount:1,cover:'library/a/cover.jpg',package:'library/a/deck.piclexdeck',payload:'library/a/deck.json',payloadSHA256:'a'.repeat(64),fingerprint:'b'.repeat(64),preview:{english:'word',chinese:'词'}};
 assert.equal(parsePublicCatalog([entry]).length,1);
 for(const path of ['https://other.example/a','library/../secret','library/.env','//other.example/a']) assert.throws(()=>parsePublicCatalog([{...entry,payload:path}]));
 assert.throws(()=>parsePublicCatalog([entry,entry]));
});
test('a modified public payload is rejected before the practice state is created',async()=>{
 const bytes=new TextEncoder().encode('{}');
 await assert.rejects(parsePublicDeck(bytes,{payloadSHA256:'a'.repeat(64)}));
});
