import { browserSaveKey } from './export-materials.mjs';
import data from './data/achievement-content.mjs';
import { earlyAchievements } from './data/early-achievements.mjs';
const idPattern=/^[a-z][a-z0-9_]{0,63}$/;
export const PROGRESS_KEY='piclex.lab.progress.v1';
const reward=id=>{
  const found=[...data.items,...data.weapons,...(data.characters||[])].find(x=>x.originalId===id);
  return found&&(data.characters||[]).includes(found)?{...found,kind:'character'}:found;
};
const names={well_rounded:'全能者',brawler:'斗士',ranger:'游侠',multitasker:'多面手',mage:'法师',doctor:'医生',engineer:'工程师'};
export const achievements=data.challenges.map(c=>({id:c.my_id,character:c.characterID,title:`${names[c.characterID]}的胜利`,description:`使用${names[c.characterID]}通关20波`,reward:reward(c.rewardID),type:'win',target:20,source:c.resourcePath}));
if(data.materialChallenge)achievements.unshift({id:data.materialChallenge.my_id,title:'材料收藏家',description:'累计拾取5000材料',reward:reward(data.materialChallenge.rewardID),type:'materials',target:5000,source:data.materialChallenge.resourcePath});
if(data.healingChallenge)achievements.unshift({id:data.healingChallenge.my_id,title:'急救专家',description:'在同一波实际恢复200生命',reward:reward(data.healingChallenge.rewardID),type:'healing',target:200,source:data.healingChallenge.resourcePath});
for(const a of achievements)a.group=a.type==='win'?'通关':'挑战';
achievements.unshift(...earlyAchievements);
const metricKeys=new Set(earlyAchievements.map(a=>a.metric));
export const achievementGroups=['起步','成长','挑战','通关'];
export function achievementValue(state,a){
  if(state.unlocked.includes(a.id))return a.target;
  if(a.type==='win')return state.bestWaves[a.character]||0;
  if(a.type==='healing')return Math.floor(state.bestHealingWave);
  if(a.type==='materials'||a.metric==='materials')return state.totalMaterials;
  if(a.metric==='waves')return Math.max(0,...Object.values(state.bestWaves));
  return Math.floor(state.counters?.[a.metric]||0);
}
export function achievementList(state,group='起步'){
  return achievements.filter(a=>a.group===group).sort((a,b)=>Number(state.unlocked.includes(a.id))-Number(state.unlocked.includes(b.id)));
}
export function normalizeProgress(value){
  const empty={schemaVersion:1,unlocked:[],bestWaves:{},totalMaterials:0,bestHealingWave:0,counters:{}};
  if(!value||value.schemaVersion!==1||!Array.isArray(value.unlocked)||value.unlocked.length>512||!value.unlocked.every(x=>typeof x==='string'&&idPattern.test(x))||!value.bestWaves||typeof value.bestWaves!=='object'||Array.isArray(value.bestWaves)||Object.keys(value.bestWaves).length>128||!Object.entries(value.bestWaves).every(([id,w])=>idPattern.test(id)&&Number.isInteger(w)&&w>=0&&w<=20)||!Number.isSafeInteger(value.totalMaterials)||value.totalMaterials<0||value.totalMaterials>1e12)return empty;
  if(!Number.isFinite(value.bestHealingWave??0)||(value.bestHealingWave??0)<0||(value.bestHealingWave??0)>1e12)return empty;
  const counters=value.counters??{};
  if(!counters||typeof counters!=='object'||Array.isArray(counters)||Object.keys(counters).length>64||!Object.entries(counters).every(([k,v])=>/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(k)&&!['constructor','prototype','__proto__'].includes(k)&&Number.isFinite(v)&&v>=0&&v<=1e12))return empty;
  return {schemaVersion:1,bestHealingWave:value.bestHealingWave??0,unlocked:[...new Set(value.unlocked)].sort(),bestWaves:{...value.bestWaves},totalMaterials:value.totalMaterials,counters:{...counters}};
}
export class AchievementProgress {
  constructor(value,onChange=()=>{}){this.state=normalizeProgress(value);this.onChange=onChange;
    // Old saves already contain materials and cleared waves: grant their newly
    // introduced medals once, without replaying historical notification sounds.
    const unlocked=this.evaluate();if(unlocked.length)this.onChange(this.snapshot(),unlocked);
  }
  snapshot(){return structuredClone(this.state);}
  has(id){return this.state.unlocked.includes(id);}
  available(content){if(content?.kind==='character')return true;const rule=achievements.find(a=>a.reward?.id===content?.id);return !rule||this.has(rule.id);}
  unlock(rule){if(!rule||this.has(rule.id))return [];this.state.unlocked.push(rule.id);this.state.unlocked.sort();return [rule];}
  evaluate(){return achievements.filter(a=>a.type==='metric'||a.type==='materials').flatMap(a=>achievementValue(this.state,a)>=a.target?this.unlock(a):[]);}
  record(metrics={},increments={}){
    let changed=false;
    for(const [key,value] of Object.entries({...metrics,...increments})){
      if(!metricKeys.has(key)||!Number.isFinite(value)||value<0||value>1e12)continue;
      const old=this.state.counters[key]||0,next=Object.hasOwn(increments,key)?Math.min(1e12,old+value):Math.max(old,value);
      if(next!==old){this.state.counters[key]=next;changed=true;}
    }
    const unlocked=this.evaluate();if(changed||unlocked.length)this.onChange(this.snapshot(),unlocked);return unlocked;
  }
  completeWave(character,wave,won=false){
    if(!names[character]||!Number.isInteger(wave)||wave<1||wave>20||wave===20&&!won)return [];
    const old=this.state.bestWaves[character]||0;this.state.bestWaves[character]=Math.max(old,wave);
    const unlocked=[...(won&&wave===20?this.unlock(achievements.find(a=>a.type==='win'&&a.character===character)):[]),...this.evaluate()];
    if(old<this.state.bestWaves[character]||unlocked.length)this.onChange(this.snapshot(),unlocked);
    return unlocked;
  }
  recordHealing(value){
    if(!Number.isFinite(value)||value<0||value>1e12)return [];
    const old=this.state.bestHealingWave;this.state.bestHealingWave=Math.max(old,value);
    const rule=achievements.find(a=>a.type==='healing'),unlocked=value>=(rule?.target||Infinity)?this.unlock(rule):[];
    if(Math.floor(old)<Math.floor(this.state.bestHealingWave)||unlocked.length)this.onChange(this.snapshot(),unlocked);return unlocked;
  }
  collectMaterials(value){
    if(!Number.isSafeInteger(value)||value<=0)return [];
    this.state.totalMaterials=Math.min(1e12,this.state.totalMaterials+value);
    const unlocked=this.evaluate();
    this.onChange(this.snapshot(),unlocked);return unlocked;
  }
}
export function browserProgress(scope=globalThis){
  const key=browserSaveKey(PROGRESS_KEY,scope);
  let stored;try{stored=scope.PICLEX_LAB_PROGRESS??JSON.parse(scope.localStorage.getItem(key)||'null');}catch{}
  let timer,dirty=false,failed=false;
  const flush=()=>{clearTimeout(timer);timer=null;if(!dirty)return;const value=progress.snapshot();try{
    const bridge=scope.webkit?.messageHandlers?.labProgress;if(bridge)bridge.postMessage(value);else scope.localStorage.setItem(key,JSON.stringify(value));dirty=false;
  }catch{failed=true;}};
  // Constructor migration can emit before progress is assigned.
  let progress;const changed=(_,unlocked)=>{dirty=true;if(!progress)return;if(unlocked.length)flush();else if(!timer)timer=setTimeout(()=>{timer=null;flush();},250);};
  progress=new AchievementProgress(stored,changed);if(dirty)flush();
  return {progress,flush,saveFailed:()=>failed};
}
