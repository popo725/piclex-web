import { attackInterval } from './rules.mjs';
import { overrides } from './data/prototype-overrides.mjs';

// Published total melee intervals at zero attack speed/range, cross-checked
// against the matching PC 1.1.15.4 damage/cooldown tier resources. They include
// the travel animation; the raw cooldown remains separately imported.
export const meleeTimings={
  sourceVersion:'Brotato Wiki snapshots checked 2026-10-08; PC 1.1.15.4 stats',
  verification:'reference-cross-check',
  power_fist:{sourceUrl:'https://brotato.wiki.spellsandguns.com/Power_Fist',revision:4367,seconds:[null,null,.69,.59]},
  chopper:{sourceUrl:'https://brotato.wiki.spellsandguns.com/Chopper',revision:6791,seconds:[.99,.99,.96,.89]},
  thunder_sword:{sourceUrl:'https://brotato.wiki.spellsandguns.com/Thunder_Sword',revision:4375,seconds:[null,null,1.21,1.06]},
  stick:{sourceUrl:'https://brotato.wiki.spellsandguns.com/Stick',revision:6782,seconds:[1.29,1.22,1.15,1.09]},
  lightning_shiv:{sourceUrl:'https://brotato.wiki.spellsandguns.com/Lightning_Shiv',revision:6931,seconds:[1.01,.93,.86,.78]},
  ghost_axe:{sourceUrl:'https://brotato.wiki.spellsandguns.com/Ghost_Axe',revision:5599,seconds:[1.73,1.66,1.58,1.51]},
  ghost_flint:{sourceUrl:'https://brotato.wiki.spellsandguns.com/Ghost_Flint',revision:5597,seconds:[1.23,1.17,1.1,1.04]},
  wrench:{sourceUrl:'https://brotato.wiki.spellsandguns.com/Wrench',revision:4504,seconds:[1.7,1.64,1.55,1.49]},
};
export function weaponInterval(w,speed=0){
  const cooldown=attackInterval(w.stats.cooldown,speed);
  // Ranged recoil travels out and back; values come from each local resource.
  // SMG: 4/60 + 2*.05; Minigun: 3/60 + 2*.02; Shredder: 60/60 + 2*.15.
  if(w.type==='ranged')return cooldown+2*w.stats.recoil_duration;
  const reference=meleeTimings[w.id]?.seconds[w.tier-1];
  return cooldown+(reference?Math.max(0,reference-w.stats.cooldown/60):overrides.meleeAnimationSeconds);
}
export const specialEffect=(w,key)=>w?.effects.find(e=>e.key===key);
export function weaponSpecialDescription(w){
  const lightning=specialEffect(w,'effect_lightning_on_hit');
  const explosion=w.effects.find(e=>e.key==='effect_explode'||e.key==='effect_explode_custom'||e.key==='effect_explode_melee');
  const slow=specialEffect(w,'EFFECT_SLOW_PROJECTILES_ON_HIT'),burn=w.effects.find(e=>e.burnData)?.burnData;
  if(slow)return `命中释放 ${slow.value} 枚弹丸 · 伤害 ${slow.projectileStats.damage} +100%元素`;
  if(burn)return `燃烧 ${burn.duration} 次，每次 ${burn.damage} +100%元素`;
  const growth=specialEffect(w,'effect_gain_stat_every_killed_enemies');
  const stack=specialEffect(w,'EFFECT_WEAPON_STACK');
  if(lightning)return `命中释放闪电 · 元素伤害 ${lightning.projectileStats.damage} + ${Math.round(lightning.projectileStats.scaling_stats.find(([key])=>key==='stat_elemental_damage')?.[1]*100||0)}% 元素加成 · 弹射 ${lightning.projectileStats.bounce} 次`;
  if(explosion)return `${Math.round(explosion.chance*100)}% 命中爆炸${w.type==='melee'?'':' · 每次穿透均可触发'}`;
  if(growth)return `本武器每波击杀 ${growth.value} 个敌人，永久增加 ${growth.stat_nb}% ${growth.stat==='stat_attack_speed'?'攻速':'伤害'}`;
  if(stack)return `每多持有一根树枝，基础伤害 +${stack.value}`;
  return '';
}
