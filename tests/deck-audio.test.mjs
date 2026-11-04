import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
import {parseArchive,sha256} from '../packages/deck-format/src/archive.mjs';
import {parseEmbeddedAudio} from '../packages/deck-format/src/audio.mjs';
import {parsePublicDeck} from '../packages/deck-format/src/public.mjs';
const bytes=new Uint8Array([0x49,0x44,0x33,4,0,0,0,0,0,0]);
const clip={mediaType:'audio/mpeg',dataBase64:Buffer.from(bytes).toString('base64'),byteCount:bytes.length,durationSeconds:1,sha256:await sha256(bytes)};
test('audio validation accepts canonical clips and rejects tampered, oversized or foreign data',async()=>{
 assert.deepEqual(await parseEmbeddedAudio(clip),clip);
 for(const patch of [{mediaType:'text/html'},{sha256:'a'.repeat(64)},{byteCount:262145},{durationSeconds:61},{durationSeconds:NaN},{dataBase64:clip.dataBase64+' '},{dataBase64:Buffer.from('not an mp3').toString('base64')}])await assert.rejects(parseEmbeddedAudio({...clip,...patch}));
});
test('archive keeps per-occurrence audio without resetting existing learning identity',async()=>{
 const original=await readFile(new URL('./fixtures/demo/decks/cafe.piclexdeck',import.meta.url)),baseline=await parseArchive(original),files=unzipSync(original),manifest=JSON.parse(strFromU8(files['manifest.json'])),item=manifest.photos[0],meta=JSON.parse(strFromU8(files[item.jsonPath]));
 meta.labels[0].learning.audio=clip;files[item.jsonPath]=strToU8(JSON.stringify(meta));item.jsonSHA256=await sha256(files[item.jsonPath]);files['manifest.json']=strToU8(JSON.stringify(manifest));
 const parsed=await parseArchive(zipSync(files));assert.deepEqual(parsed.words[0].audio,clip);assert.equal(parsed.words[1].audio,undefined);assert.equal(parsed.learningFingerprint,baseline.learningFingerprint);assert.notEqual(parsed.fingerprint,baseline.fingerprint);
});
test('public audio accepts only bounded same-origin asset paths without inline payloads',async()=>{
 const parsed=await parseArchive(await readFile(new URL('./fixtures/demo/decks/cafe.piclexdeck',import.meta.url))),{dataBase64,...info}=clip;
 const value={format:'com.piclex.web-deck',schemaVersion:1,deckID:'00000000-0000-4000-8000-000000000001',fingerprint:parsed.fingerprint,title:parsed.title,photos:parsed.photos.map(p=>({id:p.id,path:'library/example/photo.jpg'})),words:parsed.words.map((w,i)=>i? w:{...w,audio:{...info,path:'library/example/audio/clip.mp3'}})};
 const check=async v=>{const data=strToU8(JSON.stringify(v));return parsePublicDeck(data,{id:value.deckID,fingerprint:parsed.fingerprint,photoCount:1,count:6,payloadSHA256:await sha256(data)});};
 assert.equal((await check(value)).words[0].audio.path,'library/example/audio/clip.mp3');
 for(const patch of [{path:'https://other.example/x.mp3'},{path:'library/../x.mp3'},{dataBase64:clip.dataBase64},{byteCount:262145}]){const bad=structuredClone(value);Object.assign(bad.words[0].audio,patch);await assert.rejects(check(bad));}
});
