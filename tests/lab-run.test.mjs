import test from 'node:test';
import assert from 'node:assert/strict';
import { SurvivalGame, catalog } from '../packages/laboratory/src/engine.mjs';
import { captureRun, readRun, restoreRun, RUN_BYTES } from '../packages/laboratory/src/run-state.mjs';
import { runSave, RUN_KEY } from '../packages/laboratory/src/run-save.mjs';
import { createTileBank, createSlots, useTile, returnTile, moveSlot, proposedFrom } from '../packages/laboratory/src/letter-tiles.mjs';
import { weapon } from '../packages/laboratory/src/content.mjs';
import { overrides } from '../packages/laboratory/src/data/prototype-overrides.mjs';
import { wordPhoto } from '../packages/laboratory/src/photo.mjs';
const word={english:'garden',chinese:'花园',example:'We play in the garden.',exampleChinese:'我们在花园里玩。'};
const fixture=()=>{const g=new SurvivalGame({words:[word],random:()=>.5});g.startWave();return g;};
const roundtrip=g=>restoreRun(JSON.parse(JSON.stringify(captureRun(g))),{progression:g.progression,random:()=>.5});
const storage=()=>{const data=new Map([['piclex.lab.progress.v1','keep'],['piclex.lab.sound.v1','off']]);return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};};

test('continuing old photo-less drafts refreshes scene references without changing the puzzle or purchase',()=>{
 const g=fixture();g.enterShop();g.phase='shop';g.pendingUpgrades=[];g.coins=100;g.beginPurchase(0);
 const offer=g.offers[0],bank=createTileBank(word.english,()=>.5),slots=useTile(bank,createSlots(word.english),bank[0].id);
 offer.labTiles={word:word.english,bank,slots,judged:false};offer.locked=true;
 const photoID='11111111-2222-3333-4444-555555555555',focus={visible:false,box:[0,0,1,1]};
 const current={...word,example:'Updated example.',photoID,focus};
 const snapshot=captureRun(g),original=JSON.stringify(snapshot);
 const r=restoreRun(snapshot,{words:[current]});
 for(const w of [...r.words,...r.wordOrder,...r.offers.map(o=>o.word),r.challenge.word]){
  assert.equal(wordPhoto(w),`piclex-lab-photo://photo/${photoID}`);assert.deepEqual(w.focus,focus);assert.equal(w.example,word.example);
 }
 assert.equal(r.challenge.word,r.offers[0].word);assert.deepEqual(r.offers[0].labTiles,offer.labTiles);
 assert.equal(r.coins,100);assert.equal(r.offers[0].price,offer.price);assert.equal(r.offers[0].locked,true);
 assert.deepEqual(r.pendingExperience,g.pendingExperience);assert.equal(JSON.stringify(snapshot),original);
 assert.equal(r.submitSpelling('garden').status,'purchased');
});
test('refreshed native, LAN and export scenes survive wave retry and another checkpoint',()=>{
 const oldID='00000000-2222-3333-4444-555555555555',newID='11111111-2222-3333-4444-555555555555';
 for(const source of [{photoID:newID},{photo:`/api/photo/${newID}/image?size=1600`},{photo:'./photos/0.jpg'}]){
  const g=new SurvivalGame({words:[{...word,photoID:oldID}]});g.startWave();g.die();
  const current={...word,...source,focus:{visible:true,box:[.1,.2,.3,.4]}};
  const r=restoreRun(captureRun(g),{words:[current]});assert.ok(r.retryWave());
  assert.equal(wordPhoto(r.nextWord()),wordPhoto(current));
  const again=roundtrip(r);assert.equal(wordPhoto(again.nextWord()),wordPhoto(current));assert.deepEqual(again.words[0].focus,current.focus);
 }
});
test('photo refresh never substitutes a different meaning or an untrusted photo URL',()=>{
 const original={...word,photo:'./photos/0.jpg'};
 const g=new SurvivalGame({words:[original]});g.startWave();
 for(const words of [[],[{...word,chinese:'别的含义',photo:'./photos/1.jpg'}],[{...word,photo:'https://untrusted.test/photo.jpg'}]]){
  const r=restoreRun(captureRun(g),{words});assert.equal(wordPhoto(r.nextWord()),original.photo);
 }
});

test('battle checkpoint keeps the same wave, elapsed time, health, equipment and cooldowns and resumes paused',()=>{
 const g=fixture();g.wave=7;g.elapsed=17.25;g.player.hp=8;g.coins=57;g.kills=36;g.weapons=[{id:'ghost_axe',tier:3},{id:'smg',tier:2}];g.weaponKillCounts=[19,7];g.attackTimers=[.27,.06];g.materialBank=9;g.groups[0].next=Infinity;g.spawn('baby_alien',{x:330,y:260,warning:false});g.heals=[{x:180,y:180,kind:'fruit'}];
 const r=roundtrip(g);assert.ok(r);assert.equal(r.phase,'paused');assert.equal(r.wave,7);assert.equal(r.elapsed,17.25);assert.equal(r.player.hp,8);assert.equal(r.coins,57);assert.deepEqual(r.weapons,g.weapons);assert.deepEqual(r.weaponKillCounts,[19,7]);assert.deepEqual(r.attackTimers,[.27,.06]);assert.equal(r.groups[0].next,Infinity);assert.equal(r.enemies.length,1);assert.equal(r.heals.length,1);r.update(.05,{x:1});assert.equal(r.elapsed,17.25);r.resume();r.update(.01);assert.equal(r.wave,7);assert.equal(r.elapsed,17.26);
});
test('piercing hit sets and burn propagation shared budget preserve object identity',()=>{
 const g=fixture();g.spawn('baby_alien',{x:430,y:280,warning:false});g.spawn('baby_alien',{x:460,y:280,warning:false});g.attack(g.weapons[0],0);assert.ok(g.bullets.length);const budget={remaining:2};g.enemies[0].burn={budget};g.enemies[1].burn={budget};g.bullets[0].hits=new Set([g.enemies[0],{x:0,y:0,hp:0}]);
 const r=roundtrip(g);assert.ok(r.bullets[0].hits instanceof Set);assert.equal(r.bullets[0].hits.size,1);assert.ok(r.bullets[0].hits.has(r.enemies[0]));assert.equal(r.enemies[0].burn.budget,r.enemies[1].burn.budget);r.enemies[0].burn.budget.remaining--;assert.equal(r.enemies[1].burn.budget.remaining,1);
});
test('shop saves draft holes, insertion order, prices and rewarded positions; settlement cannot charge twice',()=>{
 for(const correct of [true,false]){
  const g=fixture();g.enterShop();g.phase='shop';g.pendingUpgrades=[];g.coins=100;g.offers=[{...catalog.find(o=>o.id==='health'),price:18,status:'available',word,answer:'',locked:true}];g.beginPurchase(0);
  const bank=createTileBank(word.english,()=>.5);let slots=createSlots(word.english);for(const letter of 'garden')slots=useTile(bank,slots,bank.find(t=>t.letter===letter).id);slots=returnTile(slots,1);slots=moveSlot(slots,4,1);g.offers[0].labTiles={word:word.english,bank,slots,judged:false};
  const r=roundtrip(g);assert.ok(r);assert.equal(r.phase,'shop');assert.equal(r.challenge.index,0);assert.deepEqual(r.offers[0].labTiles.slots,slots);assert.equal(r.offers[0].locked,true);assert.equal(r.offers[0].price,18);assert.equal(proposedFrom(bank,slots),proposedFrom(r.offers[0].labTiles.bank,r.offers[0].labTiles.slots));
  const result=r.submitSpelling(correct?'garden':'gadren');assert.equal(result.status,correct?'purchased':'failed');const coins=r.coins;const again=roundtrip(r);assert.equal(again.coins,coins);assert.equal(again.submitSpelling('garden').status,'idle');assert.equal(again.beginPurchase(0),false);assert.equal(again.coins,coins);assert.equal(again.inventory.length,correct?1:0);
 }
});
test('pending upgrades and loot resume their settlement instead of restarting combat',()=>{
 const g=fixture();g.pendingUpgrades=[2,3];g.makeUpgrades();g.phase='upgrade';let r=roundtrip(g);assert.equal(r.phase,'upgrade');assert.deepEqual(r.pendingUpgrades,[2,3]);assert.deepEqual(r.upgradeOffers,g.upgradeOffers);r.chooseUpgrade(0);assert.deepEqual(r.pendingUpgrades,[3]);
 g.phase='loot';g.crates=['crate'];g.lootOffer=catalog.find(o=>o.id==='health');r=roundtrip(g);assert.equal(r.phase,'loot');assert.equal(r.lootOffer.id,'health');assert.equal(r.crates.length,1);
});
test('wave experience survives checkpoints, including the final victory, until acknowledged',()=>{
 const g=fixture();g.enterShop();assert.equal(g.pendingExperience.length,1);assert.equal(g.pendingExperience[0].action,'wave');assert.equal(g.pendingExperience[0].amount,2);
 let r=roundtrip(g);assert.ok(r);assert.deepEqual(r.pendingExperience,g.pendingExperience);const event=r.pendingExperience[0];assert.equal(r.settleExperience(event.id,'accepted').status,'earned');assert.equal(r.pendingExperience.length,0);
 const final=fixture();final.wave=20;final.enterShop();assert.equal(final.phase,'won');assert.equal(final.pendingExperience[0].amount,5);const snapshot=captureRun(final);assert.ok(snapshot);r=restoreRun(JSON.parse(JSON.stringify(snapshot)),{progression:final.progression,random:()=>.5});assert.equal(r.phase,'won');r.settleExperience(r.pendingExperience[0].id,'accepted');assert.equal(captureRun(r),null);
});
test('corrupt, oversized and unsupported graphs are refused without polluting prototypes',()=>{
 const value=captureRun(fixture());assert.equal(readRun({...value,schemaVersion:99}),null);assert.equal(readRun({...value,savedAt:NaN}),null);assert.equal(readRun({...value,graph:{root:{ref:999},nodes:value.graph.nodes}}),null);
 const bad=structuredClone(value);bad.graph.nodes[0].values.push(['__proto__',{ref:0}]);assert.equal(readRun(bad),null);assert.equal({}.polluted,undefined);
 assert.equal(readRun({...value,extra:'汉'.repeat(Math.ceil(RUN_BYTES/3))}),null);
 const g=fixture();g.weapons=[{id:'made-up',tier:9}];assert.equal(roundtrip(g),null);g.weapons=[];assert.ok(roundtrip(g));
});
test('browser checkpoint survives defeat and explicit abandonment clears only run state',()=>{
 const st=storage(),save=runSave({scope:{},storage:st}),g=fixture();g.coins=28;assert.equal(save.save(g),true);const text=st.getItem(RUN_KEY);const fresh=runSave({scope:{},storage:st});assert.equal(readRun(fresh.snapshot).coins,28);assert.equal(fresh.save(new SurvivalGame()),true);assert.equal(st.getItem(RUN_KEY),text);g.die();fresh.save(g);assert.equal(readRun(JSON.parse(st.getItem(RUN_KEY))).phase,'lost');fresh.clear();assert.equal(st.getItem(RUN_KEY),null);assert.equal(st.getItem('piclex.lab.progress.v1'),'keep');assert.equal(st.getItem('piclex.lab.sound.v1'),'off');
});
test('native bridge acknowledges ordered snapshots and reports failed saves without using ephemeral storage',()=>{
 const messages=[],timers=new Map();let failures=0,next=0;const scope={PICLEX_LAB_RUN_BRIDGE:1,PICLEX_LAB_RUN:captureRun(fixture()),webkit:{messageHandlers:{labRun:{postMessage:m=>messages.push(m)}}}};
 const save=runSave({scope,storage:{setItem(){throw Error('must not use');}},onFailure:()=>failures++,setTimer:fn=>{timers.set(++next,fn);return next;},clearTimer:id=>timers.delete(id)});
 assert.ok(save.snapshot);const g=fixture();g.coins=13;assert.equal(save.save(g),true);assert.equal(messages[0].action,'save');assert.equal(readRun(JSON.parse(messages[0].snapshot)).coins,13);save.acknowledge(messages[0].id,true);assert.equal(timers.size,0);g.coins=14;save.save(g);save.acknowledge(messages[1].id,false);assert.equal(failures,1);g.coins=15;save.save(g);[...timers.values()][0]();assert.equal(failures,1);g.die();g.waveStart=null;save.save(g);assert.equal(messages.at(-1).action,'clear');assert.equal(messages.at(-1).snapshot,undefined);save.acknowledge(messages.at(-1).id,true);
});
test('storage errors leave the last valid checkpoint intact and report actionable failure',()=>{
 const st=storage(),g=fixture();runSave({scope:{},storage:st}).save(g);const before=st.getItem(RUN_KEY);let errors=0;st.setItem=()=>{throw Error('quota');};const save=runSave({scope:{},storage:st,onFailure:()=>errors++});g.coins=88;assert.equal(save.save(g),false);assert.equal(st.getItem(RUN_KEY),before);assert.equal(errors,1);
});
test('attack sounds only follow actual fire or swing; explosive hits emit the separate impact sound',()=>{
 const cases=[['pea','shot'],['smg','rapid-shot'],['minigun','rapid-shot'],['shredder','cannon'],['laser','laser-shot'],['wand','magic-shot'],['lightning_shiv','magic-shot'],['stick','melee-swing']];
 for(const [id,key] of cases){const g=fixture();g.weapons=[{id,tier:id==='minigun'?3:1}];assert.equal(g.attack(g.weapons[0],0),false);assert.deepEqual(g.audioEvents,[]);g.spawn('baby_alien',{x:g.player.x+30,y:g.player.y,warning:false});g.attack(g.weapons[0],0);assert.ok(g.audioEvents.includes(key),id);g.pause();assert.deepEqual(g.audioEvents,[]);}
 const g=fixture();g.spawn('baby_alien',{x:430,y:280,warning:false});g.explodeOnHit(g.enemies[0],{w:weapon('shredder',4),damage:10,critical:false,owner:0});assert.ok(g.audioEvents.includes('explosion'));assert.equal(g.explosions.length,1);
 g.audioEvents=[];g.bullets=Array(overrides.projectileLimit).fill({});g.attack(g.weapons[0],0);assert.deepEqual(g.audioEvents,[]);
});

test('normal exit waits for native acknowledgement and a failed clear is retried',async()=>{
 const messages=[];const timers=new Map();let next=0;const scope={PICLEX_LAB_RUN_BRIDGE:1,webkit:{messageHandlers:{labRun:{postMessage:m=>messages.push(m)}}}};const save=runSave({scope,setTimer:fn=>{timers.set(++next,fn);return next;},clearTimer:id=>timers.delete(id)});const g=fixture();save.save(g);let finished=false;const waiting=save.flush().then(ok=>{finished=ok;});await Promise.resolve();assert.equal(finished,false);save.acknowledge(messages[0].id,true);await waiting;assert.equal(finished,true);g.die();g.waveStart=null;save.save(g);save.acknowledge(messages[1].id,false);assert.equal(await save.flush(),false);save.save(g);assert.equal(messages.length,3);assert.equal(messages[2].action,'clear');save.acknowledge(messages[2].id,true);assert.equal(await save.flush(),true);save.save(g);assert.equal(messages.length,3);
});
test('browser storage recovery permits exit after an earlier failure',async()=>{
 const st=storage(),set=st.setItem;st.setItem=()=>{throw Error('full');};const save=runSave({scope:{},storage:st}),g=fixture();save.save(g);assert.equal(await save.flush(),false);st.setItem=set;save.save(g);assert.equal(await save.flush(),true);
});
