import shop from './data/shop.mjs';
export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function weaponDamage(weapon,stats={},flatBonus=0){
  const flat=Math.max(1,weapon.stats.damage+flatBonus+weapon.stats.scaling_stats.reduce((sum,[key,scale])=>sum+(stats[key]||0)*scale,0));
  return Math.max(1,Math.round(flat*(1+(stats.stat_percent_damage||0)/100)));
}
// Stored cooldown, in seconds. Animation time is kept separate in prototype-overrides.
export function attackInterval(frames,speed=0){return Math.max(2,speed>=0?frames/(1+speed/100):frames*(1-speed/100))/60;}
export function armorMultiplier(armor){return armor>=0?15/(15+armor):2-15/(15-armor);}
export function damageTaken(hit,armor){return Math.max(1,Math.round(Math.round(hit)*armorMultiplier(armor)));}
export function shopPrice(base,wave,modifier=0){return Math.max(1,Math.floor((base+wave+base*shop.inflation*wave)*Math.max(.01,1+modifier/100)));}
export function rerollPrice(wave,count=0,discount=0){const step=Math.max(1,Math.floor(.4*wave));return Math.max(1,Math.ceil((Math.floor(.75*wave)+step*(1+count))*Math.max(.1,1-discount/100)));}
export function recyclePrice(base,wave,modifier=0){return Math.max(1,Math.floor(shopPrice(base,wave,modifier)*shop.recycleFraction));}
export function tierThresholds(wave,luck=0){const factor=luck>=0?1+luck/100:1/(1-luck/100);return shop.rarities.map(r=>({...r,chance:clamp((wave-r.start)*r.growth*factor,0,r.cap)}));}
export function rollTier(wave,luck,random){const roll=random();return tierThresholds(wave,luck).find(r=>roll<r.chance)?.tier||1;}
export function enemyGrowth(stats,wave){return {hp:Math.max(1,Math.round(stats.health+stats.health_increase_each_wave*(wave-1))),damage:Math.round(stats.damage+stats.damage_increase_each_wave*(wave-1)),armor:Math.round(stats.armor+stats.armor_increase_each_wave*(wave-1))};}
export function xpRequired(level){return (level+3)**2;}
export function regenInterval(value){return value>0?5/(1+Math.abs(value-1)/2.25):Infinity;}
export function dropChance(base,luck=0){return clamp(base*(1+luck/100),0,1);}
export function canCombine(a,b){return a.id===b.id&&a.tier===b.tier&&a.tier<4;}
export function seededRandom(seed=1){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
