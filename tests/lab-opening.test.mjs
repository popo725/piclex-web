import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaViewport,prepareGroups,spawnPosition } from '../packages/laboratory/src/arena.mjs';
import { SurvivalGame } from '../packages/laboratory/src/engine.mjs';
import { waves } from '../packages/laboratory/src/content.mjs';
import { seededRandom } from '../packages/laboratory/src/rules.mjs';

test('phone arena has room in world units, preserves aspect and fits completely inside the physical canvas',()=>{
  for(const [w,h] of [[294,340],[362,620],[800,510],[844,270],[0,0]]){
    const view=arenaViewport(w,h);assert.ok(Number.isFinite(view.scale)&&view.scale>0&&view.scale<=1);
    assert.ok(view.width>=640&&view.height>=480);
    assert.ok(Math.abs(view.width*view.scale-Math.max(1,w))<1e-6);
    assert.ok(Math.abs(view.height*view.scale-Math.max(1,h))<1e-6);
  }
  assert.equal(arenaViewport(362,620).width,640);
  const p=new SurvivalGame().player;assert.equal(p.r,12);
});
test('opening wave has a quiet start, 2-3 enemies per batch, spaced waves, and no mutation of imported PC data',()=>{
  const original=JSON.stringify(waves);const group=prepareGroups(waves[0])[0];
  assert.equal(group.next,3);assert.ok(Math.abs(group.repeating_interval-4.8)<1e-9);
  assert.deepEqual([group.units[0].min_number,group.units[0].max_number],[2,3]);
  const g=new SurvivalGame({random:seededRandom(71)});g.startWave();g.weapons=[];g.player.invulnerable=100;g.treeTimer=Infinity;
  for(let i=0;i<119;i++)g.update(.025);assert.equal(g.enemies.length,0);
  g.update(.05);assert.ok(g.enemies.length>=2&&g.enemies.length<=3);
  const first=g.enemies.length;for(let i=0;i<150;i++)g.update(.025);assert.equal(g.enemies.length,first);
  assert.equal(JSON.stringify(waves),original);
  assert.equal(prepareGroups(waves[5])[0].repeating_interval,waves[5].groups.filter(g=>g.min_difficulty<=0&&g.max_difficulty>=0)[0].repeating_interval);
});
test('population cap counts warnings, delays excess enemies, and keeps existing enemies instead of replacing them',()=>{
  const g=new SurvivalGame({random:seededRandom(72)});g.startWave();
  for(let i=0;i<12;i++)assert.ok(g.spawn('baby_alien',{x:40+i*50,y:40}));
  const first=g.enemies[0];assert.equal(g.spawn('baby_alien'),undefined);assert.equal(g.enemies.length,12);assert.equal(g.enemies[0],first);
  g.enemies[0].hp=0;g.enemies.shift();assert.ok(g.spawn('baby_alien'));assert.equal(g.enemies.length,12);
});
test('random and fallback births avoid the player and leave gaps between monsters, including pending crosses',()=>{
  for(const random of [seededRandom(73),()=>.5]){
    const g=new SurvivalGame({random});g.startWave();
    for(let i=0;i<12;i++){
      const e=g.spawn('baby_alien');assert.ok(e);assert.ok(Math.hypot(e.x-g.player.x,e.y-g.player.y)>=140);
      for(const other of g.enemies)if(other!==e)assert.ok(Math.hypot(e.x-other.x,e.y-other.y)>=e.r+other.r+20);
    }
  }
  const p={x:140,y:120};assert.equal(spawnPosition(280,240,p,[{x:40,y:40,r:1000,hp:10}],15,()=>.5),null);
});
test('boss group retries when full rather than marking a bossless wave complete',()=>{
  const g=new SurvivalGame({random:()=>.5});g.wave=19;g.startWave();const group=g.groups.find(g=>g.is_boss);
  const spawn=g.spawn;g.spawn=()=>undefined;g.elapsed=group.next;g.spawnGroups();assert.equal(group.count,0);assert.ok(group.next>g.elapsed);
  g.spawn=spawn;g.elapsed=group.next;g.spawnGroups();assert.equal(group.count,1);assert.ok(g.enemies.some(e=>e.boss));
});
test('fewer opening enemies retain pickup value for shop and XP, while later waves keep imported material value',()=>{
  for(const [wave,value] of [[1,3],[2,2],[3,2],[4,1],[6,1]]){
    const g=new SurvivalGame({random:()=>.5});g.wave=wave-1;g.startWave();g.groups=[];g.treeTimer=Infinity;
    const e=g.spawn('baby_alien',{x:100,y:100,warning:false});e.hp=0;g.update(.025);
    assert.equal(g.gems[0].value,value);assert.equal(g.kills,1);
    g.player.x=100;g.player.y=100;for(let i=0;i<20&&g.gems.length;i++)g.update(.01);assert.equal(g.coins,value);assert.equal(g.xp,value);
  }
});
test('weapon turns towards a new target before firing; potato keeps its quiet body state',()=>{
  const g=new SurvivalGame({random:()=>.5});g.startWave();g.groups=[];g.treeTimer=Infinity;
  const e=g.spawn('bruiser',{x:g.player.x-80,y:g.player.y,warning:false});e.speed=0;e.hp=10000;
  g.update(.025);assert.equal(g.bullets.length,0);assert.equal(g.weaponPoses[0].aligned,false);assert.equal(g.player.animation,'Idle');
  assert.ok(g.weaponPoses[0].angle>0&&g.weaponPoses[0].angle<Math.PI);
  for(let i=0;i<6;i++)g.update(.025);
  assert.ok(g.weaponKicks[0]>0);assert.ok(g.bullets.length>0);assert.equal(g.player.animation,'Idle');
  const pose=g.weaponPoses[0];assert.ok(Math.abs(Math.sin(pose.angle))<1e-6);assert.ok(Math.cos(pose.angle)<0);
  g.player.invulnerable=0;g.hitPlayer(1);assert.equal(g.player.animation,'Idle');assert.ok(g.player.hit>0);
});
