import test from 'node:test';
import assert from 'node:assert/strict';
import { SurvivalGame } from '../packages/laboratory/src/engine.mjs';
import { weapon,weaponEntries,itemEntries,validateContent } from '../packages/laboratory/src/content.mjs';
import { weaponInterval } from '../packages/laboratory/src/weapon-effects.mjs';
import { itemTile,worldIds } from '../packages/laboratory/src/art.mjs';
function arena(id,tier=1,random=()=>.99){const g=new SurvivalGame({random});g.weapons=[{id,tier}];g.startWave();g.groups=[];g.treeTimer=Infinity;g.duration=100;g.player.x=100;g.player.y=100;g.player.invulnerable=100;return g;}
function dummy(g,x,y=100){const e=g.spawn('bruiser',{x,y,warning:false});e.speed=0;e.hp=e.maxHP=10000;e.armor=0;return e;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('requested numbers match PC resources and Wiki details without invented Minigun I/II',()=>{
  for(const [id,damage,prices] of [['lightning_shiv',[3,6,9,15],[18,36,66,142]],['shredder',[5,10,15,25],[15,31,61,122]],['smg',[3,4,5,8],[20,39,74,149]],['stick',[8,9,10,12],[10,22,45,91]],['ghost_axe',[12,18,24,40],[20,39,74,149]]]){
    assert.deepEqual(weaponEntries.filter(w=>w.id===id).map(w=>w.stats.damage),damage);assert.deepEqual(weaponEntries.filter(w=>w.id===id).map(w=>w.basePrice),prices);
  }
  assert.equal(weapon('minigun'),undefined);assert.equal(weapon('minigun',2),undefined);assert.deepEqual([weapon('minigun',3).stats.damage,weapon('minigun',4).stats.damage],[2,5]);assert.ok(validateContent());
});
test('SMG/Minigun/Shredder timings use local recoil and match published .17/.09/1.30 seconds',()=>{
  near(weaponInterval(weapon('smg')),1/6);near(weaponInterval(weapon('minigun',3)),.09);near(weaponInterval(weapon('shredder')),1.3);near(weaponInterval(weapon('stick')),1.29);near(weaponInterval(weapon('ghost_axe')),1.73);
  const g=arena('smg'),target=dummy(g,180);const shots=[];for(let i=0;i<40;i++){g.update(.025);if(g.weaponKicks[0]===.1)shots.push(g.elapsed);}assert.ok(shots.length>=5&&shots.length<=7);assert.ok(target.hp<target.maxHP);
});
test('melee Lightning Shiv triggers elemental projectiles and only the real tier bounce amount',()=>{
  for(const [tier,damage,bounces] of [[1,5,0],[2,6,1],[3,8,2],[4,11,3]]){
    const g=arena('lightning_shiv',tier),first=dummy(g,150),other=dummy(g,300);g.stats.stat_elemental_damage=10;g.attack(g.weapons[0],0);
    assert.equal(g.bullets.length,1);const b=g.bullets[0];assert.equal(b.lightning,true);assert.equal(b.damage,damage+8);assert.equal(b.bounce,bounces);assert.equal(b.x,first.x);assert.ok(b.hits.has(first));assert.ok(b.dx>0);g.attackTimers=[100];for(let i=0;i<10;i++)g.update(.025);assert.ok(other.hp<other.maxHP);
  }
});
test('one legendary Shredder shell can create four area explosions without centre double damage',()=>{
  const g=arena('shredder',4,()=>.5),victims=[140,155,170,185].map(x=>dummy(g,x)),bystander=dummy(g,165,125);g.attack(g.weapons[0],0);g.attackTimers=[100];for(let i=0;i<5;i++)g.update(.025);
  assert.equal(g.explosions.length,4);assert.equal(g.bullets.length,0);assert.ok(bystander.hp<bystander.maxHP);near(victims[0].maxHP-victims[0].hp,100);near(g.explosions[0].radius,147.34*.9*.38);
});
test('Shredder per-impact explosion chance agrees statistically with its tier-I 50% source',()=>{
  let seed=12;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};const g=arena('shredder',1,random),e=dummy(g,180),b={w:weapon('shredder'),damage:5,critical:false,owner:0};let exploded=0;
  for(let i=0;i<10000;i++)if(g.explodeOnHit(e,b))exploded++;assert.ok(Math.abs(exploded/10000-.5)<.015);
});
test('tier-IV Minigun pierces twice and loses 25% damage each time',()=>{
  const g=arena('minigun',4),victims=[140,165,190,215].map(x=>dummy(g,x));g.attack(g.weapons[0],0);g.attackTimers=[100];for(let i=0;i<5;i++)g.update(.025);assert.deepEqual(victims.map(e=>e.maxHP-e.hp),[5,4,3,0]);
});
test('six tier-I sticks each deal published 8 + five extra sticks times4 = 28 damage',()=>{
  const g=arena('stick');g.weapons=Array.from({length:6},()=>({id:'stick',tier:1}));g.refreshStats();assert.equal(g.damageFor(g.weapons[0]),28);assert.equal(g.player.maxHP,30);
});
test('ethereal kills are per weapon and per wave; axe damage and flint speed remain after sale',()=>{
  const g=arena('ghost_axe');g.weapons=[{id:'ghost_axe',tier:1},{id:'ghost_axe',tier:1}];const kill=owner=>{const e=dummy(g,150);e.hp=1;g.hitEnemy(e,100,weapon(g.weapons[owner]),false,owner);g.enemies=[];g.hitEnemy(e,100,weapon(g.weapons[owner]),false,owner);};
  for(let i=0;i<19;i++)kill(0);kill(1);assert.equal(g.stats.stat_percent_damage||0,0);kill(0);assert.equal(g.stats.stat_percent_damage,1);assert.equal(g.stats.stat_attack_speed||0,0);assert.deepEqual(g.weaponKillCounts,[20,1]);
  const tree=g.spawn('tree',{x:150,y:100,neutral:true,warning:false});g.hitEnemy(tree,1000,weapon(g.weapons[0]),false,0);assert.equal(g.weaponKillCounts[0],20);
  g.phase='shop';g.startWave();assert.deepEqual(g.weaponKillCounts,[0,0]);assert.equal(g.stats.stat_percent_damage,1);g.phase='shop';g.recycleWeapon(0);assert.equal(g.stats.stat_percent_damage,1);
  const f=arena('ghost_flint',4);for(let i=0;i<12;i++){const e=dummy(f,150);e.hp=1;f.hitEnemy(e,100,weapon(f.weapons[0]),false,0);f.enemies=[];}assert.equal(f.stats.stat_attack_speed,1);assert.equal(f.stats.stat_percent_damage||0,0);
});
test('all shop items and real weapon families have bitmap tiles and all field pickup props are mapped',()=>{
  for(const w of [...weaponEntries,...itemEntries])assert.ok(itemTile(w.id),w.id);assert.deepEqual(worldIds,['tree','stump','material','fruit','crate','legendary']);
});
