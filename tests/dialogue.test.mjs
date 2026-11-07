import test from 'node:test';import assert from 'node:assert/strict';
import {readingDialogue,readingScore} from '../packages/practice/src/dialogue.mjs';
import {accumulateReading} from '../packages/practice/src/reading.mjs';
test('dialogue strips labels and quotes, merges adjacent same roles',()=>{assert.deepEqual(readingDialogue('A: “Hello.”\nA: How are you?\nB: Fine.'),[{role:'learner',text:'Hello.\nHow are you?'},{role:'machine',text:'Fine.'}]);});
test('native supported labels, inline A/B, escaped newline, machine first',()=>{for(const [a,b] of [['A','B'],['Speaker A','Speaker B'],['Person A','Person B'],['甲','乙']])assert.equal(readingDialogue(`${b}: Hello.\\n${a}: Hi.`)[0].role,'machine');assert.equal(readingDialogue('A: Hello B: Hi')[1].text,'Hi');});
test('ordinary text and unknown or single speakers stay ordinary',()=>{for(const s of ['Read this: hello.','Title\nA: Hi\nB: Hi','Alice: Hi\nBob: Hello','A: Hi\nA: Hello','A: \nB: Hello'])assert.equal(readingDialogue(s),null);});
test('complete learner text passes without reading speaker labels or B lines',()=>{const turns=readingDialogue('A: I write code.\nB: That is useful.\nA: I test it.');for(const t of turns.filter(t=>t.role==='learner'))assert.equal(accumulateReading(t.text,t.text).passed,true);});
test('scores are coverage based, incomplete dialogue cannot show 100',()=>{assert.equal(readingScore(1,4),25);assert.equal(readingScore(999,1000),99);assert.equal(readingScore(4,4,false),99);assert.equal(readingScore(4,4,true),100);});
