import { overrides } from './data/prototype-overrides.mjs';

// Keep world units independent from CSS pixels, including narrow/short phones.
// The whole arena remains visible; touch controls still use screen coordinates.
export function arenaViewport(width,height){
  width=Math.max(1,width);height=Math.max(1,height);
  const scale=Math.min(1,width/overrides.arenaMinWidth,height/overrides.arenaMinHeight);
  return {width:width/scale,height:height/scale,scale};
}
export function openingProfile(wave){return overrides.openingWaves.find(p=>p.wave===wave);}
export function prepareGroups(wave){
  const profile=openingProfile(wave.id);
  return wave.groups.filter(g=>g.min_difficulty<=0&&g.max_difficulty>=0).map(group=>{
    // Boss and neutral schedules keep their imported timing and population.
    const p=!group.is_boss&&!group.is_neutral&&profile;
    const multiplier=p?p.intervalScale:1;
    return {...group,next:Math.max(group.spawn_timing,p?p.firstSpawn:0),count:0,
      repeating_interval:group.repeating_interval*multiplier,
      reduce_repeating_interval:group.reduce_repeating_interval*multiplier,
      min_repeating_interval:group.min_repeating_interval*multiplier,
      units:group.units.map(unit=>({...unit,
        min_number:p&&unit.min_number>0?Math.max(1,Math.floor(unit.min_number*p.countScale)):unit.min_number,
        max_number:p&&unit.max_number>0?Math.max(1,Math.ceil(unit.max_number*p.countScale)):unit.max_number,
      })),
    };
  });
}
export function spawnPosition(width,height,player,enemies,r,random){
  const margin=Math.max(40,r+10),gap=overrides.spawnGap;
  const fits=p=>Math.hypot(p.x-player.x,p.y-player.y)>=overrides.spawnSafeDistance
    &&enemies.every(e=>e.hp<=0||Math.hypot(p.x-e.x,p.y-e.y)>=r+e.r+gap);
  for(let i=0;i<16;i++){
    const p={x:margin+random()*(width-margin*2),y:margin+random()*(height-margin*2)};
    if(fits(p))return p;
  }
  const grid=[];
  for(let row=0;row<5;row++)for(let col=0;col<5;col++)grid.push({x:margin+(width-2*margin)*col/4,y:margin+(height-2*margin)*row/4});
  grid.sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y));
  // A full area delays this spawn instead of stacking monsters or spawning on the player.
  return grid.find(fits)||null;
}
