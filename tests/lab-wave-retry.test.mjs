import test from 'node:test';
import assert from 'node:assert/strict';
import { SurvivalGame,catalog } from '../packages/laboratory/src/engine.mjs';
import { captureRun,readRun,restoreRun } from '../packages/laboratory/src/run-state.mjs';
import { runSave,RUN_KEY } from '../packages/laboratory/src/run-save.mjs';

const fixture=(wave=1)=>{
  const game=new SurvivalGame({random:()=>.5});
  game.wave=wave-1;game.coins=37;game.kills=12;game.materialBank=4;
  game.weapons=[{id:'smg',tier:2},{id:'stick',tier:2}];game.apply(catalog.find(o=>o.id==='health'));
  game.correct=2;game.failed=1;game.recycledWeapons=1;game.review=[{english:'cat',chinese:'猫',result:'correct'}];
  game.startWave();return game;
};
const lose=game=>{game.die();for(let i=0;i<100&&game.phase==='dying';i++)game.update(.05);assert.equal(game.phase,'lost');};
const roundtrip=game=>restoreRun(JSON.parse(JSON.stringify(captureRun(game))),{progression:game.progression,random:()=>.5});

test('retry rolls a failed attempt back to the wave entry loadout and clears its combat and loot',()=>{
  const game=fixture(7),before=structuredClone(game.waveStart);
  game.elapsed=16;game.coins+=50;game.kills+=8;game.materialBank=0;game.gainXP(100);game.healPickups+=3;
  game.spawn('baby_alien',{x:300,y:300,warning:false});game.attack(game.weapons[0],0);
  game.gems.push({x:100,y:100,value:6});game.heals.push({x:120,y:100,kind:'fruit'});game.crates.push('crate');
  game.baseStats.stat_percent_damage=500;game.weapons[0].tier=4;game.weaponKillCounts=[3,2];
  lose(game);game.resize(640,320);assert.equal(game.canRetryWave,true);assert.equal(game.retryWave(),true);
  assert.equal(game.wave,7);assert.equal(game.phase,'battle');assert.equal(game.elapsed,0);
  for(const key of ['coins','kills','level','xp','materialBank','baseStats','weapons','inventory','correct','failed','review','healPickups','recycledWeapons','pendingUpgrades','crates','weaponKillCounts','attackTimers','groups'])assert.deepEqual(game[key],before[key],key);
  for(const key of ['enemies','corpses','bullets','enemyBullets','gems','heals','explosions','particles','damageNumbers','audioEvents'])assert.equal(game[key].length,0,key);
  assert.equal(game.player.hp,game.player.maxHP);assert.equal(game.player.animation,'Idle');assert.equal(game.player.invulnerable,.8);
  assert.equal(game.width,640);assert.equal(game.height,320);assert.equal(game.player.x,320);assert.equal(game.player.y,160);
  assert.equal(game.retryWave(),false);game.update(.05);assert.equal(game.elapsed,.05);
});

test('repeated retries retain permanent achievements and do not mutate the entry checkpoint',()=>{
  const game=fixture(),before=structuredClone(game.waveStart);
  for(let attempt=0;attempt<3;attempt++){
    game.spawn('baby_alien',{x:300,y:300,warning:false});game.defeated(game.enemies[0]);lose(game);
    const unlocks=game.newUnlocks.map(a=>a.id);assert.ok(unlocks.includes('chal_rookie'));
    assert.equal(game.retryWave(),true);assert.deepEqual(game.waveStart,before);
    assert.deepEqual(game.newUnlocks.map(a=>a.id),unlocks);assert.equal(game.progression.state.counters.totalDeaths,attempt+1);
    assert.equal(game.progression.state.counters.totalKills,attempt+1);
  }
});

test('retry never resurrects acknowledged shared experience or discards a pending transaction',()=>{
  const game=fixture();game.enterShop();game.phase='shop';game.pendingUpgrades=[];
  const event=structuredClone(game.pendingExperience[0]);assert.ok(event);game.startWave();
  lose(game);assert.equal(game.retryWave(),true);assert.deepEqual(game.pendingExperience,[event]);
  assert.equal(game.settleExperience(event.id,'accepted').status,'earned');lose(game);game.retryWave();
  assert.deepEqual(game.pendingExperience,[]);game.enterShop();
  assert.equal(game.pendingExperience.length,1);assert.equal(game.pendingExperience[0].tier,2);
  assert.notEqual(game.pendingExperience[0].id,event.id);assert.equal(game.canRetryWave,false);
});

test('first and final waves can be retried, but victories and completed shops cannot',()=>{
  for(const wave of [1,20]){const game=fixture(wave);assert.equal(game.retryWave(),false);game.pause();assert.equal(game.retryWave(),false);game.resume();game.die();assert.equal(game.retryWave(),false);while(game.phase==='dying')game.update(.05);assert.equal(game.retryWave(),true);assert.equal(game.wave,wave);game.enterShop();assert.equal(game.waveStart,null);assert.equal(game.retryWave(),false);}
});

test('battle, pause, dying and defeat checkpoints preserve retry after a new webview',()=>{
  for(const phase of ['battle','paused','dying','lost']){
    const game=fixture(4);game.coins+=10;game.elapsed=3;
    if(phase==='paused')game.pause();if(phase==='dying')game.die();if(phase==='lost')lose(game);
    const restored=roundtrip(game);assert.ok(restored,phase);
    assert.equal(restored.phase,['dying','lost'].includes(phase)?'lost':'paused');
    if(restored.phase==='paused'){restored.resume();lose(restored);}
    assert.equal(restored.retryWave(),true);assert.equal(restored.wave,4);assert.equal(restored.coins,37);assert.equal(restored.elapsed,0);
    assert.ok(roundtrip(restored));
  }
});

test('old checkpoints still continue and gain a retry point at the next wave',()=>{
  const game=fixture();game.waveStart=null;const restored=roundtrip(game);assert.ok(restored);assert.equal(restored.waveStart,null);
  restored.resume();restored.enterShop();restored.phase='shop';restored.pendingUpgrades=[];restored.startWave();lose(restored);
  assert.equal(restored.retryWave(),true);assert.equal(restored.wave,2);
});

test('malformed, mismatched and recursively nested retry states are refused',()=>{
  for(const corrupt of [s=>s.wave=2,s=>s.characterID='ranger',s=>s.player.hp=0,s=>s.elapsed=2,s=>s.waveStart=s,s=>s.weapons[0].id='unknown']){
    const game=fixture();corrupt(game.waveStart);
    // Mutate the serialized checkpoint to exercise the input boundary as well.
    const snapshot=captureRun(fixture()),root=snapshot.graph.nodes[0],entry=root.values.find(([k])=>k==='waveStart')[1];
    const bad=captureRun(game);
    if(game.waveStart.wave!==game.wave){snapshot.graph.nodes[entry.ref].values.find(([k])=>k==='wave')[1]=2;assert.equal(readRun(snapshot),null);}
    else assert.equal(readRun(bad),null);
  }
});

test('native death saves and acknowledgements retain the retry point without browser storage',async()=>{
  const messages=[],timers=new Map();let timerID=0;
  const scope={PICLEX_LAB_RUN_BRIDGE:1,webkit:{messageHandlers:{labRun:{postMessage:m=>messages.push(m)}}}};
  const save=runSave({scope,setTimer:fn=>{timers.set(++timerID,fn);return timerID;},clearTimer:id=>timers.delete(id)}),game=fixture(3);
  lose(game);assert.equal(save.save(game),true);assert.equal(messages[0].action,'save');
  const restored=restoreRun(JSON.parse(messages[0].snapshot),{progression:game.progression});assert.equal(restored.canRetryWave,true);
  save.acknowledge(messages[0].id,true);assert.equal(await save.flush(),true);assert.equal(restored.retryWave(),true);
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const browser=runSave({scope:{},storage});browser.save(game);assert.equal(readRun(JSON.parse(data.get(RUN_KEY))).phase,'lost');
  browser.clear();assert.equal(data.has(RUN_KEY),false);
});

test('failed abandonment retries on the launch screen and a newer save supersedes it',async()=>{
  const messages=[],scope={PICLEX_LAB_RUN_BRIDGE:1,webkit:{messageHandlers:{labRun:{postMessage:m=>messages.push(m)}}}};
  const save=runSave({scope,setTimer:()=>1,clearTimer:()=>{}}),ready=new SurvivalGame();
  save.clear();save.acknowledge(messages.at(-1).id,false);assert.equal(await save.flush(),false);
  save.save(ready);assert.equal(messages.at(-1).action,'clear');save.acknowledge(messages.at(-1).id,true);assert.equal(await save.flush(),true);
  const count=messages.length;save.save(ready);assert.equal(messages.length,count);
  save.clear();save.save(fixture());const latest=messages.at(-1);save.acknowledge(latest.id,true);save.acknowledge(messages.at(-2).id,true);
  save.save(ready);assert.equal(messages.at(-1),latest);assert.ok(save.snapshot);
});
