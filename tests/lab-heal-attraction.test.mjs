import test from 'node:test';
import assert from 'node:assert/strict';
import { SurvivalGame } from '../packages/laboratory/src/engine.mjs';
import { seededRandom } from '../packages/laboratory/src/rules.mjs';
import { overrides } from '../packages/laboratory/src/data/prototype-overrides.mjs';

// Controlled battle fixture: fixed seed, no groups/tree/weapons/enemies and no
// wave end, so only the healing pickup filter can move the player or the drops.
function arena(){
  const g=new SurvivalGame({random:seededRandom(7)});
  g.startWave();g.groups=[];g.treeTimer=Infinity;g.duration=10000;
  g.weapons=[];g.enemies=[];g.player.invulnerable=100;g.player.regen=0;
  g.refreshStats();g.player.hp=g.player.maxHP;
  return g;
}

test('injured fruit inside the existing magnet radius is attracted and heals exactly 3 on pickup',()=>{
  const g=arena(),p=g.player;
  p.hp=p.maxHP-10;
  g.heals=[{kind:'fruit',x:p.x+90,y:p.y}];
  const start=g.heals[0].x;
  assert.ok(90<p.magnet);assert.ok(90>p.r+12);
  g.update(.05);
  assert.ok(g.heals[0].x<start);          // moved toward the player
  assert.ok(g.heals[0].x>p.x);
  assert.equal(g.healPickups,0);          // not yet touching after one step
  for(let i=0;i<10&&g.heals.length;i++)g.update(.05);
  assert.equal(g.heals.length,0);
  assert.equal(g.healPickups,1);
  assert.equal(p.hp,p.maxHP-7);           // 3 + consumable_heal(0)
});

test('full HP fruit stays completely stationary and uncollected even when touching',()=>{
  const g=arena(),p=g.player;
  assert.equal(p.hp,p.maxHP);
  g.heals=[{kind:'fruit',x:p.x+5,y:p.y},{kind:'fruit',x:p.x+90,y:p.y}];
  const before=g.heals.map(h=>[h.x,h.y]);
  for(let i=0;i<20;i++)g.update(.05);
  assert.deepEqual(g.heals.map(h=>[h.x,h.y]),before);
  assert.equal(g.healPickups,0);
});

test('injured fruit outside the magnet radius stays stationary',()=>{
  const g=arena(),p=g.player;
  p.hp=p.maxHP-5;
  g.heals=[{kind:'fruit',x:p.x+130,y:p.y}];
  const x=g.heals[0].x;
  for(let i=0;i<10;i++)g.update(.05);
  assert.equal(g.heals[0].x,x);
  assert.equal(g.heals.length,1);
  assert.equal(g.healPickups,0);
});

test('touching fruit clamps at max HP and is removed exactly once',()=>{
  const g=arena(),p=g.player;
  p.hp=p.maxHP-1;
  g.heals=[{kind:'fruit',x:p.x+5,y:p.y}];
  g.update(.01);
  assert.equal(p.hp,p.maxHP);             // bounded by max HP
  assert.equal(g.healPickups,1);
  assert.equal(g.heals.length,0);
  g.update(.05);
  assert.equal(g.healPickups,1);          // no duplicate pickup
});

test('the existing magnet item expansion widens fruit attraction beyond the default radius',()=>{
  const g=arena(),p=g.player;
  p.hp=p.maxHP-5;
  assert.equal(p.magnet,overrides.materialAttraction);
  p.magnet+=40;                           // same effect as the magnet item
  assert.ok(120<p.magnet);assert.ok(120>overrides.materialAttraction);
  g.heals=[{kind:'fruit',x:p.x+120,y:p.y}];
  const start=g.heals[0].x;
  g.update(.05);
  assert.ok(g.heals[0].x<start);
  assert.equal(g.healPickups,0);
});

test('crate and legendary drops keep their existing touch-only behavior',()=>{
  const g=arena(),p=g.player;
  p.hp=p.maxHP-5;
  g.heals=[{kind:'crate',x:p.x+90,y:p.y},{kind:'legendary',x:p.x+130,y:p.y}];
  const positions=g.heals.map(h=>[h.x,h.y]);
  g.update(.05);
  assert.deepEqual(g.heals.map(h=>[h.x,h.y]),positions); // not attracted
  g.heals=[{kind:'crate',x:p.x+5,y:p.y},{kind:'legendary',x:p.x+5,y:p.y}];
  g.update(.01);
  assert.equal(g.heals.length,0);
  assert.deepEqual(g.crates,['crate','legendary']);
});
