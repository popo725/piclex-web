import achievementData from './data/achievement-content.mjs';
import weaponData from './data/weapons.mjs';
import itemData from './data/items.mjs';
import setData from './data/weaponSets.mjs';
import enemyData from './data/enemies.mjs';
import waveData from './data/waves.mjs';
import characterData from './data/characters.mjs';
import upgradeData from './data/upgrades.mjs';
import { engineerCharacter, engineeringWeapons, engineeringSet, legacyItems } from './data/prototype-overrides.mjs';
import { weaponInterval,weaponSpecialDescription } from './weapon-effects.mjs';

export const statNames={stat_max_hp:'生命上限',stat_percent_damage:'伤害%',stat_melee_damage:'近战伤害',stat_ranged_damage:'远程伤害',stat_elemental_damage:'元素伤害',stat_attack_speed:'攻速%',stat_crit_chance:'暴击%',stat_range:'射程',stat_armor:'护甲',stat_dodge:'闪避%',stat_hp_regeneration:'生命再生',stat_lifesteal:'吸血%',stat_speed:'移速%',stat_luck:'幸运',stat_harvesting:'收获',stat_engineering:'工程',explosion_size:'爆炸范围%',explosion_damage:'爆炸伤害%',consumable_heal:'拾取回血',items_price:'商店价格%',xp_gain:'经验获取%'};
export const tierColors=['','#ded3bc','#8fbcd6','#b78dcf','#ef8c76'];
export const tierNames=['','普通 I','优秀 II','稀有 III','传奇 IV'];
export function describeEffects(effects=[]){return effects.map(e=>e.burnData?`攻击有 ${Math.round(e.burnData.chance*100)}% 概率造成 ${e.burnData.duration} 次燃烧（每次 ${e.burnData.damage} +100%元素）`:e.key==='burning_spread'?`燃烧额外传播 ${e.value} 个敌人`:e.custom_key==='temp_stats_per_interval'?`每 ${e.interval} 秒临时增加 ${e.value} 生命再生，波次结束重置`:`${statNames[e.key]||e.key} ${e.value>0?'+':''}${e.value}`).join(' · ');}
export const weaponEntries=[...weaponData.entries,...achievementData.weapons.map(w=>({...w,stats:w.weaponstats})),...engineeringWeapons].map(w=>({...w,kind:'weapon',price:w.basePrice,color:tierColors[w.tier],detail:`${w.type==='melee'?'近战':'远程'} · 基础伤害 ${w.stats.damage} · ${Number(weaponInterval(w).toFixed(2))} 秒/次${w.stats.nb_projectiles>1?` · ${w.stats.nb_projectiles} 弹丸`:''}${w.stats.piercing?` · 穿透 ${w.stats.piercing}（每次伤害 −${Math.round(w.stats.piercing_dmg_reduction*100)}%）`:''}${w.stats.bounce?` · 反弹 ${w.stats.bounce}`:''}${weaponSpecialDescription(w)?` · ${weaponSpecialDescription(w)}`:''}`}));
export const itemEntries=[...[...itemData.entries,...achievementData.items.map(i=>({...i,limit:i.max_nb}))].map(i=>({...i,kind:'item',price:i.basePrice,color:tierColors[i.tier],detail:describeEffects(i.effects)})),...legacyItems];
export const catalog=[...weaponEntries.filter(w=>w.tier===1),...itemEntries];
export const weapon=(value,tier=1)=>{const id=typeof value==='string'?value:value.id;return weaponEntries.find(w=>w.id===id&&w.tier===(typeof value==='string'?tier:value.tier||1));};
export const weaponInstance=value=>typeof value==='string'?{id:value,tier:1}:value;
export const sets=[...setData.entries,...achievementData.sets,engineeringSet];
export const enemies=enemyData.entries;
export const waves=waveData.entries;
export const characters=[...characterData.entries,...achievementData.characters,engineerCharacter].map(c=>({...c,kind:'character'}));
// The shipped upgrade directory also contains unused older upgrades. Only active primary stats enter play.
export const upgrades=upgradeData.entries.filter(u=>u.effects.length&&u.effects.every(e=>statNames[e.key]&&e.key!=='stat_engineering'));

export function validateContent(){
  const errors=[],unique=(entries,key,label)=>{const seen=new Set();for(const e of entries){const id=key(e);if(seen.has(id))errors.push(`duplicate ${label}: ${id}`);seen.add(id);}};
  unique(weaponEntries,w=>`${w.id}:${w.tier}`,'weapon');unique(itemEntries,i=>i.id,'item');unique(enemies,e=>e.id,'enemy');unique(waves,w=>w.id,'wave');unique(characters,c=>c.id,'character');unique(sets,s=>s.id,'set');unique(upgrades,u=>u.id,'upgrade');
  const tier=t=>Number.isInteger(t)&&t>=1&&t<=4;
  const effects=(list,label)=>{for(const e of list||[])if(!e.key||!Number.isFinite(e.value))errors.push(`invalid effect ${label}`);};
  for(const w of weaponEntries){if(!tier(w.tier)||!Number.isFinite(w.basePrice)||w.basePrice<1||!Number.isFinite(w.stats.cooldown)||w.stats.cooldown<2||!Number.isFinite(w.stats.damage)||w.stats.damage<0||!Number.isFinite(w.stats.max_range)||w.stats.max_range<0)errors.push(`invalid weapon ${w.id}`);for(const s of w.sets)if(!sets.some(set=>set.id===s))errors.push(`missing set ${s}`);for(const [,n] of w.stats.scaling_stats)if(!Number.isFinite(n))errors.push(`invalid scaling ${w.id}`);effects(w.effects,w.id);}
  for(const item of itemEntries){if(!tier(item.tier)||item.basePrice<1||!Number.isFinite(item.basePrice)||!Number.isInteger(item.limit)||item.limit< -1)errors.push(`invalid item ${item.id}`);effects(item.effects,item.id);}
  for(const w of weaponEntries){
    if(!Number.isFinite(w.stats.recoil_duration)||w.stats.recoil_duration<0)errors.push(`invalid recoil ${w.id}`);
    for(const e of w.effects){
      if(e.projectileStats){const p=e.projectileStats;if(!Number.isFinite(p.damage)||p.damage<0||!Number.isInteger(p.bounce)||p.bounce<0||!Number.isFinite(p.projectile_speed)||p.projectile_speed<=0||!p.scaling_stats?.every(([key,value])=>statNames[key]&&Number.isFinite(value)))errors.push(`invalid projectile ${w.id}`);}
      if(e.key==='effect_gain_stat_every_killed_enemies'&&(!Number.isInteger(e.value)||e.value<=0||!statNames[e.stat]||!Number.isFinite(e.stat_nb)))errors.push(`invalid growth ${w.id}`);
      if(['effect_explode','effect_explode_custom','effect_explode_melee'].includes(e.key)&&(!Number.isFinite(e.chance)||e.chance<0||e.chance>1||!Number.isFinite(e.explosionRadius)||e.explosionRadius<=0||!Number.isFinite(e.scale)||e.scale<=0))errors.push(`invalid explosion ${w.id}`);
    }
  }
  for(const c of characters)effects(c.effects,c.id);
  for(const u of upgrades){if(!tier(u.tier))errors.push(`invalid upgrade ${u.id}`);effects(u.effects,u.id);}
  for(const s of sets){if(s.bonuses.length!==5)errors.push(`invalid set ${s.id}`);for(const bonus of s.bonuses)effects(bonus,s.id);}
  for(const e of enemies)if(!Number.isFinite(e.stats.health)||e.stats.health<=0||e.stats.speed<0||e.stats.base_drop_chance<0||e.stats.base_drop_chance>1)errors.push(`invalid enemy ${e.id}`);
  for(const wave of waves){if(!Number.isFinite(wave.duration)||wave.duration<=0||!Number.isInteger(wave.maxEnemies)||wave.maxEnemies<1)errors.push(`invalid wave ${wave.id}`);for(const g of [...wave.groups,...wave.conditionalGroups]){if(!Number.isFinite(g.spawn_chance)||g.spawn_chance<0||g.spawn_chance>1||!Number.isFinite(g.repeating_interval)||g.repeating_interval<0||g.repeating>0&&g.repeating_interval===0)errors.push(`invalid timing ${wave.id}`);for(const u of g.units)if(!enemies.some(e=>e.id===u.enemy)||!Number.isInteger(u.min_number)||!Number.isInteger(u.max_number)||u.min_number<0||u.max_number<u.min_number)errors.push(`invalid group ${wave.id}:${u.enemy}`);}}
  if(errors.length)throw new Error(errors.join('\n'));return true;
}
validateContent();
