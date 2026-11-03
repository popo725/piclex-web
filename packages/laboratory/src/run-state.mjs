import { SurvivalGame } from './engine.mjs';
import { characters, weapon, catalog } from './content.mjs';
import { eligibleWords } from './words.mjs';
import { wordPhoto } from './photo.mjs';
import { editableLetters } from './letter-tiles.mjs';
import { CORRECT_WORD_EXPERIENCE,skipExperienceCost,waveExperienceReward } from './experience.mjs';
import { achievements } from './progress.mjs';
import { runFields,runState } from './run-fields.mjs';

export const RUN_FORMAT='piclex-survival-run',RUN_BYTES=4*1024*1024;
const phases=new Set(['battle','paused','shop','upgrade','loot','won','lost']);
const fields=[...runFields,'runAchievementIDs','waveStart'];
const unsafe=new Set(['__proto__','prototype','constructor']);

// Preserve identity, not just values: piercing-hit Sets reference live enemies,
// and spreading burns share one remaining-spread budget across several enemies.
function encodeGraph(root){
  const nodes=[],seen=new Map();
  const encode=value=>{
    if(value===null||typeof value==='string'||typeof value==='boolean')return value;
    if(typeof value==='number'){if(Number.isFinite(value))return value;if(value===Infinity)return {infinity:1};throw Error('invalid number');}
    if(!value||typeof value!=='object')throw Error('unsupported state');
    if(seen.has(value))return {ref:seen.get(value)};
    if(nodes.length>=50000)throw Error('state too large');
    const index=nodes.length;seen.set(value,index);nodes.push(null);
    if(Array.isArray(value))nodes[index]={kind:'array',values:value.map(encode)};
    else if(value instanceof Set)nodes[index]={kind:'set',values:[...value].map(encode)};
    else{
      if(Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)throw Error('unsupported object');
      nodes[index]={kind:'object',values:Object.entries(value).filter(([,v])=>v!==undefined).map(([key,v])=>{if(unsafe.has(key))throw Error('invalid key');return [key,encode(v)];})};
    }
    return {ref:index};
  };
  return {root:encode(root),nodes};
}
function decodeGraph(graph){
  if(!graph||!Array.isArray(graph.nodes)||!graph.nodes.length||graph.nodes.length>50000)throw Error('invalid graph');
  const objects=graph.nodes.map(node=>{
    if(!node||!Array.isArray(node.values)||node.values.length>10000)throw Error('invalid node');
    if(node.kind==='array')return [];if(node.kind==='set')return new Set();if(node.kind==='object')return {};throw Error('invalid kind');
  });
  const decode=value=>{
    if(value===null||typeof value==='boolean')return value;
    if(typeof value==='string'){if(value.length>131072)throw Error('string too large');return value;}
    if(typeof value==='number'&&Number.isFinite(value))return value;
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==1)throw Error('invalid value');
    if(value.infinity===1)return Infinity;
    if(Number.isInteger(value.ref)&&value.ref>=0&&value.ref<objects.length)return objects[value.ref];throw Error('invalid reference');
  };
  graph.nodes.forEach((node,i)=>{
    const object=objects[i];
    if(node.kind==='object'){
      const keys=new Set();for(const pair of node.values){if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string'||unsafe.has(pair[0])||keys.has(pair[0]))throw Error('invalid member');keys.add(pair[0]);object[pair[0]]=decode(pair[1]);}
    }else for(const value of node.values){if(node.kind==='set')object.add(decode(value));else object.push(decode(value));}
  });
  return decode(graph.root);
}
const finite=(v,min=-1e12,max=1e12)=>Number.isFinite(v)&&v>=min&&v<=max;
const list=(v,limit)=>Array.isArray(v)&&v.length<=limit;
function validateState(s,isWaveStart=false){
  if(!s||Array.isArray(s)||Object.keys(s).some(k=>k!=='characterID'&&!fields.includes(k))||!phases.has(s.phase)||!characters.some(c=>c.id===s.characterID))throw Error('invalid run');
  if(!Number.isInteger(s.wave)||s.wave<1||s.wave>20||!finite(s.elapsed,0,180)||!finite(s.duration,1,180)||!finite(s.width,280,20000)||!finite(s.height,240,20000))throw Error('invalid wave');
  for(const key of ['coins','kills','level','xp','materialBank','correct','failed','wordCursor','refreshCount','healPickups','healingThisWave'])if(!finite(s[key],0))throw Error('invalid counters');
  for(const key of ['recycledWeapons','shopRerolls']){if(s[key]===undefined)s[key]=0;if(!Number.isSafeInteger(s[key])||!finite(s[key],0))throw Error('invalid achievement counters');}
  if(s.runAchievementIDs===undefined)s.runAchievementIDs=[];
  if(!list(s.runAchievementIDs,512)||!s.runAchievementIDs.every(id=>typeof id==='string'&&/^[a-z][a-z0-9_]{0,63}$/.test(id)))throw Error('invalid run achievements');
  if(!Number.isInteger(s.level)||s.level<1||!Number.isInteger(s.wordCursor))throw Error('invalid level');
  const p=s.player;if(!p||!finite(p.hp,s.phase==='lost'?0:Number.MIN_VALUE)||!finite(p.maxHP,Math.max(1,p.hp))||!finite(p.x,0,s.width)||!finite(p.y,0,s.height)||!finite(p.r,1,200))throw Error('invalid player');
  if(!list(s.weapons,12)||!s.weapons.every(w=>w&&Number.isInteger(w.tier)&&w.tier>=1&&w.tier<=4&&weapon(w)))throw Error('invalid weapons');
  if(![6,12].includes(s.maxWeapons)||s.weapons.length>s.maxWeapons)throw Error('invalid capacity');
  if(!list(s.words,5000)||!s.words.length||eligibleWords(s.words).length!==s.words.length||!list(s.wordOrder,5000)||!s.wordOrder.length||eligibleWords(s.wordOrder).length!==s.wordOrder.length)throw Error('invalid words');
  for(const key of ['baseStats','stats','setCounts'])if(!s[key]||Array.isArray(s[key])||!Object.values(s[key]).every(v=>finite(v)))throw Error('invalid stats');
  if(s.pendingExperience===undefined)s.pendingExperience=[];
  for(const [key,limit] of Object.entries({inventory:2000,review:5000,enemies:2000,corpses:100,bullets:2000,enemyBullets:500,gems:4000,heals:1000,particles:4000,explosions:500,weaponPoses:12,weaponKicks:12,attackTimers:12,groups:200,pendingUpgrades:1000,upgradeOffers:4,crates:1000,offers:4,pendingExperience:128}))if(!list(s[key],limit))throw Error('invalid list');
  for(const key of ['enemies','corpses','bullets','enemyBullets','gems','heals','particles','explosions'])for(const e of s[key])if(!e||!finite(e.x)||!finite(e.y))throw Error('invalid entity');
  for(const e of s.enemies)if(!finite(e.hp)||!finite(e.r,1,200)||!finite(e.speed,0)||!finite(e.warning,0)||!e.data)throw Error('invalid enemy');
  for(const b of s.bullets)if(!(b.hits instanceof Set)||![...b.hits].every(e=>s.enemies.includes(e))||!b.w?.stats||!Array.isArray(b.w.effects)||!finite(b.dx)||!finite(b.dy)||!finite(b.damage,0)||!finite(b.life))throw Error('invalid projectile');
  for(const offer of s.offers){
    if(!offer||!catalog.some(o=>o.id===offer.id)||!finite(offer.price,0)||!['available','purchased','failed'].includes(offer.status)||!eligibleWords([offer.word]).length)throw Error('invalid offer');
    const t=offer.labTiles;
    if(t){const n=editableLetters(offer.word.english).length;if(!list(t.bank,n)||t.bank.length!==n||!list(t.slots,n)||t.slots.length!==n||new Set(t.bank.map(x=>x.id)).size!==n||t.bank.some(x=>typeof x.id!=='string'||typeof x.letter!=='string'||x.letter.length!==1)||t.slots.some(id=>id!==null&&!t.bank.some(x=>x.id===id))||new Set(t.slots.filter(x=>x!==null)).size!==t.slots.filter(x=>x!==null).length)throw Error('invalid draft');}
  }
  if(s.challenge&&(!Number.isInteger(s.challenge.index)||!s.offers[s.challenge.index]||s.offers[s.challenge.index].status!=='available'||s.challenge.word?.english!==s.offers[s.challenge.index].word.english))throw Error('invalid challenge');
  const ids=new Set();for(const event of s.pendingExperience){if(!event||typeof event.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(event.id)||ids.has(event.id))throw Error('invalid experience');ids.add(event.id);if(event.action==='word'){if(event.tier!==0||event.cost!==0||event.amount!==CORRECT_WORD_EXPERIENCE||!Number.isInteger(event.offerIndex)||s.offers[event.offerIndex]?.status!=='purchased')throw Error('invalid reward');}else if(event.action==='wave'){if(event.cost!==0||event.amount!==waveExperienceReward(event.tier)||event.tier>s.wave)throw Error('invalid wave reward');}else if(event.action==='spend'){const cost=skipExperienceCost(event.tier);if(event.cost!==cost||event.amount!==-cost||!Number.isInteger(event.offerIndex)||event.offerIndex!==s.challenge?.index||s.offers[event.offerIndex]?.status!=='available')throw Error('invalid spend');}else throw Error('invalid experience');}
  if(s.phase==='upgrade'&&!s.pendingUpgrades.length||s.phase==='loot'&&!s.lootOffer)throw Error('invalid settlement');
  if(isWaveStart){
    if(s.waveStart!==undefined||s.phase!=='battle'||s.elapsed!==0||s.pendingExperience.length||s.challenge)throw Error('invalid wave start');
  }else if(s.waveStart){
    validateState(s.waveStart,true);
    if(s.waveStart.wave!==s.wave||s.waveStart.characterID!==s.characterID||!['battle','paused','lost'].includes(s.phase))throw Error('mismatched wave start');
  }
  if(s.phase==='lost'&&(!s.waveStart||p.hp!==0))throw Error('invalid defeat');
  return s;
}
export function captureRun(game,now=Date.now()){
  const defeated=['dying','lost'].includes(game.phase),waveStart=['battle','paused','dying','lost'].includes(game.phase)&&game.waveStart?.wave===game.wave?game.waveStart:null;
  if(!game.wave||defeated&&!waveStart||!defeated&&(!phases.has(game.phase)||game.player.hp<=0)||game.phase==='won'&&!game.pendingExperience?.length)return null;
  const state=runState(game);if(waveStart)state.waveStart=waveStart;
  if(defeated)state.phase='lost';
  state.runAchievementIDs=[...new Set(game.newUnlocks.map(a=>a.id))];
  // References to enemies removed from the live list must remain representable;
  // dead hit targets do not matter for future piercing and are dropped on restore.
  const graph=encodeGraph(state),value={schemaVersion:1,format:RUN_FORMAT,savedAt:now,graph};
  if(new TextEncoder().encode(JSON.stringify(value)).length>RUN_BYTES)throw Error('checkpoint too large');return value;
}
export function readRun(value,{onError=()=>{}}={}){
  try{
    if(!value||value.schemaVersion!==1||value.format!==RUN_FORMAT||!finite(value.savedAt,0,Number.MAX_SAFE_INTEGER)||new TextEncoder().encode(JSON.stringify(value)).length>RUN_BYTES)return null;
    const state=decodeGraph(value.graph);
    // Hit targets can die between shots and snapshotting. Keep only live object references.
    if(Array.isArray(state?.enemies)&&Array.isArray(state?.bullets))for(const b of state.bullets)if(b?.hits instanceof Set)b.hits=new Set([...b.hits].filter(e=>state.enemies.includes(e)));
    return validateState(state);
  }catch(error){onError(error);return null;}
}
// A checkpoint preserves the puzzle and its draft, but photo references can be
// missing in older saves or stale after reimporting the current deck. Rebind only
// an exact word/meaning match from the vocabulary this session may access.
function refreshRunPhotos(state,words){
  const key=w=>JSON.stringify([w.english.trim().toLowerCase(),w.chinese.trim()]);
  const current=new Map(eligibleWords(words).filter(w=>wordPhoto(w)).map(w=>[key(w),w]));
  const refresh=w=>{
    if(typeof w?.english!=='string'||typeof w?.chinese!=='string')return;
    const match=current.get(key(w));if(!match)return;
    w.photo=match.photo;w.photoID=match.photoID;w.focus=match.focus;
  };
  const visit=s=>{
    for(const w of [...s.words,...s.wordOrder,...s.review])refresh(w);
    for(const offer of s.offers)refresh(offer.word);
    refresh(s.challenge?.word);
    if(s.waveStart)visit(s.waveStart);
  };
  visit(state);
}
export function restoreRun(value,{progression,random=Math.random,words}={}){
  const state=readRun(value);if(!state)return null;
  if(words)refreshRunPhotos(state,words);
  const game=new SurvivalGame({words:state.words,character:state.characterID,progression,random});
  if(game.character.id!==state.characterID)return null;
  for(const key of fields)if(Object.hasOwn(state,key))game[key]=state[key];
  game.newUnlocks=achievements.filter(a=>state.runAchievementIDs.includes(a.id)&&game.progression.has(a.id));game.audioEvents=[];
  if(game.phase==='battle')game.phase='paused';return game;
}
