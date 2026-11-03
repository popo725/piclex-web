import test from 'node:test';
import assert from 'node:assert/strict';
import { SurvivalGame } from '../packages/laboratory/src/engine.mjs';
import { seededRandom } from '../packages/laboratory/src/rules.mjs';
import { overrides } from '../packages/laboratory/src/data/prototype-overrides.mjs';

function arena(){
  const g=new SurvivalGame({random:seededRandom(17)});
  g.startWave();g.groups=[];g.treeTimer=Infinity;g.duration=10000;
  g.weapons=[];g.enemies=[];g.player.invulnerable=100;g.player.regen=0;
  return g;
}

test('materials visibly travel into the player before their value is settled',()=>{
  const g=arena(),p=g.player,startCoins=g.coins;
  g.gems=[{x:p.x+90,y:p.y,value:2}];
  const start=g.gems[0].x;
  g.update(.05);
  assert.equal(g.gems.length,1);
  assert.ok(g.gems[0].x<start);
  assert.ok(g.gems[0].x>p.x);
  assert.ok(g.gems[0].attractTime>0);
  assert.equal(g.coins,startCoins);
  for(let i=0;i<20&&g.gems.length;i++)g.update(.05);
  assert.equal(g.gems.length,0);
  assert.equal(g.coins,startCoins+2);
});

test('a nearby material no longer disappears at the old 22px pickup edge',()=>{
  const g=arena(),p=g.player,startCoins=g.coins;
  g.gems=[{x:p.x+10,y:p.y,value:1}];
  g.update(.05);
  assert.equal(g.gems.length,1);
  assert.ok(g.gems[0].x<p.x+10);
  assert.equal(g.coins,startCoins);
  for(let i=0;i<20&&g.gems.length;i++)g.update(.01);
  assert.equal(g.gems.length,0);
  assert.equal(g.coins,startCoins+1);
});

test('materials stay still outside the magnet, while an attracted material keeps chasing a moving player',()=>{
  const g=arena(),p=g.player;
  g.gems=[{x:p.x+overrides.materialAttraction+20,y:p.y,value:1}];
  const outside=g.gems[0].x;
  for(let i=0;i<5;i++)g.update(.05);
  assert.equal(g.gems[0].x,outside);
  g.gems[0].x=p.x+90;g.update(.05);
  const latched=g.gems[0].x;
  p.x-=200;g.update(.05);
  assert.ok(g.gems[0].x<latched);
  assert.ok(Number.isFinite(g.gems[0].attractTime));
});

test('the magnet item still expands the material attraction radius',()=>{
  const g=arena(),p=g.player;
  assert.equal(p.magnet,overrides.materialAttraction);
  p.magnet+=40;
  g.gems=[{x:p.x+120,y:p.y,value:1}];
  const start=g.gems[0].x;
  g.update(.05);
  assert.ok(g.gems[0].x<start);
  assert.ok(Number.isFinite(g.gems[0].attractTime));
});
