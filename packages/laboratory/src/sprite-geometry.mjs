// Mouth/tip centres measured in the existing 362px item atlas cells. These
// describe the original drawings, so rotating a gun also rotates its muzzle.
const tips={wand:{x:326,y:181},medical_gun:{x:338,y:191},thunder_sword:{x:345,y:195},chopper:{x:339,y:185},power_fist:{x:327,y:181},pea:{x:305,y:92},scatter:{x:296,y:93},fork:{x:276,y:30},
  smg:{x:344,y:145},knife:{x:350,y:197},stick:{x:344,y:125},fist:{x:344,y:190},
  slingshot:{x:298,y:115},laser:{x:349,y:169},crossbow:{x:341,y:169},lightning_shiv:{x:349,y:178},
  shredder:{x:337,y:167},minigun:{x:337,y:171},ghost_axe:{x:340,y:180},ghost_flint:{x:348,y:180}};
export function weaponGeometry(id,size=28){
  const tip=tips[id];
  if(!tip)return {localAngle:0,muzzleDistance:14};
  const x=(tip.x/362-.5)*size,y=(tip.y/362-.5)*size;
  return {localAngle:Math.atan2(y,x),muzzleDistance:Math.hypot(x,y)};
}
