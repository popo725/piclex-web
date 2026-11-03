import { overrides } from './data/prototype-overrides.mjs';
import { weaponGeometry } from './sprite-geometry.mjs';
// Put an aiming weapon on the target side of the player. Its barrel is always
// directed outwards, and both drawing and firing use this same muzzle point.
export function weaponPose(player,index,count,target=null,id='pea'){
  const angle=target?Math.atan2(target.y-player.y,target.x-player.x):index*Math.PI*2/Math.max(1,count);
  const fan=target?(index-(count-1)/2)*.18:0;
  const distance=target?Math.hypot(target.x-player.x,target.y-player.y):Infinity;
  // A nearby enemy can be inside the normal mount radius. Move the mount inwards
  // instead of turning the barrel back through the player to reach that enemy.
  const radius=target?Math.min(overrides.weaponOrbitRadius,Math.max(0,distance-target.r-10),distance*.5):overrides.weaponOrbitRadius;
  const x=player.x+Math.cos(angle+fan)*radius,y=player.y+Math.sin(angle+fan)*radius;
  const aim=target?Math.atan2(target.y-y,target.x-x):angle;
  const geometry=weaponGeometry(id);
  return {x,y,angle:aim,rotation:aim-geometry.localAngle,muzzle:{x:x+Math.cos(aim)*geometry.muzzleDistance,y:y+Math.sin(aim)*geometry.muzzleDistance}};
}
export function aimWeapon(player,desired,previous,dt){
  const oldAngle=previous.angle;
  const delta=Math.atan2(Math.sin(desired.angle-oldAngle),Math.cos(desired.angle-oldAngle));
  const step=Math.max(0,dt)*overrides.weaponAimSpeed;
  const aligned=Math.abs(delta)<=step+overrides.weaponAimTolerance;
  const angle=aligned?desired.angle:oldAngle+Math.sign(delta)*step;
  const radius=Math.hypot(desired.x-player.x,desired.y-player.y);
  const relative=Math.atan2(desired.y-player.y,desired.x-player.x)-desired.angle;
  const x=player.x+Math.cos(angle+relative)*radius,y=player.y+Math.sin(angle+relative)*radius;
  const muzzleDistance=Math.hypot(desired.muzzle.x-desired.x,desired.muzzle.y-desired.y);
  return {x,y,angle,rotation:angle+desired.rotation-desired.angle,aligned,
    muzzle:{x:x+Math.cos(angle)*muzzleDistance,y:y+Math.sin(angle)*muzzleDistance}};
}
