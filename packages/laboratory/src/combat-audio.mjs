// Maps a content weapon object (the same instance the engine attacks with) to
// one of the procedural LabSound combat effects. Unknown/malformed weapons are
// silent so the renderer can call this unconditionally.
const WEAPON_SOUNDS={
  lightning_shiv:'magic-shot',
  wand:'magic-shot',
  laser:'laser-shot',
  shredder:'cannon',
  smg:'rapid-shot',
  minigun:'rapid-shot',
};

export function weaponSound(weapon){
  if(!weapon||typeof weapon!=='object')return null;
  const mapped=WEAPON_SOUNDS[weapon.id];
  if(mapped)return mapped;
  if(weapon.type==='melee')return 'melee-swing';
  if(weapon.type==='ranged')return 'shot';
  return null;
}
