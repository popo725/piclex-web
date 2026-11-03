import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {unzipSync,strFromU8} from 'fflate';
import {createPhotoDeck} from '../packages/deck-format/src/create.mjs';
import {parseArchive} from '../packages/deck-format/src/archive.mjs';
const image=new Uint8Array(await readFile(new URL('fixtures/demo/images/cafe.jpg',import.meta.url)));
const label={english:'cup',chinese:'杯子',example:'This is a cup.',exampleChinese:'这是一个杯子。',phoneticUS:'/kʌp/',partOfSpeech:'noun',relation:'visible',bbox:[100,200,400,600],anchor:[150,250]};
test('AI deck preserves native focus coordinates, examples, phonetics and quotation through export/import',async()=>{
 const bytes=await createPhotoDeck({image,title:'AI 卡组',labels:[label],quote:{chinese:'诗句',english:'Verse',source:'出处'}});
 const parsed=await parseArchive(bytes),word=parsed.words[0];
 assert.equal(word.example,label.example);assert.equal(word.exampleChinese,label.exampleChinese);assert.equal(word.phonetic,label.phoneticUS);assert.equal(word.partOfSpeech,'noun');assert.deepEqual(word.focus,{visible:true,box:[.1,.2,.3,.4]});
 const files=unzipSync(bytes),meta=JSON.parse(strFromU8(files[Object.keys(files).find(k=>k.startsWith('photos/')&&k.endsWith('.json'))]));
 assert.equal(meta.quote.provenance,'model');assert.equal(meta.labels[0].x,150);assert.equal(meta.labels[0].positionUnavailable,false);
});
test('contextual words and invalid positions never invent focus boxes',async()=>{
 for(const change of [{relation:'scene_extension'},{bbox:[100,200,50,600]},{anchor:[999,999]},{anchor:null}]){
  const parsed=await parseArchive(await createPhotoDeck({image,title:'位置校验',labels:[{...label,...change}]}));assert.equal(parsed.words[0].focus,null);
 }
});

test('AI fractional coordinates export as native integers without creating collapsed boxes',async()=>{
 const bytes=await createPhotoDeck({image,title:'坐标兼容',labels:[{...label,bbox:[100.2,200.4,400.3,600.1],anchor:[150.8,250.2]}]});
 const files=unzipSync(bytes),meta=JSON.parse(strFromU8(files[Object.keys(files).find(k=>k.startsWith('photos/')&&k.endsWith('.json'))]));
 assert.equal(meta.labels[0].x,151);assert.equal(meta.labels[0].boundingBox.left,100);
 const parsed=await parseArchive(await createPhotoDeck({image,title:'边界',labels:[{...label,bbox:[100.1,200,100.2,600],anchor:[100.15,250]}]}));assert.equal(parsed.words[0].focus,null);
});
