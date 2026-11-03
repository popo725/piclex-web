// Shared by live wave checkpoints and persisted runs. External transactions and
// permanent achievements are deliberately handled separately during a retry.
export const runFields=('width height words wordOrder wordCursor phase wave coins kills level xp materialBank correct failed review inventory weapons maxWeapons baseStats stats setCounts player enemies corpses weaponPoses weaponKicks weaponKillCounts explosions bullets enemyBullets gems heals particles offers challenge pendingExperience elapsed spawnTimer groups attackTimers sweep refreshCount message pendingUpgrades upgradeOffers crates lootOffer healPickups regenTimer lifestealTimer healingThisWave duration treeTimer clockSecond recycledWeapons shopRerolls').split(' ');
export function runState(game){
  const state={characterID:game.character.id};
  for(const key of runFields)if(game[key]!==undefined)state[key]=game[key];
  return state;
}
