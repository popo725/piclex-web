import test from 'node:test';
import assert from 'node:assert/strict';
import {AchievementProgress,achievements,browserProgress,normalizeProgress,PROGRESS_KEY} from '../packages/laboratory/src/progress.mjs';
import {SurvivalGame} from '../packages/laboratory/src/engine.mjs';
import {characters,itemEntries,weapon,weaponEntries,validateContent} from '../packages/laboratory/src/content.mjs';
import {seededRandom,regenInterval} from '../packages/laboratory/src/rules.mjs';
import {weaponInterval} from '../packages/laboratory/src/weapon-effects.mjs';
const unlocked=()=>{const p=new AchievementProgress();p.collectMaterials(5000);p.recordHealing(200);for(const c of characters)p.completeWave(c.id,20,true);return p;};
function battle(character='well_rounded',progression=unlocked()) {const g=new SurvivalGame({character,progression,random:()=>.1});g.startWave();g.groups=[];g.treeTimer=Infinity;return g;}
function target(g,x=g.player.x+30,y=g.player.y){const e=g.spawn('baby_alien',{x,y,warning:false});e.hp=500;e.maxHP=500;e.speed=0;return e;}

test('seven playable characters and eight sourced reward challenges have resolvable references',()=>{
 assert.deepEqual(characters.map(c=>c.id),['well_rounded','brawler','ranger','multitasker','mage','doctor','engineer']);assert.equal(achievements.filter(a=>a.reward).length,8);assert.ok(validateContent());
 for(const a of achievements.filter(a=>a.reward)){assert.ok(a.reward);assert.ok(a.source.startsWith('res://challenges/'));}
 assert.equal(weapon('medical_gun').stats.cooldown,35);assert.equal(weapon('medical_gun',4).stats.lifesteal,.65);assert.equal(weapon('wand',4).effects[0].burnData.duration,9);
 assert.deepEqual(weaponEntries.filter(w=>w.id==='power_fist').map(w=>w.tier),[3,4]);
});
test('5000 picked-up materials records the Multitasker achievement once while the character stays open',()=>{
 let saves=0;const p=new AchievementProgress(undefined,()=>saves++);assert.equal(p.collectMaterials(4999).some(a=>a.id==='chal_gatherer_3'),false);assert.equal(p.available(characters.find(c=>c.id==='multitasker')),true);
 const restored=new AchievementProgress(p.snapshot());assert.equal(restored.collectMaterials(1)[0].id,'chal_gatherer_3');assert.equal(restored.available(characters.find(c=>c.id==='multitasker')),true);assert.equal(restored.collectMaterials(1).length,0);assert.equal(saves,1);
 for(const bad of [-1,Infinity,1.5,NaN])assert.equal(restored.collectMaterials(bad).length,0);
});
test('only a completed living wave20 awards each original character-clear reward; retries are idempotent',()=>{
 const p=new AchievementProgress();for(const c of characters.filter(c=>achievements.some(a=>a.character===c.id))){const achievement=achievements.find(a=>a.character===c.id);p.completeWave(c.id,19);p.completeWave(c.id,20,false);assert.equal(p.available(achievement.reward),false);assert.equal(p.completeWave(c.id,20,true).length,1);assert.equal(p.completeWave(c.id,20,true).length,0);}
 const g=battle();g.wave=20;g.player.hp=0;g.progression=new AchievementProgress();g.enterShop();assert.equal(g.progression.state.unlocked.length,0);
});
test('healing unlock uses actual restored HP within one wave, excludes overheal/level growth/settlement, and cannot accumulate two waves',()=>{
 const p=new AchievementProgress(),g=battle('well_rounded',p);g.weapons=[];g.player.maxHP=300;g.player.hp=300;assert.equal(g.healPlayer(999),0);assert.equal(g.healingThisWave,0);
 g.player.hp=100;g.healPlayer(199);assert.equal(p.has('chal_medicine'),false);g.enterShop();assert.equal(p.has('chal_medicine'),false);g.pendingUpgrades=[];g.crates=[];g.phase='shop';g.startWave();assert.equal(g.healingThisWave,0);
 g.player.maxHP=300;g.player.hp=100;g.healPlayer(1);assert.equal(p.has('chal_medicine'),false);g.player.hp=100;g.healPlayer(199);assert.equal(p.has('chal_medicine'),true);assert.equal(g.newUnlocks.filter(a=>a.id==='chal_medicine').length,1);
});
test('material progression is recorded by pickup, not harvest, spelling rebate or uncollected drops',()=>{
 const p=new AchievementProgress(),g=battle('well_rounded',p);g.gems=[{x:0,y:0,value:5}];g.enterShop();assert.equal(p.state.totalMaterials,0);g.pendingUpgrades=[];g.phase='shop';g.startWave();g.gems=[{x:g.player.x,y:g.player.y,value:2}];for(let i=0;i<20&&g.gems.length;i++)g.update(.01);assert.equal(p.state.totalMaterials,4);
});
test('locked rewards never enter shop/crate pools or direct purchase, then all tiers are eligible after unlock',()=>{
 const p=new AchievementProgress(),g=new SurvivalGame({progression:p,random:seededRandom(45)});g.wave=15;g.phase='shop';g.coins=9999;
 for(let i=0;i<2000;i++){assert.ok(p.available(g.rollItem(4)));assert.ok(p.available(g.rollWeapon(3)));}
 assert.equal(g.apply(itemEntries.find(i=>i.id==='potato')),false);assert.equal(g.apply(weapon('power_fist',3)),false);
 for(const c of characters)p.completeWave(c.id,20,true);
 const seen=new Set();for(let i=0;i<10000;i++){seen.add(g.rollItem(4).id);seen.add(g.rollWeapon(3).id);seen.add(g.rollWeapon(1).id);}
 for(const id of ['potato','night_goggles','power_fist','chopper','medikit','thunder_sword'])assert.ok(seen.has(id),id);
});
test('Multitasker has twelve slots, per-weapon penalty recalculates on buy/combine/recycle, and class bonuses cap at six',()=>{
 const g=new SurvivalGame({character:'multitasker',progression:unlocked()});assert.equal(g.maxWeapons,12);assert.equal(g.stats.stat_percent_damage,15);
 for(let i=1;i<12;i++)assert.ok(g.apply(weapon('stick')));assert.equal(g.weapons.length,12);assert.equal(g.stats.stat_percent_damage,-40);assert.equal(g.stats.stat_max_hp,25);
 g.phase='shop';g.combineWeapon(0);assert.equal(g.weapons.length,11);assert.equal(g.stats.stat_percent_damage,-35);g.recycleWeapon(0);assert.equal(g.stats.stat_percent_damage,-30);
});
test('every character can start immediately without achievement progress',()=>{
 for(const {id} of characters)assert.equal(new SurvivalGame({character:id,progression:new AchievementProgress()}).character.id,id);
});
test('Mage starts with one Snake and Sausage, 9 HP and sourced stat modifiers',()=>{
 const g=new SurvivalGame({character:'mage'});assert.deepEqual(g.inventory.map(i=>i.id),['snake','scared_sausage']);assert.equal(g.player.maxHP,9);assert.equal(g.weapons[0].id,'wand');
 g.addEffects([{key:'stat_elemental_damage',value:4},{key:'stat_melee_damage',value:4},{key:'stat_ranged_damage',value:4},{key:'stat_engineering',value:4}]);g.refreshStats();assert.equal(g.stats.stat_elemental_damage,5);assert.equal(g.stats.stat_melee_damage,0);assert.equal(g.stats.stat_ranged_damage,0);assert.equal(g.stats.stat_engineering,2);
});
test('Doctor has +100% net Medical attack speed, halved armor gains and doubled regeneration gains and healing',()=>{
 const g=battle('doctor');assert.equal(g.stats.stat_hp_regeneration,5);assert.equal(g.stats.stat_harvesting,5);const e=target(g);g.attack(g.weapons[0],0);assert.ok(Math.abs(g.attackTimers[0]-(35/120+.2))<1e-9);
 g.addEffects([{key:'stat_armor',value:4},{key:'stat_hp_regeneration',value:2}]);g.refreshStats();assert.equal(g.stats.stat_armor,2);assert.equal(g.stats.stat_hp_regeneration,9);
 g.weapons=[];g.enemies=[];g.player.hp=4;g.regenTimer=regenInterval(9)-.01;g.update(.02);assert.equal(g.player.hp,6);assert.equal(g.healingThisWave,2);
});
test('Engineer starts with a Wrench, gains extra Engineering and halves Damage gains',()=>{
 const g=new SurvivalGame({character:'engineer'});assert.equal(g.weapons[0].id,'wrench');assert.equal(g.stats.stat_engineering,10);assert.equal(g.damageFor(g.weapons[0]),22);
 g.addEffects([{key:'stat_engineering',value:4},{key:'stat_percent_damage',value:20}]);g.refreshStats();assert.equal(g.stats.stat_engineering,15);assert.equal(g.stats.stat_percent_damage,10);assert.equal(g.damageFor(g.weapons[0]),30);
 assert.deepEqual(weaponEntries.filter(w=>w.id==='wrench').map(w=>w.tier),[1,2,3,4]);
});
test('Medikit adds +10 regen, +2 every5 seconds only within current wave and -10 luck',()=>{
 const g=battle();assert.ok(g.apply(itemEntries.find(i=>i.id==='medikit')));assert.equal(g.stats.stat_hp_regeneration,10);assert.equal(g.stats.stat_luck,-10);g.elapsed=10;g.refreshStats();assert.equal(g.stats.stat_hp_regeneration,14);g.enterShop();assert.equal(g.stats.stat_hp_regeneration,10);
});
test('Wand+one Sausage causes3 ticks of4 burn, highest damage/duration refresh without stacking, burn cannot lifesteal',()=>{
 const g=battle('mage'),e=target(g);g.player.hp=1;g.stats.stat_lifesteal=100;g.inflictBurn(e,weapon('wand'),0);assert.equal(e.burn.damage,4);assert.equal(e.burn.remaining,3);g.inflictBurn(e,weapon('wand',4),0);assert.equal(e.burn.damage,13);assert.equal(e.burn.remaining,9);g.inflictBurn(e,weapon('wand'),0);assert.equal(e.burn.damage,13);assert.equal(e.burn.remaining,9);
 for(let i=0;i<9;i++)g.updateBurns(1);assert.equal(e.hp,383);assert.equal(g.player.hp,1);assert.equal(e.burn,null);
});
test('Snake shares one spread budget across a chain and never ignites warning enemies',()=>{
 const g=battle('mage'),a=target(g),b=target(g,a.x+20),c=target(g,a.x+40);g.inflictBurn(a,weapon('wand'),0);g.updateBurns(.01);assert.ok(b.burn);assert.equal(c.burn,undefined);assert.equal(a.burn.budget.remaining,0);
});
test('Thunder Sword III/IV releases exactly2/4 elemental projectiles, and PowerFist explosion hits nearby enemies',()=>{
 const g=battle(),a=target(g),b=target(g,a.x+15);g.slowProjectilesOnHit(a,weapon('thunder_sword',3),0);assert.equal(g.bullets.length,2);g.slowProjectilesOnHit(a,weapon('thunder_sword',4),0);assert.equal(g.bullets.length,6);
 assert.equal(g.explodeOnHit(a,{w:weapon('power_fist',3),damage:40,critical:false,owner:0}),true);assert.equal(a.hp,460);assert.equal(b.hp,460);assert.ok(g.explosions.length);assert.equal(weaponInterval(weapon('power_fist',3)),.69);
});
test('browser local persistence survives a module reload; native injection takes precedence and changes flush immediately',()=>{
 let saved;const storage={getItem:()=>saved??null,setItem:(k,v)=>{assert.equal(k,PROGRESS_KEY);saved=v;}};let a=browserProgress({localStorage:storage});a.progress.collectMaterials(5000);a.flush();a=browserProgress({localStorage:storage});assert.equal(a.progress.has('chal_gatherer_3'),true);
 const messages=[],scope={localStorage:storage,PICLEX_LAB_PROGRESS:normalizeProgress(null),webkit:{messageHandlers:{labProgress:{postMessage:v=>messages.push(v)}}}};const native=browserProgress(scope);assert.equal(native.progress.has('chal_gatherer_3'),false);native.progress.collectMaterials(5000);assert.equal(messages.length,1);assert.equal(messages[0].totalMaterials,5000);
});
test('malformed persistent input is ignored and snapshots cannot mutate live state',()=>{
 const p=unlocked(),state=p.snapshot();state.unlocked.length=0;assert.ok(p.state.unlocked.length);for(const value of [{...p.snapshot(),schemaVersion:2},{...p.snapshot(),totalMaterials:-1},{...p.snapshot(),unlocked:['../escape']},{...p.snapshot(),bestHealingWave:Infinity}])assert.equal(normalizeProgress(value).unlocked.length,0);
});
