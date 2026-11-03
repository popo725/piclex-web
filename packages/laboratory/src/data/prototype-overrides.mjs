// H5 adaptations and existing PicLex additions; these are NOT original Brotato values.
export const overrides={verification:'prototype',sourceVersion:'PicLex laboratory',
  worldScale:.38,baseSpeed:450,materialAttraction:96,materialAttractionSpeed:360,materialAbsorbSeconds:.14,materialPickupDistance:3,materialLimit:400,projectileLimit:320,
  arenaMinWidth:640,arenaMinHeight:480,playerRadius:12,playerSpriteSize:64,spawnSafeDistance:140,spawnGap:20,
  openingWaves:[
    {wave:1,countScale:.5,intervalScale:1.6,firstSpawn:3,maxEnemies:12,materialMultiplier:3},
    {wave:2,countScale:.6,intervalScale:1.45,firstSpawn:2.5,maxEnemies:16,materialMultiplier:2},
    {wave:3,countScale:.7,intervalScale:1.3,firstSpawn:2,maxEnemies:20,materialMultiplier:2},
    {wave:4,countScale:.8,intervalScale:1.2,firstSpawn:1.5,maxEnemies:26,materialMultiplier:1},
    {wave:5,countScale:.9,intervalScale:1.1,firstSpawn:1.2,maxEnemies:32,materialMultiplier:1},
  ],
  meleeThrustWidth:24,meleeSweepAngle:Math.PI*.9,spawnWarning:.65,
  thunderSwordRadialSpread:true, // Temporary H5 direction; original slowing curve remains unverified.
  rangedWindupFrames:12,meleeAnimationSeconds:.35,enemyShotSeconds:2.5,enemyBulletSpeed:210,
  enemyMoveMultiplier:.72,maxEnemyChaseRatio:.8,chargeWait:3.4,chargeSeconds:.4,chargeWarmup:.45,chargeSpeedMultiplier:1.75,
  weaponOrbitRadius:24,weaponMuzzleOffset:14,weaponAimSpeed:18,weaponAimTolerance:.08,weaponRecoilSeconds:.1,weaponRecoilDistance:3,corpseSeconds:.9,playerDeathSeconds:.9,
  bossShotSeconds:2.2,bossBulletCount:10,
  treeEverySeconds:15,treeFirstSeconds:3,
  pickupHealing:3,playerInvulnerability:.75,
};

// Engineer keeps the sourced character rules, while its Wrench uses
// Engineering as the direct H5 damage channel because structures are not part
// of the current laboratory combat model.
export const engineerCharacter={
  id:'engineer',name:'工程师',originalId:'character_engineer',kind:'character',unlockedByDefault:true,
  verification:'reference-cross-check+H5-adaptation',
  sourceUrl:'https://teemo.dev/game-design/brotato/wiki/characters/engineer/',
  effects:[
    {key:'stat_engineering',value:10,custom_key:'',custom_args:[],storage_method:0},
    {key:'effect_increase_stat_gains',value:25,custom_key:'',custom_args:[],storage_method:0,stats_modified:['stat_engineering']},
    {key:'effect_reduce_stat_gains',value:-50,custom_key:'',custom_args:[],storage_method:0,stats_modified:['stat_percent_damage']},
  ],
  resourcePath:'res://items/characters/engineer/engineer_data.tres',
};

const wrenchValues=[
  {damage:12,cooldown:67,basePrice:20},
  {damage:16,cooldown:63,basePrice:39},
  {damage:20,cooldown:58,basePrice:74},
  {damage:24,cooldown:54,basePrice:149},
];
export const engineeringWeapons=wrenchValues.map((value,index)=>({
  id:'wrench',name:'扳手',originalId:`weapon_wrench_${index+1}`,tier:index+1,type:'melee',
  basePrice:value.basePrice,unlockedByDefault:true,sets:['tool'],effects:[],
  verification:'reference-cross-check+H5-adaptation',
  resourcePath:`res://weapons/melee/wrench/${index+1}/${index?'wrench_'+(index+1):'wrench'}_data.tres`,
  stats:{cooldown:value.cooldown,damage:value.damage,accuracy:1,crit_chance:.03,crit_damage:2,min_range:0,max_range:175,knockback:20,knockback_piercing:0,recoil:25,recoil_duration:.1,scaling_stats:[['stat_engineering',1]],lifesteal:0,attack_type:1,deal_dmg_on_return:false},
}));

export const engineeringSet={
  id:'tool',verification:'reference-cross-check',
  sourceUrl:'https://teemo.dev/game-design/brotato/wiki/weapon-classes/tool/',
  bonuses:[1,2,3,4,5].map(value=>[{key:'stat_engineering',value,custom_key:'',custom_args:[],storage_method:0}]),
  resourcePath:'res://items/sets/tool/tool_set_data.tres',
};
export const legacyItems=[
  {id:'damage',name:'辣椒酱',kind:'item',detail:'基础伤害 +3',price:16,color:'#e77961',tier:1},
  {id:'health',name:'厚实外套',kind:'item',detail:'生命上限 +8，立即恢复 8',price:18,color:'#a7bbce',tier:1},
  {id:'speed',name:'轻快靴',kind:'item',detail:'移动速度 +12%',price:15,color:'#e4c986',tier:1},
  {id:'armor',name:'坚果盾',kind:'item',detail:'护甲 +2',price:20,color:'#c0a0d4',tier:1},
  {id:'magnet',name:'口袋磁铁',kind:'item',detail:'材料拾取范围 +40',price:12,color:'#6fc1b7',tier:1},
  {id:'haste',name:'工作手套',kind:'item',detail:'攻击速度 +15%',price:22,color:'#cfbf93',tier:1},
  {id:'regen',name:'一碗热汤',kind:'item',detail:'每秒恢复 0.5 生命',price:24,color:'#df987a',tier:1},
].map(item=>({...item,basePrice:item.price,limit:-1,verification:'PicLex-original',unlockedByDefault:true}));
