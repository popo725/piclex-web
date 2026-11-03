import test from 'node:test';import assert from 'node:assert/strict';
import {wordPhoto,wordFocus} from '../packages/laboratory/src/photo.mjs';import {eligibleWords} from '../packages/laboratory/src/words.mjs';
const id='11111111-2222-3333-4444-555555555555',word={english:'garden',chinese:'花园',example:'A garden.',photoID:id,focus:{visible:true,box:[.1,.2,.3,.4]}};
test('photo identities and normalized focus survive word filtering, with local-only native or paired LAN routes',()=>{
 const w=eligibleWords([word])[0];assert.equal(wordPhoto(w),`piclex-lab-photo://photo/${id}`);assert.deepEqual(w.focus,word.focus);
 const url=`/api/photo/${id}/image?size=1600`;assert.equal(wordPhoto(eligibleWords([{...word,photoID:undefined,photo:url}])[0]),url);
 for(const photo of ['https://evil.test/pic','//evil.test/pic','data:image/png;base64,AA','/api/photo/../../image?size=1600'])assert.equal(wordPhoto({photo}), '');
 assert.equal(wordPhoto({photoID:'../escape'}),'');
});
test('invalid bounding boxes are omitted; visible:false preserves the full scene',()=>{
 for(const box of [[0,0,0,.2],[0,0,1,1.1],[.9,0,.2,.5],[0,0,NaN,.2],[0,0,.2]])assert.equal(wordFocus({visible:true,box}),undefined);
 assert.deepEqual(wordFocus({visible:false,box:[0,0,1,1]}),{visible:false,box:[0,0,1,1]});
});
