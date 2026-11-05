import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chooseSpeechVoice,isEnglishVoice} from '../apps/public/src/speech-voice-choice.mjs';
const voice=(name,lang='en-US',extra={})=>({name,lang,voiceURI:name,default:false,...extra});
test('Auto avoids alphabetically first Albert and prefers ordinary US speech',()=>{
 const voices=['Albert','Bad News','Bahh','Bells','Boing','Bubbles','Cellos','Good News','Google US English','Samantha'].map(n=>voice(n));
 assert.equal(chooseSpeechVoice(voices),voices[8]);
 assert.equal(chooseSpeechVoice(voices.filter(v=>!v.name.startsWith('Google'))).name,'Samantha');
});
test('explicit voice survives, including an effect voice and another accent',()=>{
 const voices=[voice('Albert'),voice('Google US English'),voice('Daniel','en-GB')];
 assert.equal(chooseSpeechVoice(voices,'Albert'),voices[0]);
 assert.equal(chooseSpeechVoice(voices,'Daniel'),voices[2]);
 assert.equal(chooseSpeechVoice(voices,'missing'),voices[1]);
});
test('natural Microsoft and enhanced installed voices precede basic voices',()=>{
 const natural=voice('Microsoft Jenny Online (Natural) - English (United States)');
 assert.equal(chooseSpeechVoice([voice('Albert'),voice('Fred'),voice('Samantha'),natural]),natural);
 assert.equal(chooseSpeechVoice([voice('Samantha'),voice('Samantha (Enhanced)')]).name,'Samantha (Enhanced)');
});
test('fallback honors ordinary English system default and permits other accents',()=>{
 const defaultVoice=voice('Daniel','en-GB',{default:true});
 assert.equal(chooseSpeechVoice([voice('Albert','en-US',{default:true}),voice('Fred'),defaultVoice]),defaultVoice);
 assert.equal(chooseSpeechVoice([voice('Karen','en-AU')]).name,'Karen');
 assert.equal(chooseSpeechVoice([voice('Karen','en-AU'),voice('Fred')]).name,'Fred');
});
test('locale variants work and unrelated languages are excluded',()=>{
 const us=voice('Samantha','en_US');
 assert.ok(isEnglishVoice(us));assert.ok(isEnglishVoice(voice('English','en')));
 assert.equal(chooseSpeechVoice([voice('Chinese','zh-CN'),us],'Chinese'),us);
 assert.equal(chooseSpeechVoice([voice('Chinese','zh-CN')]),undefined);
});
test('empty or effects-only inventories return no explicit override; input is not sorted in place',()=>{
 assert.equal(chooseSpeechVoice([]),undefined);
 assert.equal(chooseSpeechVoice([voice('Albert'),voice('Whisper')]),undefined);
 const voices=[voice('Samantha'),voice('Albert')],copy=[...voices];chooseSpeechVoice(voices);assert.deepEqual(voices,copy);
});
