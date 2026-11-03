// Visual roles deliberately reuse the imported Brotato PC 1.1.15.4 units.
// Presentation can grow without introducing a second, drifting balance table.
export const enemyVisuals=Object.freeze({
  bile_spitter:Object.freeze({index:0,crop:Object.freeze([0,400]),rank:'normal',name:'胆汁喷吐者',ids:Object.freeze(['spitter','horned_spitter'])}),
  plague_moth:Object.freeze({index:1,crop:Object.freeze([400,790]),rank:'normal',name:'瘟疫飞蛾',ids:Object.freeze(['fly','horned_fly','fin_alien'])}),
  iron_butcher:Object.freeze({index:2,crop:Object.freeze([790,1270]),rank:'elite',name:'铁面屠夫',ids:Object.freeze(['bruiser','horned_bruiser','mad_slasher'])}),
  void_cultist:Object.freeze({index:3,crop:Object.freeze([1270,1615]),rank:'elite',name:'虚空祭司',ids:Object.freeze(['pursuer'])}),
  abyss_tyrant:Object.freeze({index:4,crop:Object.freeze([1615,2172]),rank:'boss',name:'深渊暴君',ids:Object.freeze(['predator','invoker'])}),
});

const visualByEnemy=new Map(Object.entries(enemyVisuals).flatMap(([key,visual])=>visual.ids.map(id=>[id,Object.freeze({key,...visual})])));

export function enemyVisual(id,boss=false){
  if(boss)return visualByEnemy.get(id)?.rank==='boss'?visualByEnemy.get(id):Object.freeze({key:'abyss_tyrant',...enemyVisuals.abyss_tyrant});
  return visualByEnemy.get(id)||null;
}
