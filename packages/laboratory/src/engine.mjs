import { weaponSound } from './combat-audio.mjs';
import { AchievementProgress } from './progress.mjs';
import { resolve, mismatch, fixed, align } from '../spelling.mjs';
import { eligibleWords, starterWords } from './words.mjs';
import { catalog, weapon, weaponInstance, weaponEntries, itemEntries, sets, enemies, waves, characters, upgrades, describeEffects } from './content.mjs';
import shopConfig from './data/shop.mjs';
import { overrides } from './data/prototype-overrides.mjs';
import { combatVisuals } from './data/combat-visuals.mjs';
import { clamp, weaponDamage, attackInterval, damageTaken, shopPrice, rerollPrice, recyclePrice, rollTier, enemyGrowth, xpRequired, regenInterval, dropChance, canCombine } from './rules.mjs';
import { cueAnimation,advanceAnimation } from './animation.mjs';
import { weaponPose,aimWeapon } from './weapon-pose.mjs';
import { openingProfile,prepareGroups,spawnPosition } from './arena.mjs';
import { specialEffect,weaponInterval } from './weapon-effects.mjs';
import { CORRECT_WORD_EXPERIENCE,skipExperienceCost,waveExperienceReward } from './experience.mjs';
import { runFields,runState } from './run-fields.mjs';
export { catalog };
export const MAX_WAVES=20;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const pick=(list,random)=>list[Math.floor(random()*list.length)];
const makeID=()=>globalThis.crypto?.randomUUID?.()||'10000000-1000-4000-8000-100000000000'.replace(/1/g,()=>Math.floor(Math.random()*16).toString(16));

export class SurvivalGame {
  constructor({words=starterWords,random=Math.random,character='well_rounded',progression=new AchievementProgress(),idFactory=makeID}={}) {
    this.progression=progression;this.newUnlocks=[];this.healingThisWave=0;this.recycledWeapons=0;this.waveStart=null;
    this.random=random;this.idFactory=idFactory;this.words=eligibleWords(words);if(!this.words.length)this.words=starterWords;
    this.width=800;this.height=560;this.wordCursor=0;this.wordOrder=[...this.words];
    for(let i=this.wordOrder.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[this.wordOrder[i],this.wordOrder[j]]=[this.wordOrder[j],this.wordOrder[i]];}
    this.phase='ready';this.wave=0;this.coins=0;this.kills=0;this.level=1;this.xp=0;this.materialBank=0;
    this.correct=0;this.failed=0;this.review=[];this.inventory=[];this.weapons=[];
    this.character=characters.find(c=>c.id===character&&this.progression.available(c))||characters[0];
    this.maxWeapons=this.character.id==='multitasker'?12:6;this.weapons=[{id:({brawler:'fist',multitasker:'stick',mage:'wand',doctor:'medical_gun',engineer:'wrench'}[this.character.id]||'pea'),tier:1}];
    this.baseStats={stat_max_hp:10};this.stats={};
    this.player={x:400,y:280,r:overrides.playerRadius,hp:10,maxHP:10,speed:165,damage:0,armor:0,haste:1,magnet:overrides.materialAttraction,regen:0,invulnerable:0};
    this.enemies=[];this.corpses=[];this.weaponPoses=[];this.weaponKicks=[];this.weaponKillCounts=[];this.explosions=[];this.bullets=[];this.enemyBullets=[];this.gems=[];this.heals=[];this.particles=[];this.damageNumbers=[];this.damageNumberSequence=0;this.offers=[];this.challenge=null;this.pendingExperience=[];
    this.audioEvents=[];this.elapsed=0;this.spawnTimer=0;this.groups=[];this.attackTimers=[];this.sweep=0;this.refreshCount=0;this.message='';
    this.pendingUpgrades=[];this.upgradeOffers=[];this.crates=[];this.lootOffer=null;this.healPickups=0;this.regenTimer=0;this.lifestealTimer=0;
    this.addEffects(this.character.effects.filter(e=>e.key.startsWith('stat_')&&!e.custom_key),false);if(this.character.id==='mage')for(const id of ['snake','scared_sausage'])this.apply(itemEntries.find(i=>i.id===id));this.refreshStats();this.player.hp=this.player.maxHP;
  }
  addEffects(effects,withGain=true){
    for(const e of effects){if(!Number.isFinite(e.value)||!e.key)continue;
      const value=withGain?this.statGain(e):e.value;
      this.baseStats[e.key]=(this.baseStats[e.key]||0)+value;
    }
  }
  statGain(e){
    let value=e.value;
    if(this.character.id==='ranger'){if(e.key==='stat_ranged_damage')value*=1.5;if(e.key==='stat_max_hp')value*=.75;}
    if(this.character.id==='mage'){if(e.key==='stat_elemental_damage')value*=1.25;if(['stat_melee_damage','stat_ranged_damage'].includes(e.key))value=0;if(e.key==='stat_engineering')value*=.5;}
    if(this.character.id==='doctor'){if(e.key==='stat_hp_regeneration')value*=2;if(e.key==='stat_armor')value*=.5;}
    if(this.character.id==='engineer'){if(e.key==='stat_engineering')value*=1.25;if(e.key==='stat_percent_damage')value*=.5;}
    return value;
  }
  refreshStats(){
    const stats={...this.baseStats},p=this.player,oldMax=p.maxHP;
    this.setCounts={};
    for(const instance of this.weapons){const w=weapon(instance);if(w)for(const set of w.sets)this.setCounts[set]=(this.setCounts[set]||0)+1;}
    for(const set of sets){const count=this.setCounts[set.id]||0;if(count>=2)for(const e of set.bonuses[Math.min(6,count)-2])stats[e.key]=(stats[e.key]||0)+this.statGain(e);}
    for(const instance of this.weapons)for(const effect of weapon(instance)?.effects||[])if(effect.key==='consumable_heal')stats.consumable_heal=(stats.consumable_heal||0)+effect.value;
    if(this.character.id==='multitasker')stats.stat_percent_damage=(stats.stat_percent_damage||0)-5*this.weapons.length;
    const medikitCount=this.inventory.filter(i=>i.id==='medikit').length;stats.stat_hp_regeneration=(stats.stat_hp_regeneration||0)+Math.floor((this.phase==='battle'?this.elapsed:0)/5)*2*medikitCount*(this.character.id==='doctor'?2:1);
    this.stats=stats;p.maxHP=Math.max(1,Math.floor(stats.stat_max_hp||1));p.hp=clamp(p.hp+Math.max(0,p.maxHP-oldMax),0,p.maxHP);
    p.armor=stats.stat_armor||0;p.speed=overrides.baseSpeed*overrides.worldScale*Math.max(.1,1+(stats.stat_speed||0)/100);
    p.haste=Math.max(.1,1+(stats.stat_attack_speed||0)/100);
    this.recordAchievements();
  }
  recordAchievements(increments={}){
    if(!this.wave||this.phase==='ready')return;
    const s=this.stats;
    this.newUnlocks.push(...this.progression.record({bestLevel:this.level,bestFastLevel:this.wave<6?this.level:0,
      bestConsumables:this.healPickups,bestCommonItems:new Set(this.inventory.filter(i=>i.kind==='item'&&i.tier===1).map(i=>i.id)).size,
      bestWeaponTypes:new Set(this.weapons.map(w=>w.id)).size,bestLegendaryWeapons:this.weapons.filter(w=>w.tier===4).length,
      bestMaxHP:this.player.maxHP,bestDodge:s.stat_dodge||0,bestSpeed:s.stat_speed||0,bestRange:s.stat_range||0,
      bestHarvesting:s.stat_harvesting||0,bestLifeSteal:s.stat_lifesteal||0,bestWallet:this.coins,
      bestNegativeRegen:Math.max(0,-(s.stat_hp_regeneration||0)),bestNegativeSpeed:Math.max(0,-(s.stat_speed||0))
    },increments));
  }
  resize(width,height){this.width=Math.max(280,width);this.height=Math.max(240,height);this.player.x=clamp(this.player.x,24,this.width-24);this.player.y=clamp(this.player.y,24,this.height-24);}
  startWave(){
    if(!['ready','shop'].includes(this.phase)||this.challenge||this.wave>=MAX_WAVES)return false;
    this.audioEvents=[];this.wave++;this.phase='battle';this.elapsed=0;this.healingThisWave=0;this.refreshStats();this.duration=waves[this.wave-1].duration;
    this.enemies=[];this.corpses=[];this.weaponPoses=[];this.weaponKicks=[];this.weaponKillCounts=this.weapons.map(()=>0);this.explosions=[];this.bullets=[];this.enemyBullets=[];this.gems=[];this.heals=[];this.damageNumbers=[];this.damageNumberSequence=0;this.attackTimers=this.weapons.map((_,i)=>i*.08);
    this.player.animation='Idle';this.player.animationTime=0;
    this.player.x=this.width/2;this.player.y=this.height/2;this.player.invulnerable=.8;this.spawnTimer=0;this.refreshCount=0;this.regenTimer=0;this.lifestealTimer=0;this.particles=[];
    this.groups=prepareGroups(waves[this.wave-1]);
    this.treeTimer=overrides.treeFirstSeconds;this.clockSecond=0;this.shopRerolls=0;
    // Never resurrect an already acknowledged experience transaction on retry.
    this.waveStart=structuredClone({...runState(this),pendingExperience:[]});return true;
  }
  get canRetryWave(){return this.phase==='lost'&&this.waveStart?.wave===this.wave&&this.waveStart.characterID===this.character.id;}
  retryWave(){
    if(!this.canRetryWave)return false;
    const state=structuredClone(this.waveStart),width=this.width,height=this.height;
    for(const key of runFields)if(key!=='pendingExperience'&&Object.hasOwn(state,key))this[key]=state[key];
    this.resize(width,height);this.player.x=this.width/2;this.player.y=this.height/2;
    this.player.hp=this.player.maxHP;this.deathTime=0;this.audioEvents=[];this.damageNumbers=[];this.damageNumberSequence=0;
    return true;
  }
  queueAudio(name){if(name){this.audioEvents.push(name);if(this.audioEvents.length>32)this.audioEvents.shift();}}
  pause(){this.audioEvents=[];if(this.phase==='battle'){this.phase='paused';return true;}return false;}
  resume(){if(this.phase==='paused'){this.phase='battle';return true;}return false;}
  nextWord(){return {...this.wordOrder[this.wordCursor++%this.wordOrder.length]};}
  gainXP(value){
    this.xp+=Math.max(0,value)*Math.max(0,1+(this.stats.xp_gain||0)/100);
    while(this.xp>=xpRequired(this.level)){this.xp-=xpRequired(this.level);this.level++;this.pendingUpgrades.push(this.level);this.baseStats.stat_max_hp++;this.refreshStats();this.burst(this.player.x,this.player.y,'#ffe9a0',16);}
  }
  enterShop(){
    if(this.phase!=='battle'||this.player.hp<=0)return false;
    this.waveStart=null;
    if(this.player.hp===1)this.newUnlocks.push(...this.progression.record({reckless:1}));
    this.recordAchievements();
    this.newUnlocks.push(...this.progression.completeWave(this.character.id,this.wave,this.wave===MAX_WAVES));
    this.materialBank+=this.gems.reduce((sum,g)=>sum+g.value,0);this.gems=[];this.heals=[];this.enemies=[];this.corpses=[];this.bullets=[];this.enemyBullets=[];
    const harvest=this.stats.stat_harvesting||0;this.coins=Math.max(0,this.coins+harvest);this.gainXP(harvest);
    if(harvest>0){this.baseStats.stat_harvesting=(this.baseStats.stat_harvesting||0)+Math.ceil(harvest*.05);this.refreshStats();}
    this.player.hp=this.player.maxHP;
    const waveReward=waveExperienceReward(this.wave);
    if(waveReward)this.pendingExperience.push({id:this.idFactory(),action:'wave',tier:this.wave,cost:0,amount:waveReward});
    if(this.wave>=MAX_WAVES){this.phase='won';this.refreshStats();return;}
    this.makeOffers();this.advanceSettlement();
  }
  advanceSettlement(){
    if(this.crates.length){this.phase='loot';this.lootOffer=this.rollItem(this.crates[0]==='legendary'?4:rollTier(this.wave,this.stats.stat_luck||0,this.random));}
    else if(this.pendingUpgrades.length){this.phase='upgrade';this.makeUpgrades();}
    else this.phase='shop';
    this.refreshStats();
  }
  makeUpgrades(){
    const level=this.pendingUpgrades[0],forced=level===5?2:[10,15,20].includes(level)?3:level%5===0?4:null;
    const pool=[...new Set(upgrades.map(u=>u.effects[0].key))];this.upgradeOffers=[];
    for(let i=0;i<4&&pool.length;i++){
      const key=pool.splice(Math.floor(this.random()*pool.length),1)[0],tier=forced||rollTier(level,this.stats.stat_luck||0,this.random);
      const u=upgrades.find(u=>u.effects[0].key===key&&u.tier===tier);if(u)this.upgradeOffers.push({...u,detail:describeEffects(u.effects)});
    }
  }
  chooseUpgrade(index){if(this.phase!=='upgrade'||!this.upgradeOffers[index])return false;this.addEffects(this.upgradeOffers[index].effects);this.refreshStats();this.pendingUpgrades.shift();this.advanceSettlement();return true;}
  rerollUpgrades(){if(this.phase!=='upgrade'||this.coins<this.refreshPrice)return false;this.coins-=this.refreshPrice;this.refreshCount++;this.makeUpgrades();return true;}
  takeLoot(recycle=false){
    if(this.phase!=='loot'||!this.lootOffer)return false;
    if(recycle)this.coins+=recyclePrice(this.lootOffer.basePrice,this.wave,this.stats.items_price||0);else this.apply(this.lootOffer);
    this.crates.shift();this.lootOffer=null;this.advanceSettlement();return true;
  }
  canOwnItem(item){return item.limit<0||this.inventory.filter(i=>i.kind==='item'&&i.id===item.id).length<item.limit;}
  rollItem(tier,excluded=new Set()){
    let pool=itemEntries.filter(i=>i.tier===tier&&this.progression.available(i)&&this.canOwnItem(i)&&!excluded.has(i.id));
    if(!pool.length)pool=itemEntries.filter(i=>i.tier<=tier&&this.progression.available(i)&&this.canOwnItem(i)&&!excluded.has(i.id));
    return pick(pool,this.random);
  }
  rollWeapon(tier,excluded=new Set()){
    let pool=weaponEntries.filter(w=>w.tier===tier&&this.progression.available(w)&&!excluded.has(w.id)&&(this.character.id!=='ranger'||w.type==='ranged'));
    const early=Math.max(0,6-this.wave),roll=this.random();
    const owned=new Set(this.weapons.map(w=>weaponInstance(w).id)),ownedSets=new Set(this.weapons.flatMap(w=>weapon(w)?.sets||[]));
    const biased=roll<shopConfig.sameWeaponChance+early*.01?pool.filter(w=>owned.has(w.id)):roll<shopConfig.sameWeaponChance+shopConfig.sameClassChance+early*.04?pool.filter(w=>w.sets.some(s=>ownedSets.has(s))):pool;
    return pick(biased.length?biased:pool,this.random);
  }
  makeOffers(){
    const previous=this.offers||[],locked=previous.filter(o=>o.locked&&o.status==='available');
    this.offers=Array(4).fill(null);const excluded=new Set(locked.map(o=>o.id));
    previous.forEach((o,i)=>{if(o.locked&&o.status==='available')this.offers[i]=o;});
    const required=this.wave<=2?2:this.wave<=5?1:0;let weapons=this.offers.filter(o=>o?.kind==='weapon').length;
    for(let i=0;i<4;i++)if(!this.offers[i]){
      const empty=this.offers.slice(i).filter(o=>!o).length,wantWeapon=weapons<required&&(empty<=required-weapons||this.wave<=2)||this.wave>2&&this.random()<shopConfig.weaponChance;
      const tier=rollTier(this.wave,this.stats.stat_luck||0,this.random);
      let item=wantWeapon?this.rollWeapon(tier,excluded):this.rollItem(tier,excluded);
      if(!item)item=this.rollItem(1,excluded)||this.rollWeapon(1,excluded);
      if(!item)throw new Error('Empty shop pool');
      this.offers[i]={...item,price:shopPrice(item.basePrice,this.wave,this.stats.items_price||0),status:'available',locked:false,word:this.nextWord(),answer:'',rewardedLetters:[],rebate:0};
      if(item.kind==='weapon')weapons++;
      if(item.kind==='item')excluded.add(item.id);
    }
  }
  get refreshPrice(){return this.phase==='shop'&&this.offers.length&&this.offers.every(o=>o.status==='purchased')?0:rerollPrice(this.wave,this.refreshCount);}
  refreshShop(){if(this.phase!=='shop'||this.challenge||this.coins<this.refreshPrice)return false;this.coins-=this.refreshPrice;this.refreshCount++;this.shopRerolls=(this.shopRerolls||0)+1;this.newUnlocks.push(...this.progression.record({bestRerolls:this.shopRerolls}));this.makeOffers();return true;}
  toggleLock(index){const o=this.offers[index];if(this.phase!=='shop'||this.challenge||o?.status!=='available')return false;o.locked=!o.locked;return true;}
  canBuy(offer){
    if(!offer||!this.progression.available(offer)||offer.status!=='available'||this.coins<offer.price)return false;
    if(offer.kind==='weapon')return this.weapons.length<this.maxWeapons||offer.tier<4&&this.weapons.some(w=>canCombine(weaponInstance(w),weaponInstance(offer)));
    return this.canOwnItem(offer);
  }
  beginPurchase(index){if(this.phase!=='shop'||this.challenge||!this.canBuy(this.offers[index]))return false;const offer=this.offers[index];this.challenge={index,word:offer.word,answer:offer.answer};return true;}
  cancelPurchase(){this.challenge=null;}
  spell(proposed) {
    if(!this.challenge)return {status:'idle'};
    return this.evaluateSpelling(resolve(this.challenge.word.english,this.challenge.answer,proposed));
  }
  evaluateSpelling(next) {
    const attempt=this.challenge,offer=this.offers[attempt.index];
    attempt.answer=next;offer.answer=next;
    const wrong=mismatch(attempt.word.english,next);
    const complete=next.length===attempt.word.english.length&&wrong<0;
    if(complete&&(!this.canBuy(offer))) {
      this.challenge=null;return {status:'unavailable'};
    }
    // Credit each matching letter position once across corrections and reopening.
    // Separators are supplied by the shared spelling logic, never earned letters.
    const expected=[...attempt.word.english.toLowerCase()],rewarded=new Set(offer.rewardedLetters||[]),letters=[];
    [...next.toLowerCase()].forEach((char,index)=>{
      if(!fixed(char)&&char===expected[index]&&!rewarded.has(index)){rewarded.add(index);letters.push(index);}
    });
    offer.rewardedLetters=[...rewarded];
    const rebate=complete?Math.ceil(offer.price/10):Math.ceil(offer.price*rewarded.size/(10*expected.length));
    const earned=Math.max(0,rebate-(offer.rebate||0));
    offer.rebate=(offer.rebate||0)+earned;this.coins+=earned;
    if(complete) {
      // Commit once, and only after a correct complete answer.
      this.coins-=offer.price;offer.status='purchased';this.correct++;
      this.apply(offer);this.recordAchievements({totalPurchases:1});this.review.push({...attempt.word,result:'correct'});this.challenge=null;
      this.pendingExperience.push({id:offer.experienceID||(offer.experienceID=this.idFactory()),action:'word',tier:0,cost:0,amount:CORRECT_WORD_EXPERIENCE,offerIndex:attempt.index});
      return {status:'purchased',offer,answer:next,letters,earned,rebate:offer.rebate};
    }
    return {status:wrong>=0?'retry':'typing',answer:next,mismatch:wrong,letters,earned,rebate:offer.rebate};
  }
  requestExperienceSkip() {
    if(!this.challenge)return null;
    const index=this.challenge.index,offer=this.offers[index],cost=skipExperienceCost(offer?.tier||1);
    if(!cost||!this.canBuy(offer))return null;
    const existing=this.pendingExperience.find(e=>e.action==='spend'&&e.offerIndex===index);
    if(existing)return existing;
    const event={id:offer.skipExperienceID||(offer.skipExperienceID=this.idFactory()),action:'spend',tier:offer.tier||1,cost,amount:-cost,offerIndex:index};
    this.pendingExperience.push(event);return event;
  }
  settleExperience(id,status) {
    const index=this.pendingExperience.findIndex(e=>e.id===id);if(index<0)return {status:'idle'};
    const event=this.pendingExperience[index];
    if(event.action==='word'||event.action==='wave'){
      if(status==='accepted'||status==='invalid')this.pendingExperience.splice(index,1);
      return {status:status==='accepted'?'earned':status,event};
    }
    if(status!=='accepted'){
      if(status==='insufficient'||status==='invalid')this.pendingExperience.splice(index,1);
      return {status,event};
    }
    const offer=this.offers[event.offerIndex];
    if(!this.challenge||this.challenge.index!==event.offerIndex||!this.canBuy(offer))return {status:'pending',event};
    this.coins-=offer.price;offer.status='purchased';this.apply(offer);this.recordAchievements({totalPurchases:1});this.challenge=null;this.pendingExperience.splice(index,1);
    return {status:'purchased',event,offer};
  }
  // A full tile draft is judged automatically by the UI, without the incremental
  // correction lock. One complete submission settles the purchase and closes the
  // attempt either way.
  submitSpelling(proposed) {
    if(!this.challenge)return {status:'idle'};
    const attempt=this.challenge,offer=this.offers[attempt.index];
    const expected=attempt.word.english,next=align(expected,proposed);
    const letterCount=value=>[...value].filter(char=>!fixed(char)).length;
    if(letterCount(proposed)!==letterCount(expected)||next.length!==expected.length)return {status:'incomplete',answer:attempt.answer};
    // Re-check the offer before judging: a stale, unaffordable or out-of-capacity
    // offer must not charge or rebate anything.
    if(!this.canBuy(offer)){this.challenge=null;return {status:'unavailable'};}
    const result=this.evaluateSpelling(next);
    if(result.status==='purchased')return result;
    // A complete but incorrect draft ends the attempt: charge once, record a failed
    // purchase, keep the proportional rebate already credited and clear the challenge.
    this.coins-=offer.price;offer.status='failed';this.failed++;
    this.review.push({...attempt.word,result:'unknown'});this.challenge=null;
    return {...result,status:'failed',offer,answer:next};
  }
  unknown() {
    if(!this.challenge)return null;
    const attempt=this.challenge,offer=this.offers[attempt.index];
    offer.status='failed';this.failed++;this.review.push({...attempt.word,result:'unknown'});this.challenge=null;
    return attempt.word;
  }
  apply(offer){
    if(!offer||!this.progression.available(offer))return false;
    if(offer.kind==='weapon'){
      const instance={id:offer.id,tier:offer.tier||1};
      if(this.weapons.length>=this.maxWeapons){const index=this.weapons.findIndex(w=>canCombine(weaponInstance(w),instance));if(index<0)return false;this.weapons[index]={...instance,tier:instance.tier+1};this.recordAchievements({totalCombines:1});}
      else this.weapons.push(instance);
      this.refreshStats();return true;
    }
    if(!this.canOwnItem(offer))return false;
    this.inventory.push(offer);
    if(offer.effects)this.addEffects(offer.effects.filter(e=>!e.custom_key));
    else switch(offer.id){
      case 'damage':this.player.damage+=3;break;
      case 'health':this.baseStats.stat_max_hp+=8;break;
      case 'speed':this.baseStats.stat_speed=(this.baseStats.stat_speed||0)+12;break;
      case 'armor':this.baseStats.stat_armor=(this.baseStats.stat_armor||0)+2;break;
      case 'magnet':this.player.magnet+=40;break;
      case 'haste':this.baseStats.stat_attack_speed=(this.baseStats.stat_attack_speed||0)+15;break;
      case 'regen':this.player.regen+=.5;break;
    }
    this.refreshStats();return true;
  }
  combineWeapon(index){
    if(this.phase!=='shop'||this.challenge)return false;const a=weaponInstance(this.weapons[index]||{});
    const other=this.weapons.findIndex((w,i)=>i!==index&&canCombine(a,weaponInstance(w)));
    if(other<0||!weapon(a.id,a.tier+1))return false;
    this.weapons[index]={id:a.id,tier:a.tier+1};this.weapons.splice(other,1);this.attackTimers=[];this.refreshStats();this.recordAchievements({totalCombines:1});return true;
  }
  recycleWeapon(index){
    if(this.phase!=='shop'||this.challenge||!this.weapons[index])return false;
    const w=weapon(this.weapons[index]);if(!w)return false;
    this.coins+=recyclePrice(w.basePrice,this.wave,this.stats.items_price||0);this.weapons.splice(index,1);this.attackTimers=[];this.recycledWeapons++;this.newUnlocks.push(...this.progression.record({bestRecycles:this.recycledWeapons}));this.refreshStats();return true;
  }
  spawn(id=null,{x,y,boss=false,neutral=false,warning=true}={}){
    id=id||'baby_alien';const data=enemies.find(e=>e.id===id);if(!data)return;
    const cap=Math.min(waves[Math.max(0,this.wave-1)].maxEnemies,openingProfile(this.wave)?.maxEnemies||Infinity);
    if(this.enemies.length>=cap){if(!boss)return;const index=this.enemies.findIndex(e=>!e.boss&&!e.neutral);if(index<0)return;this.enemies.splice(index,1);}
    const size=boss?36:neutral?20:['bruiser','horned_bruiser','pursuer','helmet_alien','buffer','spawner'].includes(id)?22:['chaser','charger','horned_charger','junkie'].includes(id)?12:15;
    if(x===undefined){
      const point=spawnPosition(this.width,this.height,this.player,this.enemies,size,this.random);
      if(!point)return;({x,y}=point);
    }
    const growth=enemyGrowth(data.stats,Math.max(1,this.wave));
    const e={id,x,y,type:size>=22?'tank':size<=12?'runner':'blob',r:size,...growth,maxHP:growth.hp,
      speed:Math.max(0,data.stats.speed+(this.random()*2-1)*(data.stats.speed_randomization||0))*overrides.worldScale*overrides.enemyMoveMultiplier,
      data:data.stats,hit:0,neutral:neutral||id==='tree',boss,warning:warning&&!neutral&&id!=='tree'?overrides.spawnWarning:0,timer:2+this.random(),age:0,charge:0,chargeWarmup:0,animation:'Idle',animationTime:0};
    if(e.neutral){e.damage=0;e.speed=0;}
    this.enemies.push(e);return e;
  }
  spawnGroups(){
    for(const group of this.groups){
      if(this.elapsed<group.next||group.count>group.repeating)continue;
      if(this.random()<group.spawn_chance){
        if(group.is_boss&&!this.spawn(this.random()<.5?'predator':'invoker',{boss:true})){group.next=this.elapsed+.25;continue;}
        for(const u of group.units)if(this.random()<u.spawn_chance){
          const count=u.min_number+Math.floor(this.random()*(u.max_number-u.min_number+1));
          for(let i=0;i<count;i++)this.spawn(u.enemy,{neutral:group.is_neutral});
        }
      }
      group.count++;group.next+=Math.max(group.min_repeating_interval,group.repeating_interval-group.reduce_repeating_interval*(group.count-1));
      if(group.count>group.repeating)group.next=Infinity;
    }
  }
  shootEnemy(enemy,count=1){
    const angle=Math.atan2(this.player.y-enemy.y,this.player.x-enemy.x);
    for(let i=0;i<count&&this.enemyBullets.length<180;i++){
      const a=count>1?angle+i*Math.PI*2/count:angle;this.enemyBullets.push({x:enemy.x,y:enemy.y,dx:Math.cos(a)*overrides.enemyBulletSpeed,dy:Math.sin(a)*overrides.enemyBulletSpeed,life:5,damage:enemy.damage,r:5});
    }
  }
  hitPlayer(damage){
    const p=this.player;if(p.hp<=0||p.invulnerable>0)return;
    p.invulnerable=overrides.playerInvulnerability;
    if(this.random()<clamp((this.stats.stat_dodge||0)/100,0,.6)){this.burst(p.x,p.y,'#c4f3fb',4);return;}
    p.hp=Math.max(0,p.hp-damageTaken(damage,p.armor));p.hit=.15;this.burst(p.x,p.y,'#ed8974',8);
  }
  healPlayer(amount){
    const p=this.player;if(p.hp<=0||this.phase!=='battle')return 0;
    const healed=Math.min(p.maxHP-p.hp,Math.max(0,amount));p.hp+=healed;
    if(healed>0){this.healingThisWave+=healed;this.newUnlocks.push(...this.progression.recordHealing(this.healingThisWave));}return healed;
  }
  hitEnemy(enemy,damage,w,critical=false,owner=null){
    if(enemy.hp<=0)return;const dealt=Math.max(1,Math.round(damage)-(enemy.armor||0));enemy.hp-=dealt;enemy.hit=.13;cueAnimation(enemy,enemy.hp<=0?'Death':'Hurt');
    const lane=this.damageNumberSequence++%5-2,duration=combatVisuals.damageNumber.duration;
    this.damageNumbers.push({value:dealt,critical:!!critical,x:clamp(enemy.x+lane*3,28,this.width-28),y:clamp(enemy.y-enemy.r*.7,48,this.height-20),driftX:lane*1.5,life:duration,duration});
    if(this.damageNumbers.length>combatVisuals.damageNumber.limit)this.damageNumbers.shift();
    if(w){
      this.inflictBurn(enemy,w,owner);
      const p=this.player,d=Math.max(1,distance(enemy,p)),knock=(w.stats.knockback||0)*(1-(enemy.data?.knockback_resistance||0))*overrides.worldScale;
      enemy.x=clamp(enemy.x+(enemy.x-p.x)/d*knock,enemy.r,this.width-enemy.r);enemy.y=clamp(enemy.y+(enemy.y-p.y)/d*knock,enemy.r,this.height-enemy.r);
      if(p.hp>0&&this.lifestealTimer<=0&&this.random()<clamp((this.stats.stat_lifesteal||0)/100+(w.stats.lifesteal||0),0,1)){this.healPlayer(1);this.lifestealTimer=.1;}
    }
    this.burst(enemy.x,enemy.y,critical?'#f4e5b2':'#e8d78b',3);
    if(enemy.hp<=0&&!enemy.neutral&&owner!==null){
      this.weaponKillCounts[owner]=(this.weaponKillCounts[owner]||0)+1;
      const growth=specialEffect(w||weapon(this.weapons[owner]),'effect_gain_stat_every_killed_enemies');
      if(growth&&this.weaponKillCounts[owner]%growth.value===0){this.addEffects([{key:growth.stat,value:growth.stat_nb}],false);this.refreshStats();}
    }
  }
  inflictBurn(enemy,w,owner){
    if(enemy.hp<=0||enemy.warning>0)return;
    const source=w.effects.find(e=>e.burnData&&!e.burnData.is_global_burn)?.burnData;
    const sausages=this.inventory.filter(i=>i.id==='scared_sausage').length;
    if(!source&&(!sausages||this.random()>=Math.min(1,sausages*.25)))return;
    const base=source?source.damage+sausages:sausages,duration=source?.duration||3;
    const damage=Math.max(1,Math.round((base+(this.stats.stat_elemental_damage||0))*Math.max(0,1+(this.stats.stat_percent_damage||0)/100)));
    const old=enemy.burn,remaining=Math.max(duration,old?.remaining||0);
    enemy.burn={damage:Math.max(damage,old?.damage||0),remaining,timer:old?.timer??1,owner:damage>=(old?.damage||0)?owner:old.owner,
      budget:{remaining:(this.stats.burning_spread||0)+(source?.spread||0)}};
  }
  updateBurns(dt){
    for(const e of this.enemies){const burn=e.burn;if(!burn||e.hp<=0||e.warning>0)continue;
      if(burn.budget.remaining>0)for(const next of this.enemies){
        if(!burn.budget.remaining)break;
        if(next!==e&&next.hp>0&&next.warning<=0&&!next.burn&&distance(e,next)<=128*overrides.worldScale+next.r){next.burn={...burn};burn.budget.remaining--;}
      }
      burn.timer-=dt;
      if(burn.timer<=0){this.hitEnemy(e,burn.damage,null,false,burn.owner);burn.timer+=1;burn.remaining--;this.burst(e.x,e.y,'#e69d4a',3);}
      if(burn.remaining<=0)e.burn=null;
    }
  }
  slowProjectilesOnHit(enemy,w,owner){
    const effect=specialEffect(w,'EFFECT_SLOW_PROJECTILES_ON_HIT');if(!effect)return;
    const stats=effect.projectileStats,projectile={...w,stats,effects:[]},angle=this.random()*Math.PI*2;
    for(let i=0;i<effect.value&&this.bullets.length<overrides.projectileLimit;i++){
      const a=angle+i*Math.PI*2/effect.value,speed=stats.projectile_speed*overrides.worldScale,range=stats.max_range*overrides.worldScale;
      const critical=this.random()<clamp(stats.crit_chance+(this.stats.stat_crit_chance||0)/100,0,1);
      this.bullets.push({x:enemy.x,y:enemy.y,dx:Math.cos(a)*speed,dy:Math.sin(a)*speed,damage:weaponDamage(projectile,this.stats)*(critical?stats.crit_damage:1),remaining:range,life:range/speed,w:projectile,owner,critical,piercing:stats.piercing,bounce:stats.bounce,hits:new Set([enemy]),lightning:true});
    }
  }
  lightningOnHit(enemy,w,owner){
    const effect=specialEffect(w,'effect_lightning_on_hit');if(!effect||this.bullets.length>=overrides.projectileLimit)return;
    const targets=this.enemies.filter(e=>e!==enemy&&e.hp>0&&e.warning<=0&&!e.neutral);if(!targets.length)return;
    const target=pick(targets,this.random),stats=effect.projectileStats,projectile={...w,stats,effects:[]};
    const d=Math.max(1,distance(target,enemy)),speed=stats.projectile_speed*overrides.worldScale;
    const critical=this.random()<clamp(stats.crit_chance+(this.stats.stat_crit_chance||0)/100,0,1);
    const range=stats.max_range*overrides.worldScale;
    this.bullets.push({x:enemy.x,y:enemy.y,dx:(target.x-enemy.x)/d*speed,dy:(target.y-enemy.y)/d*speed,
      damage:weaponDamage(projectile,this.stats)*(critical?stats.crit_damage:1),remaining:range,life:range/speed,w:projectile,owner,critical,
      piercing:stats.piercing,bounce:stats.bounce,hits:new Set([enemy]),lightning:true});
  }
  explodeOnHit(enemy,b){
    const effect=b.w.effects.find(e=>e.key==='effect_explode'||e.key==='effect_explode_custom'||e.key==='effect_explode_melee');
    if(!effect||this.random()>=effect.chance)return;
    const radius=effect.explosionRadius*effect.scale*overrides.worldScale*Math.max(.1,1+(this.stats.explosion_size||0)/100);
    const damage=b.damage*Math.max(0,1+(this.stats.explosion_damage||0)/100);
    const duration=combatVisuals.explosion.flashSeconds+combatVisuals.explosion.smokeSeconds;
    this.explosions.push({x:enemy.x,y:enemy.y,radius,life:duration,duration,effectScale:effect.scale,sizeMultiplier:Math.max(.1,1+(this.stats.explosion_size||0)/100)});if(this.explosions.length>48)this.explosions.shift();
    this.queueAudio('explosion');
    // An explosive impact replaces direct damage with area damage. Each of the
    // four possible piercing hits can explode, without double-hitting its centre.
    for(const e of this.enemies)if(e.hp>0&&e.warning<=0&&distance(e,enemy)<=radius+e.r)this.hitEnemy(e,damage,b.w,b.critical,b.owner);
    return true;
  }
  damageFor(instance){
    const w=weapon(instance);if(!w)return 0;
    const stack=w.effects.find(e=>e.key==='EFFECT_WEAPON_STACK');
    return weaponDamage(w,this.stats,this.player.damage+(stack?stack.value*(this.weapons.filter(i=>weaponInstance(i).id===w.id).length-1):0));
  }
  attack(instance,index){
    const w=weapon(instance),p=this.player;if(!w)return;
    const range=Math.max(25,w.stats.max_range+(this.stats.stat_range||0)*(w.type==='melee'?.5:1))*overrides.worldScale;
    const targets=this.enemies.filter(e=>e.hp>0&&e.warning<=0&&distance(e,p)<=range+e.r);
    if(!targets.length)return false;
    const target=targets.reduce((a,b)=>distance(a,p)<distance(b,p)?a:b),pose=weaponPose(p,index,this.weapons.length,target,w.id),angle=pose.angle;
    this.weaponPoses[index]=pose;this.weaponKicks[index]=overrides.weaponRecoilSeconds;
    const critChance=clamp(w.stats.crit_chance+(this.stats.stat_crit_chance||0)/100,0,1),base=this.damageFor(instance);
    const beforeBullets=this.bullets.length;
    if(w.type==='melee'){
      this.queueAudio(weaponSound(w));this.sweep=.2;
      for(const e of targets){const dx=e.x-p.x,dy=e.y-p.y,along=dx*Math.cos(angle)+dy*Math.sin(angle),across=Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle));
        const hit=w.stats.attack_type===0?along>=-e.r&&across<=overrides.meleeThrustWidth+e.r:Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle)))<overrides.meleeSweepAngle/2;
        if(hit&&e.hp>0){const critical=this.random()<critChance,damage=base*(critical?w.stats.crit_damage:1);if(!this.explodeOnHit(e,{w,damage,critical,owner:index}))this.hitEnemy(e,damage,w,critical,index);this.lightningOnHit(e,w,index);this.slowProjectilesOnHit(e,w,index);}
      }
    }else{
      const count=w.stats.nb_projectiles||1;
      for(let i=0;i<count&&this.bullets.length<overrides.projectileLimit;i++){
        const spread=(i-(count-1)/2)*(w.stats.projectile_spread||0),a=angle+spread+(this.random()-.5)*(1-w.stats.accuracy)*.2;
        const critical=this.random()<critChance,speed=w.stats.projectile_speed*overrides.worldScale;
        this.bullets.push({x:pose.muzzle.x,y:pose.muzzle.y,dx:Math.cos(a)*speed,dy:Math.sin(a)*speed,damage:base*(critical?w.stats.crit_damage:1),remaining:range,
          life:range/speed,age:0,w,owner:index,critical,piercing:(w.stats.piercing||0)+(critical?w.effects.find(e=>e.key==='pierce_on_crit')?.value||0:0),bounce:w.stats.bounce||0,hits:new Set()});
      }
    }
    if(w.type==='ranged'&&this.bullets.length>beforeBullets)this.queueAudio(weaponSound(w));
    const speed=(this.stats.stat_attack_speed||0)+(this.character.id==='brawler'&&w.sets.includes('unarmed')?50:0)+(this.character.id==='doctor'&&w.sets.includes('medical')?200:0);
    this.attackTimers[index]=weaponInterval(w,speed);return true;
  }
  defeated(enemy){
    if(enemy.rewarded)return;enemy.rewarded=true;
    if(!enemy.neutral){const corpse={...enemy,animation:'Death',animationTime:0};this.corpses.push(corpse);if(this.corpses.length>32)this.corpses.shift();}
    if(!enemy.neutral){this.kills++;this.newUnlocks.push(...this.progression.record({}, {totalKills:1}));}
    else if(enemy.id==='tree')this.newUnlocks.push(...this.progression.record({}, {totalTrees:1}));
    const value=(enemy.data?.value??(enemy.type==='tank'?3:1))*(enemy.neutral?1:openingProfile(this.wave)?.materialMultiplier||1);
    if(value&&this.gems.length<overrides.materialLimit)this.gems.push({x:enemy.x,y:enemy.y,value});else if(value)this.materialBank+=value;
    const data=enemy.data||enemies.find(e=>e.id==='baby_alien').stats;
    if(this.heals.length<100&&data.can_drop_consumables&&(data.always_drop_consumables||this.random()<dropChance(data.base_drop_chance,this.stats.stat_luck||0))){
      const crate=enemy.boss?'legendary':this.random()<data.item_drop_chance?'crate':'fruit';
      this.heals.push({x:enemy.x,y:enemy.y,kind:crate});
    }
    if(['spawner','bloated_spawner'].includes(enemy.id))for(let i=0;i<3;i++)this.spawn('junkie',{x:enemy.x+(i-1)*15,y:enemy.y,warning:true});
    this.burst(enemy.x,enemy.y,'#aec892',7);
  }
  die(){if(['dying','lost','won'].includes(this.phase))return;this.recordAchievements({totalDeaths:1});this.player.hp=0;cueAnimation(this.player,'Death');this.phase='dying';this.deathTime=0;this.challenge=null;}
  update(dt,input={x:0,y:0}){
    dt=clamp(dt,0,.05);const p=this.player;
    for(const number of this.damageNumbers)number.life=Math.max(0,number.life-dt);this.damageNumbers=this.damageNumbers.filter(number=>number.life>0);
    if(this.phase==='dying'){advanceAnimation(p,dt);this.deathTime+=dt;if(this.deathTime>=overrides.playerDeathSeconds)this.phase='lost';return;}
    if(this.phase!=='battle')return;
    for(const corpse of this.corpses)advanceAnimation(corpse,dt);
    this.corpses=this.corpses.filter(c=>c.animationTime<overrides.corpseSeconds);
    this.elapsed+=dt;p.invulnerable=Math.max(0,p.invulnerable-dt);p.hit=Math.max(0,(p.hit||0)-dt);this.sweep=Math.max(0,this.sweep-dt);this.lifestealTimer=Math.max(0,this.lifestealTimer-dt);
    for(const explosion of this.explosions)explosion.life-=dt;this.explosions=this.explosions.filter(e=>e.life>0);
    const len=Math.hypot(input.x,input.y),scale=len>1?1/len:1,oldPlayerX=p.x,oldPlayerY=p.y;
    p.x=clamp(p.x+input.x*scale*p.speed*dt,p.r,this.width-p.r);p.y=clamp(p.y+input.y*scale*p.speed*dt,p.r,this.height-p.r);
    if(p.hp<=0){this.die();return;}
    advanceAnimation(p,dt,Math.hypot(p.x-oldPlayerX,p.y-oldPlayerY)>.001);
    this.healPlayer(p.regen*dt);this.regenTimer+=dt;
    if(Math.floor(this.elapsed/5)!==Math.floor((this.elapsed-dt)/5)&&this.inventory.some(i=>i.id==='medikit'))this.refreshStats();
    const regen=regenInterval(this.stats.stat_hp_regeneration||0);while(this.regenTimer>=regen){this.healPlayer(this.character.id==='doctor'?2:1);this.regenTimer-=regen;}
    this.updateBurns(dt);
    this.spawnGroups();
    if(this.elapsed>=this.treeTimer){this.spawn('tree',{x:30+this.random()*(this.width-60),y:30+this.random()*(this.height-60),neutral:true});this.treeTimer+=overrides.treeEverySeconds;}
    for(const e of this.enemies){
      const wasWarning=e.warning>0;
      e.warning=Math.max(0,(e.warning||0)-dt);e.hit=Math.max(0,e.hit-dt);if(wasWarning||e.hp<=0)continue;
      e.age=(e.age||0)+dt;e.timer=(e.timer??2)-dt;
      if(e.neutral)continue;
      const d=Math.max(.1,distance(e,p)),oldX=e.x,oldY=e.y;let speed=e.speed;
      if(e.id==='pursuer')speed*=Math.min(3,1+e.age/10);
      speed=Math.min(speed,p.speed*overrides.maxEnemyChaseRatio);
      if(['charger','horned_charger','predator'].includes(e.id)){
        if(e.timer<=0){e.chargeWarmup=overrides.chargeWarmup;e.aim={x:(p.x-e.x)/d,y:(p.y-e.y)/d};e.timer=overrides.chargeWait;}
        if(e.chargeWarmup>0){e.chargeWarmup=Math.max(0,e.chargeWarmup-dt);if(e.chargeWarmup===0){e.charge=overrides.chargeSeconds;cueAnimation(e,'Attack');}speed=0;}
        else if(e.charge>0){e.charge-=dt;e.x+=e.aim.x*speed*overrides.chargeSpeedMultiplier*dt;e.y+=e.aim.y*speed*overrides.chargeSpeedMultiplier*dt;speed=0;}
      }
      const shooting=e.id?.includes('spitter')||e.id==='invoker';
      if(shooting&&e.timer<=0){this.shootEnemy(e,e.boss?overrides.bossBulletCount:1);cueAnimation(e,'Attack');e.timer=e.boss?overrides.bossShotSeconds:overrides.enemyShotSeconds;}
      if(!shooting||d>150){e.x+=(p.x-e.x)/d*speed*dt;e.y+=(p.y-e.y)/d*speed*dt;}
      e.x=clamp(e.x,e.r,this.width-e.r);e.y=clamp(e.y,e.r,this.height-e.r);
      if(d<e.r+p.r){cueAnimation(e,'Attack');this.hitPlayer(e.damage||1);}
      advanceAnimation(e,dt,Math.hypot(e.x-oldX,e.y-oldY)>.001,clamp(e.speed/100,.6,1.4));
    }
    if(p.hp<=0){this.die();return;}
    this.weaponPoses=this.weapons.map((instance,i)=>{
      this.weaponKicks[i]=Math.max(0,(this.weaponKicks[i]||0)-dt);
      const w=weapon(instance),range=Math.max(25,w.stats.max_range+(this.stats.stat_range||0)*(w.type==='melee'?.5:1))*overrides.worldScale;
      const targets=this.enemies.filter(e=>e.hp>0&&e.warning<=0&&distance(e,p)<=range+e.r);
      const target=targets.length?targets.reduce((a,b)=>distance(a,p)<distance(b,p)?a:b):null;
      const desired=weaponPose(p,i,this.weapons.length,target,w.id);
      const previous=this.weaponPoses[i]||weaponPose(p,i,this.weapons.length,null,w.id);
      return aimWeapon(p,desired,previous,dt);
    });
    this.weapons.forEach((w,i)=>{this.attackTimers[i]=(this.attackTimers[i]??0)-dt;if(this.attackTimers[i]<=0&&this.weaponPoses[i].aligned)this.attack(w,i);});
    for(const b of this.bullets){
      b.age=(b.age||0)+dt;
      const ox=b.x,oy=b.y,travel=Math.min(dt,b.remaining/Math.hypot(b.dx,b.dy));b.x+=b.dx*travel;b.y+=b.dy*travel;b.remaining-=Math.hypot(b.dx,b.dy)*travel;
      for(const e of this.enemies){
        if(e.hp<=0||e.warning>0||b.life<=0||b.hits.has(e))continue;
        const dx=b.x-ox,dy=b.y-oy,denom=dx*dx+dy*dy,t=denom?clamp(((e.x-ox)*dx+(e.y-oy)*dy)/denom,0,1):0;
        if((e.x-ox-t*dx)**2+(e.y-oy-t*dy)**2>(e.r+4)**2)continue;
        b.hits.add(e);if(!this.explodeOnHit(e,b))this.hitEnemy(e,b.damage,b.w,b.critical,b.owner??null);
        if(b.bounce>0){const targets=this.enemies.filter(next=>next.hp>0&&next.warning<=0&&!next.neutral&&!b.hits.has(next));const next=targets.length?(b.lightning?pick(targets,this.random):targets.reduce((a,c)=>distance(a,e)<distance(c,e)?a:c)):null;
          if(next){const d=Math.max(1,distance(next,e)),speed=Math.hypot(b.dx,b.dy);b.x=e.x;b.y=e.y;b.dx=(next.x-e.x)/d*speed;b.dy=(next.y-e.y)/d*speed;b.bounce--;b.damage*=1-b.w.stats.bounce_dmg_reduction;b.remaining=Math.max(b.remaining,d);b.life=Math.max(b.life,d/speed);break;}
        }
        if(b.piercing>0){b.piercing--;b.damage=Math.max(1,b.damage*(1-b.w.stats.piercing_dmg_reduction));}else{b.life=0;break;}
      }
      b.life-=dt;
    }
    this.bullets=this.bullets.filter(b=>b.life>0&&b.remaining>0);
    for(const b of this.enemyBullets){b.x+=b.dx*dt;b.y+=b.dy*dt;b.life-=dt;if(distance(b,p)<p.r+b.r){this.hitPlayer(b.damage);b.life=0;}}
    this.enemyBullets=this.enemyBullets.filter(b=>b.life>0&&b.x>-20&&b.x<this.width+20&&b.y>-20&&b.y<this.height+20);
    if(p.hp<=0){this.die();return;}
    const dead=this.enemies.filter(e=>e.hp<=0);this.enemies=this.enemies.filter(e=>e.hp>0);for(const e of dead)this.defeated(e);
    this.gems=this.gems.filter(g=>{
      const d=distance(g,p),alreadyAttracted=Number.isFinite(g.attractTime);
      if(d<p.magnet||alreadyAttracted){
        // Once a material enters the attraction radius it keeps chasing the
        // player. It must visibly travel into the player for a short beat
        // before settlement, instead of disappearing at the old 22px edge.
        g.attractTime=Math.max(0,alreadyAttracted?g.attractTime:0)+dt;
        g.trailX=g.x;g.trailY=g.y;
        if(d>0){
          const ramp=.9+.35*Math.min(1,g.attractTime/overrides.materialAbsorbSeconds);
          const step=Math.min(d,overrides.materialAttractionSpeed*ramp*dt);
          g.x+=(p.x-g.x)/d*step;g.y+=(p.y-g.y)/d*step;
        }
        if(distance(g,p)<=overrides.materialPickupDistance&&g.attractTime>=overrides.materialAbsorbSeconds){
          const extra=Math.min(this.materialBank,g.value);this.materialBank-=extra;this.coins+=g.value+extra;
          this.newUnlocks.push(...this.progression.collectMaterials(g.value+extra));this.gainXP(g.value+extra);this.recordAchievements();return false;
        }
      }
      return true;
    });
    this.heals=this.heals.filter(h=>{
      if(h.kind==='fruit'){
        if(p.hp>=p.maxHP)return true;
        const d=distance(h,p);if(d<p.magnet){h.x+=(p.x-h.x)*Math.min(1,dt*10);h.y+=(p.y-h.y)*Math.min(1,dt*10);}
      }
      if(distance(h,p)>p.r+12)return true;
      this.healPlayer((h.kind==='legendary'?100:overrides.pickupHealing)+(this.stats.consumable_heal||0));
      if(h.kind!=='fruit')this.crates.push(h.kind);this.healPickups++;this.recordAchievements();this.burst(p.x,p.y,'#b1eaba',12);return false;
    });
    for(const s of this.particles){s.x+=s.dx*dt;s.y+=s.dy*dt;s.life-=dt;}this.particles=this.particles.filter(s=>s.life>0);
    if(p.hp<=0){this.die();}
    else if(this.elapsed>=this.duration||(this.wave===20&&this.elapsed>2&&!this.enemies.some(e=>e.boss)&&this.groups.some(g=>g.is_boss&&g.count>0)))this.enterShop();
  }
  burst(x,y,color,count){for(let i=0;i<count&&this.particles.length<120;i++){const a=this.random()*Math.PI*2,s=25+this.random()*70;this.particles.push({x,y,dx:Math.cos(a)*s,dy:Math.sin(a)*s,color,life:.2+this.random()*.3});}}
}
