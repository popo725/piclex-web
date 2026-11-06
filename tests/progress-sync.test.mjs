import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPortableAnswer,spellingEvent,encodeProgress,decodeProgress} from '../packages/backup/src/progress.mjs';

test('XP synced before its answer does not lose practice counters or duplicate credit',async()=>{
 const id='AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA',at=1700000000000;
 const progress=new Map([['camera',{wordKey:'camera',attempts:3,correctAnswers:2,streak:1,lastPracticedAt:at-1000,nextReviewAt:at,misspelledIndices:[]}]]);
 const events=new Map([[id,spellingEvent(id,'camera','correct',at)]]);
 const answer={wordKey:'camera',result:'correct',mistakes:[],id,at:at+500};
 applyPortableAnswer(progress,events,answer);
 assert.equal(progress.get('camera').attempts,4);assert.equal(progress.get('camera').correctAnswers,3);
 assert.equal(progress.get('camera').lastPracticedAt,at);assert.equal(events.size,1);
 const once=await encodeProgress({progress:[...progress.values()],memories:[],events:[...events.values()]});
 applyPortableAnswer(progress,events,answer);
 assert.equal(progress.get('camera').attempts,4);assert.equal(events.size,1);
 const roundtrip=await decodeProgress(new TextEncoder().encode(JSON.stringify(once)));
 assert.equal(roundtrip.progress[0].attempts,4);assert.equal(roundtrip.events.length,1);
});

test('an imported completed answer keeps newer local progress, while new answers count',()=>{
 const id='AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA',at=1700000000000;
 const old={wordKey:'camera',attempts:8,correctAnswers:7,streak:3,lastPracticedAt:at+1000,nextReviewAt:at+2000,misspelledIndices:[]};
 const progress=new Map([['camera',old]]),events=new Map([[id,spellingEvent(id,'camera','correct',at)]]);
 applyPortableAnswer(progress,events,{wordKey:'camera',result:'correct',mistakes:[],id,at:at+2000});
 assert.deepEqual(progress.get('camera'),old);
 applyPortableAnswer(progress,events,{wordKey:'camera',result:'revealed',mistakes:[0],id:'BBBBBBBB-BBBB-4BBB-8BBB-BBBBBBBBBBBB',at:at+3000});
 assert.equal(progress.get('camera').attempts,9);assert.equal(progress.get('camera').correctAnswers,7);
 assert.equal(progress.get('camera').streak,0);assert.equal(events.size,2);
});
