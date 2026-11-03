import test from 'node:test';
import assert from 'node:assert/strict';
import {SurvivalGame} from '../packages/laboratory/src/engine.mjs';
import {weapon} from '../packages/laboratory/src/content.mjs';
import {combatVisuals} from '../packages/laboratory/src/data/combat-visuals.mjs';
import {damageNumberFrame} from '../packages/laboratory/src/combat-fx.mjs';

test('laser starts as a .02 second muzzle pulse and retains sourced projectile physics',()=>{
  assert.equal(combatVisuals.laser.startupSeconds,.02);assert.equal(combatVisuals.laser.sourceSpriteSize,120);
  const g=new SurvivalGame({random:()=>0});g.startWave();g.groups=[];g.treeTimer=Infinity;
  g.player.x=320;g.player.y=240;g.weapons=[{id:'laser',tier:1}];g.attackTimers=[100];g.weaponPoses=[];
  const e=g.spawn('baby_alien',{x:450,y:240,warning:false});e.speed=0;e.hp=10000;
  g.attack(g.weapons[0],0);assert.equal(g.bullets.length,1);assert.equal(g.bullets[0].age,0);
  assert.equal(g.bullets[0].dx,3000*.38);assert.equal(g.bullets[0].piercing,1);assert.equal(weapon('laser').stats.piercing_dmg_reduction,.25);
  g.update(.01);assert.equal(g.bullets[0].age,.01);
});

test('Shredder keeps its actual area damage while showing .05 seconds flash and .75 seconds smoke',()=>{
  assert.equal(combatVisuals.explosion.flashSeconds,.05);assert.equal(combatVisuals.explosion.smokeSeconds,.75);assert.equal(combatVisuals.explosion.smokeAmount,10);
  const g=new SurvivalGame({random:()=>0});g.startWave();g.groups=[];g.treeTimer=Infinity;g.weapons=[];
  const e=g.spawn('baby_alien',{x:100,y:100,warning:false});e.hp=1000;e.speed=0;
  const b={w:weapon('shredder',4),damage:25,critical:false,owner:0};g.explodeOnHit(e,b);
  assert.equal(e.hp,975);assert.equal(g.explosions[0].duration,.8);assert.equal(g.explosions[0].radius,147.34*.9*.38);
  for(let i=0;i<10;i++)g.update(.05);assert.ok(g.explosions[0].life>.29);assert.equal(e.hp,975);
  for(let i=0;i<7;i++)g.update(.05);assert.equal(g.explosions.length,0);
});

test('hits expose actual damage as smooth normal and critical floating numbers',()=>{
  const g=new SurvivalGame({random:()=>.5});g.startWave();g.groups=[];g.treeTimer=Infinity;g.duration=1000;g.weapons=[];g.player.invulnerable=100;
  const normal=g.spawn('baby_alien',{x:200,y:180,warning:false});normal.hp=100;normal.armor=3;
  g.hitEnemy(normal,10,null,false);assert.deepEqual(g.damageNumbers.map(({value,critical})=>({value,critical})),[{value:7,critical:false}]);
  g.hitEnemy(normal,20,null,true);assert.deepEqual(g.damageNumbers.map(({value,critical})=>({value,critical})),[{value:7,critical:false},{value:17,critical:true}]);
  const start=damageNumberFrame(g.damageNumbers[0]);assert.equal(start.opacity,0);assert.equal(start.scale,.56);assert.equal(start.yOffset,0);
  for(let i=0;i<4;i++)g.update(.05);const middle=damageNumberFrame(g.damageNumbers[0]);assert.ok(middle.opacity>.95);assert.ok(middle.scale>=1);assert.ok(middle.yOffset<-10);
  for(let i=0;i<11;i++)g.update(.05);assert.equal(g.damageNumbers.length,0);
});
