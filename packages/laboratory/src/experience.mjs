import { publicExperienceBridge } from '../../practice/src/experience-store.mjs';
import { browserSaveKey } from './export-materials.mjs';
export const EXPERIENCE_KEY='piclex.user-level.v1';
export const CORRECT_WORD_EXPERIENCE=1;
const skipCosts=[12,18,26,36];
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function skipExperienceCost(tier){return skipCosts[Number(tier)-1]??null;}
export function waveExperienceReward(wave){return Number.isInteger(wave)&&wave>=1&&wave<=20?2+Math.floor((wave-1)/5):null;}

export function levelProgress(total){
  total=Math.max(0,Number.isSafeInteger(total)?total:0);
  let low=total<2?0:1,high=total;
  while(low<high){const mid=low+Math.floor((high-low+1)/2);if(mid<=Math.floor(total/(mid+1)))low=mid;else high=mid-1;}
  const level=low,threshold=level?level*(level+1):0,required=(level+1)*2,earned=total-threshold;
  return {schemaVersion:1,total,level,earned,required,remaining:required-earned,fraction:earned/required};
}

export function normalizeExperience(value){
  if(!value||value.schemaVersion!==1||!Number.isSafeInteger(value.total)||value.total<0)return levelProgress(0);
  return levelProgress(value.total);
}

function validEvent(event){
  if(!event||!uuidPattern.test(event.id||''))return false;
  if(event.action==='word')return event.tier===0&&event.cost===0&&event.amount===CORRECT_WORD_EXPERIENCE;
  if(event.action==='wave')return event.cost===0&&event.amount===waveExperienceReward(event.tier);
  const cost=skipExperienceCost(event.tier);
  return event.action==='spend'&&cost!==null&&event.cost===cost&&event.amount===-cost;
}

export function experienceBridge({scope=globalThis,storage,onChange=()=>{},setTimer=setTimeout,clearTimer=clearTimeout}={}){
  if(scope.PICLEX_PUBLIC_WEB)return publicExperienceBridge({scope,onChange});
  const key=browserSaveKey(EXPERIENCE_KEY,scope);
  const native=scope.webkit?.messageHandlers?.labExperience;
  let stored,processed=[];
  if(!native){
    try{if(storage===undefined)storage=scope.localStorage;stored=JSON.parse(storage?.getItem(key)||'null');processed=Array.isArray(stored?.processed)?stored.processed.filter(id=>uuidPattern.test(id)).slice(-5000):[];}catch{}
  }
  let snapshot=normalizeExperience(scope.PICLEX_USER_LEVEL??stored),pending=new Map();
  const publish=value=>{snapshot=normalizeExperience(value);onChange(snapshot);return snapshot;};
  const save=(value=snapshot,ids=processed)=>{try{storage?.setItem(key,JSON.stringify({...value,processed:ids}));return true;}catch{return false;}};
  const local=event=>{
    if(processed.includes(event.id))return {status:'accepted',snapshot};
    if(event.action==='spend'&&snapshot.total<event.cost)return {status:'insufficient',snapshot};
    const next=levelProgress(snapshot.total+event.amount),nextProcessed=[...processed,event.id].slice(-5000);
    if(!save(next,nextProcessed))return {status:'failed',snapshot};
    processed=nextProcessed;publish(next);
    return {status:'accepted',snapshot};
  };
  return {
    get snapshot(){return snapshot;},
    canSpend(cost){return Number.isSafeInteger(cost)&&cost>0&&snapshot.total>=cost;},
    transact(event){
      if(!validEvent(event))return Promise.resolve({status:'invalid',snapshot});
      if(!native)return Promise.resolve(local(event));
      if(pending.has(event.id))return pending.get(event.id).promise;
      let finish;const promise=new Promise(resolve=>{finish=resolve;});
      const timer=setTimer(()=>{pending.delete(event.id);finish({status:'failed',snapshot});},5000);
      pending.set(event.id,{promise,finish,timer});
      try{native.postMessage({id:event.id,action:event.action,tier:event.tier,cost:event.cost,amount:event.amount});}
      catch{clearTimer(timer);pending.delete(event.id);finish({status:'failed',snapshot});}
      return promise;
    },
    acknowledge(id,status,value){
      const request=pending.get(id);if(!request)return;
      clearTimer(request.timer);pending.delete(id);publish(value);
      request.finish({status:['accepted','insufficient','invalid'].includes(status)?status:'failed',snapshot});
    }
  };
}
