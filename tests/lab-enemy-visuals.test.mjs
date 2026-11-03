import test from 'node:test';
import assert from 'node:assert/strict';
import { enemies } from '../packages/laboratory/src/content.mjs';
import { enemyVisual,enemyVisuals } from '../packages/laboratory/src/enemy-visuals.mjs';

const stats=id=>enemies.find(enemy=>enemy.id===id)?.stats;

test('five new monster visuals provide two normal, two elite and one boss role',()=>{
  assert.equal(Object.keys(enemyVisuals).length,5);
  assert.deepEqual(Object.values(enemyVisuals).map(visual=>visual.rank),['normal','normal','elite','elite','boss']);
  assert.deepEqual(Object.values(enemyVisuals).map(visual=>visual.crop),[[0,400],[400,790],[790,1270],[1270,1615],[1615,2172]]);
  assert.deepEqual(['spitter','fin_alien','bruiser','pursuer'].map(id=>enemyVisual(id).index),[0,1,2,3]);
  assert.equal(enemyVisual('predator',true).index,4);
  assert.equal(enemyVisual('invoker',true).rank,'boss');
  assert.equal(enemyVisual('baby_alien'),null);
});

test('visual roles retain the imported Brotato PC 1.1.15.4 balance values',()=>{
  assert.deepEqual(Object.fromEntries(['health','health_increase_each_wave','speed','damage','damage_increase_each_wave','value'].map(key=>[key,stats('spitter')[key]])),{health:8,health_increase_each_wave:1,speed:200,damage:1,damage_increase_each_wave:.6,value:1});
  assert.deepEqual(Object.fromEntries(['health','health_increase_each_wave','speed','damage','damage_increase_each_wave','value'].map(key=>[key,stats('fin_alien')[key]])),{health:12,health_increase_each_wave:2,speed:400,damage:1,damage_increase_each_wave:1,value:1});
  assert.deepEqual(Object.fromEntries(['health','health_increase_each_wave','speed','damage','damage_increase_each_wave','value'].map(key=>[key,stats('bruiser')[key]])),{health:20,health_increase_each_wave:11,speed:300,damage:2,damage_increase_each_wave:.85,value:3});
  assert.deepEqual(Object.fromEntries(['health','health_increase_each_wave','speed','damage','damage_increase_each_wave','value'].map(key=>[key,stats('pursuer')[key]])),{health:10,health_increase_each_wave:24,speed:150,damage:1,damage_increase_each_wave:1.2,value:3});
  for(const id of ['predator','invoker'])assert.deepEqual(Object.fromEntries(['health','health_increase_each_wave','damage','damage_increase_each_wave','value'].map(key=>[key,stats(id)[key]])),{health:15000,health_increase_each_wave:750,damage:1,damage_increase_each_wave:1.5,value:10});
});
