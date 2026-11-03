// Observed numerical/animation settings from the user's PC 1.1.15.4 resources.
// Original game textures are inspected locally, never shipped; our atlas is image_gen art.
export const combatVisuals={
  sourceVersion:'PC 1.1.15.4',verification:'read-local-scenes-and-texture-metadata',
  laser:{resourcePath:'res://projectiles/bullet_laser/bullet_laser.tscn',sourceSpriteSize:120,startupSeconds:.02,animationSeconds:.1,hitboxOffset:23,pulseBounds:[6,43,110,79],startupBounds:[12,15,107,111]},
  shredder:{resourcePath:'res://projectiles/bullet_shredder/bullet_shredder.tscn',sourceSpriteSize:120,startupSeconds:.02,pulseBounds:[21,29,101,92]},
  explosion:{resourcePath:'res://projectiles/explosion.tscn',flashSeconds:.05,smokeResourcePath:'res://particles/explosion_smoke.tscn',smokeSeconds:.75,smokeAmount:10,smokeEmissionRadius:128,smokeVelocity:30,smokeSpriteSize:64,smokeScale:.5},
  damageNumber:{duration:.72,rise:30,fadeStart:.58,popEnd:.16,settleEnd:.36,limit:96},
};
