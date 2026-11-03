import test from 'node:test';
import assert from 'node:assert/strict';
import { SurvivalGame,MAX_WAVES } from '../packages/laboratory/src/engine.mjs';
import { weapon,weaponEntries,itemEntries,enemies,waves,validateContent } from '../packages/laboratory/src/content.mjs';
import { weaponDamage,attackInterval,armorMultiplier,damageTaken,shopPrice,rerollPrice,rollTier,seededRandom,enemyGrowth,xpRequired,dropChance,regenInterval } from '../packages/laboratory/src/rules.mjs';
const word={english:'garden',chinese:'花园',example:'A garden.'};
function shop(){const g=new SurvivalGame({words:[word],random:seededRandom(42)});g.wave=1;g.phase='shop';g.coins=500;g.makeOffers();return g;}

test('PC 1.1.15.4 data plus four H5 Wrench tiers, 27 reference items and seven preserved extras have valid references',()=>{
  assert.equal(weaponEntries.filter(w=>w.id!=='wrench').length,74);assert.equal(weaponEntries.length,78);assert.equal(itemEntries.length,34);assert.equal(waves.length,20);assert.ok(validateContent());
  for(const id of new Set(weaponEntries.map(w=>w.id)))assert.deepEqual(weaponEntries.filter(w=>w.id===id).map(w=>w.tier),['minigun','power_fist','thunder_sword'].includes(id)?[3,4]:[1,2,3,4]);
  weaponEntries.push(weaponEntries[0]);try{assert.throws(()=>validateContent(),/duplicate weapon/);}finally{weaponEntries.pop();}
});
test('damage follows published pistol and SMG scaling examples and newer knife tier data',()=>{
  assert.equal(weaponDamage(weapon('pea'),{stat_ranged_damage:10}),22);
  assert.equal(weaponDamage(weapon('smg'),{stat_ranged_damage:10}),8);
  assert.equal(weaponDamage(weapon('knife',4),{stat_melee_damage:30}),49);
  assert.equal(weaponDamage(weapon('knife',4),{stat_melee_damage:10,stat_percent_damage:20}),40);
  assert.equal(weapon('knife').stats.cooldown,25);assert.equal(weapon('pea',4).stats.damage,50);
});
test('stored cooldown distinguishes positive and negative speed and caps at two frames',()=>{
  assert.equal(attackInterval(60,25),.8);assert.equal(attackInterval(60,-30),1.3);assert.equal(attackInterval(60,100),.5);assert.equal(attackInterval(60,100000),2/60);
});
test('armor matches documented 15 armor = 50%, negative 15 = 150%, with damage rounded before armor',()=>{
  assert.equal(armorMultiplier(15),.5);assert.equal(armorMultiplier(-15),1.5);assert.equal(damageTaken(20,15),10);assert.equal(damageTaken(20,-15),30);assert.equal(damageTaken(1.6,6),1);
});
test('shop price and rerolls match the published SMG, Cyclops Worm, wave 5 and wave 15 examples',()=>{
  assert.equal(shopPrice(20,1),23);assert.equal(shopPrice(45,5),72);assert.equal(shopPrice(45,5,-10),65);
  assert.equal(rerollPrice(1),1);assert.equal(rerollPrice(5),5);assert.equal(rerollPrice(5,1),7);assert.equal(rerollPrice(15),17);assert.equal(rerollPrice(20,4),55);
});
test('seeded tier statistics match wave 8 thresholds; luck increases rarity within caps',()=>{
  const random=seededRandom(15),counts=[0,0,0,0,0],total=100000;for(let i=0;i<total;i++)counts[rollTier(8,0,random)]++;
  for(const [tier,expected] of [[1,.58],[2,.32],[3,.0977],[4,.0023]])assert.ok(Math.abs(counts[tier]/total-expected)<.005);
  const lucky=seededRandom(15),c=[0,0,0,0,0];for(let i=0;i<total;i++)c[rollTier(20,10000,lucky)]++;
  assert.ok(c[1]/total>.395&&c[4]/total<.085);
});
test('enemy wave 10 and 20 health, drop rates and regeneration match reference examples',()=>{
  const baby=enemies.find(e=>e.id==='baby_alien').stats;assert.equal(enemyGrowth(baby,10).hp,21);assert.equal(enemyGrowth(baby,20).hp,41);
  assert.equal(enemyGrowth(enemies.find(e=>e.id==='predator').stats,20).hp,29250);
  assert.equal(dropChance(.01,100),.02);assert.equal(dropChance(.01,-100),0);assert.equal(regenInterval(1),5);assert.ok(Math.abs(regenInterval(5)-1.8)<.001);
});
test('fixed seed drop statistics agree with the 1% base and 2% at 100 luck rather than a single lucky roll',()=>{
  for(const luck of [0,100]){const random=seededRandom(202),total=100000;let count=0;for(let i=0;i<total;i++)if(random()<dropChance(.01,luck))count++;assert.ok(Math.abs(count/total-(luck? .02:.01))<.002);}
});
test('early shop guarantees, weapon tiers, stack caps, and locked price/answer/rebate survive refresh and next wave',()=>{
  const g=shop();assert.equal(g.offers.filter(o=>o.kind==='weapon').length,2);
  const item=g.offers[0];g.toggleLock(0);g.beginPurchase(0);g.spell('g');g.cancelPurchase();const price=item.price,coins=g.coins;assert.ok(g.refreshShop());assert.equal(g.offers[0],item);assert.equal(item.price,price);assert.equal(item.answer,'g');assert.equal(item.rebate,1);assert.equal(g.coins,coins-1);
  g.startWave();g.enterShop();assert.equal(g.offers[0],item);assert.equal(item.price,price);
});
test('two equal tiers combine, unequal or legendary tiers cannot; full-slot spelling buys and merges exactly once',()=>{
  const g=shop();g.weapons=[{id:'pea',tier:1},{id:'pea',tier:1},{id:'pea',tier:2}];assert.ok(g.combineWeapon(0));assert.deepEqual(g.weapons,[{id:'pea',tier:2},{id:'pea',tier:2}]);assert.ok(g.combineWeapon(0));assert.equal(g.weapons[0].tier,3);assert.equal(g.combineWeapon(0),false);
  g.weapons=Array.from({length:6},()=>({id:'pea',tier:1}));g.offers=[{...weaponEntries[0],price:12,status:'available',word,answer:''}];g.coins=100;assert.ok(g.beginPurchase(0));assert.equal(g.spell('garden').status,'purchased');assert.equal(g.weapons.length,6);assert.equal(g.weapons[0].tier,2);assert.equal(g.coins,90);assert.equal(g.spell('garden').status,'idle');
  g.weapons=Array.from({length:6},()=>({id:'pea',tier:4}));g.offers[0]={...weapon('pea',4),kind:'weapon',price:12,status:'available',word,answer:''};assert.equal(g.beginPurchase(0),false);
});
test('set bonuses recalculate after combine/recycle; pistol piercing and slingshot bounce are actual weapon behaviors',()=>{
  const g=shop();g.weapons=[{id:'pea',tier:1},{id:'pea',tier:1}];g.refreshStats();assert.equal(g.stats.stat_range,10);g.combineWeapon(0);assert.equal(g.stats.stat_range||0,0);
  assert.equal(weapon('pea').stats.piercing,1);assert.equal(weapon('slingshot').stats.bounce,1);
  g.phase='battle';g.wave=1;g.player.x=100;g.player.y=100;g.enemies=[];
  const first=g.spawn('bruiser',{x:140,y:100,warning:false}),second=g.spawn('bruiser',{x:170,y:100,warning:false});first.speed=second.speed=0;g.attack({id:'pea',tier:1},0);g.attackTimers=[100];for(let i=0;i<4;i++)g.update(.025);
  assert.ok(first.hp<first.maxHP);assert.ok(second.hp<second.maxHP);
});
test('healing drops once on death, stays while healthy, heals 3 with clamping; unknown does not affect pickups',()=>{
  const g=new SurvivalGame({words:[word],random:()=>0});g.startWave();const enemy=g.spawn('baby_alien',{x:g.player.x,y:g.player.y,warning:false});enemy.data={...enemy.data,item_drop_chance:0};enemy.hp=0;g.update(.01);assert.equal(g.heals.length,1);assert.equal(g.healPickups,0);g.player.hp-=2;g.update(.01);assert.equal(g.player.hp,g.player.maxHP);assert.equal(g.heals.length,0);assert.equal(g.healPickups,1);g.update(.01);assert.equal(g.healPickups,1);
});
test('death cannot be rescued by a same-frame fruit pickup',()=>{
  const g=new SurvivalGame();g.startWave();g.player.hp=1;g.player.invulnerable=0;g.heals=[{x:g.player.x,y:g.player.y,kind:'fruit'}];g.enemies=[{x:g.player.x,y:g.player.y,hp:10,speed:0,r:10,damage:100,armor:0,warning:0,hit:0}];g.update(.01);assert.equal(g.phase,'dying');assert.equal(g.player.hp,0);
  for(let i=0;i<20;i++)g.update(.05);
  assert.equal(g.phase,'lost');
});
test('materials left on the ground double next pickups; level 1 requires 16 XP and queues four choices',()=>{
  const g=new SurvivalGame();g.startWave();g.gems=[{x:0,y:0,value:4}];g.enterShop();assert.equal(g.materialBank,4);g.pendingUpgrades=[];g.phase='shop';g.startWave();g.gems=[{x:g.player.x,y:g.player.y,value:1}];const before=g.coins;for(let i=0;i<20&&g.gems.length;i++)g.update(.01);assert.equal(g.coins,before+2);assert.equal(g.materialBank,3);
  assert.equal(xpRequired(1),16);g.gainXP(16);g.enterShop();assert.equal(g.phase,'upgrade');assert.equal(g.upgradeOffers.length,4);assert.ok(g.chooseUpgrade(0));
});
test('three characters retain their rules; Danger 0 has 20 scripted waves and a boss on wave 20',()=>{
  const rounded=new SurvivalGame();assert.equal(rounded.player.maxHP,15);assert.equal(rounded.stats.stat_harvesting,8);
  const brawler=new SurvivalGame({character:'brawler'});assert.equal(brawler.weapons[0].id,'fist');assert.equal(brawler.stats.stat_dodge,15);
  const ranger=shop();ranger.character={id:'ranger'};for(let i=0;i<50;i++)assert.equal(ranger.rollWeapon(1).type,'ranged');
  assert.equal(MAX_WAVES,20);assert.deepEqual(waves.slice(0,8).map(w=>w.duration),[20,25,30,35,40,45,50,55]);assert.equal(waves[19].duration,90);
  const g=new SurvivalGame({random:seededRandom(3)});g.wave=19;g.phase='shop';g.startWave();for(let i=0;i<21;i++)g.update(.05);assert.equal(g.enemies.filter(e=>e.boss).length,1);
});

test('spawn positions cover the arena interior and warning freezes its position until birth',()=>{
  const g=new SurvivalGame({random:seededRandom(241)});g.wave=5;g.startWave();
  const samples=Array.from({length:60},()=>g.spawn('baby_alien'));
  assert.ok(samples.filter(e=>e.x>100&&e.x<g.width-100&&e.y>100&&e.y<g.height-100).length>20);
  for(const e of samples){assert.ok(e.warning>0);assert.ok(Math.hypot(e.x-g.player.x,e.y-g.player.y)>=90);}
  g.enemies=[];g.weapons=[];const e=g.spawn('baby_alien',{x:g.player.x,y:g.player.y});
  const {x,y,hp}=e;g.player.invulnerable=0;const playerHP=g.player.hp;
  g.attack({id:'pea',tier:1},0);assert.equal(g.bullets.length,0);
  for(let i=0;i<12;i++)g.update(.05);
  assert.equal(e.x,x);assert.equal(e.y,y);assert.equal(e.hp,hp);assert.equal(g.player.hp,playerHP);assert.ok(e.warning>0);
  g.update(.05);g.update(.001);assert.equal(e.warning,0);assert.equal(e.x,x);assert.equal(e.y,y);
  g.update(.01);assert.ok(g.player.hp<playerHP);
});

test('seeded standard 20-wave run preserves settlement and eventually wins, with bounded entities',()=>{
  const g=new SurvivalGame({random:seededRandom(88)});g.baseStats.stat_max_hp=100000;g.baseStats.stat_percent_damage=1000;g.weapons=Array.from({length:6},()=>({id:'slingshot',tier:4}));g.refreshStats();g.player.hp=g.player.maxHP;
  let frames=0;
  while(g.phase!=='won'&&frames<30000){
    if(['ready','shop'].includes(g.phase)){assert.ok(g.startWave());continue;}
    if(g.phase==='loot'){assert.ok(g.takeLoot(true));continue;}
    if(g.phase==='upgrade'){assert.ok(g.chooseUpgrade(0));continue;}
    assert.equal(g.phase,'battle');g.update(.05,{x:Math.sin(frames/120),y:Math.cos(frames/120)});frames++;
    assert.ok(g.enemies.length<=100);assert.ok(g.bullets.length<=320);assert.ok(g.heals.length<=100);
  }
  assert.equal(g.phase,'won');assert.equal(g.wave,20);assert.ok(g.kills>100);
});

test('invalid tiers, nonfinite cooldown and missing enemy references are rejected',()=>{
  const w=weaponEntries[0],old=w.stats.cooldown;w.stats.cooldown=NaN;
  try{assert.throws(()=>validateContent(),/invalid weapon/);}finally{w.stats.cooldown=old;}
  const tier=w.tier;w.tier=5;try{assert.throws(()=>validateContent(),/invalid weapon/);}finally{w.tier=tier;}
  const u=waves[0].groups.find(g=>g.units.length).units[0],id=u.enemy;u.enemy='missing_enemy';try{assert.throws(()=>validateContent(),/invalid group/);}finally{u.enemy=id;}
});
test('fatal contact cannot trigger an attack or lifesteal resurrection in the same frame',()=>{
  const g=new SurvivalGame({random:()=>0});g.startWave();g.player.hp=1;g.player.invulnerable=0;g.stats.stat_lifesteal=100;g.spawn('bruiser',{x:g.player.x,y:g.player.y,warning:false});g.update(.01);assert.equal(g.phase,'dying');assert.equal(g.player.hp,0);assert.equal(g.bullets.length,0);
  for(let i=0;i<20;i++)g.update(.05);
  assert.equal(g.phase,'lost');
});
