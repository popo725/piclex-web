import {sha256} from '../../deck-format/src/archive.mjs';
const ID='com.zhaoolee.piclex.progress-archive',MAX=1e9,uuid=/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i;
const fail=()=>{throw Error('学习进度备份格式或校验无效，现有数据未改变。');};
export const emptyProgress=()=>({progress:[],memories:[],events:[]});
const count=n=>Number.isSafeInteger(n)&&n>=0&&n<=MAX;
const date=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<8.64e15;
const key=s=>typeof s==='string'&&s.length>0&&[...s].length<=200&&!/[\r\n]/.test(s);
const optional=(o,n,validate)=>o[n]==null||validate(o[n]);
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>o[k]!=null).map(k=>[k,o[k]]));
export function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
function jsonBytes(s){if(typeof s!=='string'||s.length>6*1024*1024||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))fail();try{const o=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0))));if(!o||typeof o!=='object'||Array.isArray(o))fail();return o;}catch{fail();}}
function validateFSRS(o,card=false){
 const nonnegative=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 const bounded=n=>nonnegative(n)&&n<=100;
 if(card?!date(o.due):(![0,1,2,3,4].includes(o.rating)||!date(o.review)))fail();
 for(const name of ['elapsedDays','scheduledDays',...(card?['stability']:['lastElapsedDays'])])if(!optional(o,name,nonnegative))fail();
 if(!optional(o,'difficulty',bounded)||!optional(o,'learningSteps',n=>Number.isInteger(n)&&n>=0&&n<=1000)||!optional(o,'state',n=>[0,1,2,3].includes(n)))fail();
 if(card){if(!optional(o,'reps',count)||!optional(o,'lapses',count)||!optional(o,'lastReview',date))fail();}
 else if(!optional(o,'due',date)||!optional(o,'stability',nonnegative))fail();
}
const points=n=>3+Math.min(3,Math.floor((n-1)/8));
export function normalizeProgress(input){
 if(!input||typeof input!=='object')fail();const result={};let total=0;
 for(const name of ['progress','memories','events','readingEvents','laboratoryExperienceEvents']){
  const values=input[name]??(['readingEvents','laboratoryExperienceEvents'].includes(name)?[]:null);if(!Array.isArray(values)||(total+=values.length)>50000)fail();const seen=new Set();
  const rows=values.map(raw=>{if(!raw||typeof raw!=='object')fail();let r;
   if(name==='progress'){
    r=pick(raw,['wordKey','attempts','correctAnswers','streak','lastPracticedAt','nextReviewAt','misspelledIndices']);if(!key(r.wordKey)||!count(r.attempts)||!count(r.correctAnswers)||r.correctAnswers>r.attempts||!count(r.streak)||r.streak>r.correctAnswers||!date(r.nextReviewAt)||!optional(r,'lastPracticedAt',date))fail();
    if(r.misspelledIndices!=null){if(!Array.isArray(r.misspelledIndices)||r.misspelledIndices.length>256||r.misspelledIndices.some(n=>!Number.isInteger(n)||n<0||n>=[...r.wordKey].length)||new Set(r.misspelledIndices).size!==r.misspelledIndices.length)fail();r.misspelledIndices=[...r.misspelledIndices].sort((a,b)=>a-b);}
   }else if(name==='memories'){
    r=pick(raw,['wordKey','cardJSON','priorityReviewAt']);if(!key(r.wordKey)||!optional(r,'priorityReviewAt',date))fail();validateFSRS(jsonBytes(r.cardJSON),true);
   }else if(name==='events'){
    r=pick(raw,['id','wordKey','reviewedAt','correct','mode','logJSON','completedAt','finalCorrect','statisticsVersion','levelCreditAt']);if(!key(r.wordKey)||!date(r.reviewedAt)||typeof r.correct!=='boolean'||!['traditional','challenge'].includes(r.mode)||!optional(r,'completedAt',date)||!optional(r,'levelCreditAt',date)||!optional(r,'finalCorrect',v=>typeof v==='boolean')||!optional(r,'statisticsVersion',v=>Number.isInteger(v)&&v>=0&&v<=1000))fail();validateFSRS(jsonBytes(r.logJSON));
   }else if(name==='readingEvents'){
    r=pick(raw,['id','completedAt','wordCount','experience']);if(!date(r.completedAt)||!count(r.wordCount)||!r.wordCount||!count(r.experience)||!r.experience||r.experience>points(r.wordCount))fail();
   }else{
    r=pick(raw,['id','occurredAt','amount','action','tier']);let expected=null;if(r.action==='word'&&r.tier===0)expected=1;if(r.action==='wave'&&Number.isInteger(r.tier)&&r.tier>=1&&r.tier<=20)expected=2+Math.floor((r.tier-1)/5);if(r.action==='spend')expected=-([12,18,26,36][r.tier-1]??NaN);if(['dictation.chunks','dictation.free'].includes(r.action)&&Number.isInteger(r.tier)&&r.tier>=1&&r.tier<=2000)expected=points(r.tier);if(!date(r.occurredAt)||!Number.isInteger(r.amount)||r.amount!==expected)fail();
   }
   if('id'in r){if(!uuid.test(r.id))fail();r.id=r.id.toUpperCase();}const identity=r.id??r.wordKey;if(seen.has(identity))fail();seen.add(identity);return r;
  });
  rows.sort((a,b)=>{const time=name==='events'?'reviewedAt':name==='readingEvents'?'completedAt':name==='laboratoryExperienceEvents'?'occurredAt':null;return (time?a[time]-b[time]:0)||((a.id??a.wordKey)<(b.id??b.wordKey)?-1:1);});
  if(rows.length||['progress','memories','events'].includes(name))result[name]=rows;
 }
 return result;
}
export async function encodeProgress(content,now=Date.now()){
 const normalized=normalizeProgress(content);return {formatIdentifier:ID,formatVersion:1,exporterVersion:'1.0.0',appVersion:'photography-english-web',exportedAt:now,progressCount:normalized.progress.length,memoryCount:normalized.memories.length,eventCount:normalized.events.length,contentSHA256:await sha256(new TextEncoder().encode(canonical(normalized))),content:normalized};
}
export async function decodeProgress(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length>64*1024*1024)fail();let o;try{o=JSON.parse(new TextDecoder().decode(bytes));}catch{fail();}
 if(o.formatIdentifier!==ID||o.formatVersion!==1||typeof o.appVersion!=='string'||typeof o.exporterVersion!=='string'||o.exporterVersion.length>40||!date(o.exportedAt))fail();const c=normalizeProgress(o.content);
 if(o.progressCount!==c.progress.length||o.memoryCount!==c.memories.length||o.eventCount!==c.events.length||o.contentSHA256!==await sha256(new TextEncoder().encode(canonical(c))))fail();return c;
}
export function mergeProgress(local,remote){
 local=normalizeProgress(local);remote=normalizeProgress(remote);const merged={};
 for(const name of ['progress','memories','events','readingEvents','laboratoryExperienceEvents']){
  const map=new Map((local[name]||[]).map(r=>[r.id??r.wordKey,r]));for(const r of remote[name]||[]){const id=r.id??r.wordKey,old=map.get(id);if(!old||(name==='progress'&&r.lastPracticedAt!=null&&(old.lastPracticedAt==null||r.lastPracticedAt>old.lastPracticedAt))||(name==='readingEvents'&&r.wordCount===old.wordCount&&r.experience>old.experience))map.set(id,r);}merged[name]=[...map.values()];
 }return normalizeProgress(merged);
}
export const practiceWordKey=w=>w.occurrenceID?.trim()?'occurrence:'+w.occurrenceID.trim():w.english.toLowerCase().trim();
export async function stableID(id){const h=await sha256(new TextEncoder().encode('piclex-web:'+id));return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`.toUpperCase();}
export function spellingEvent(id,wordKey,result,at){const correct=result==='correct',completed=result!=='revealed';return {id,wordKey,reviewedAt:at,correct,mode:'traditional',logJSON:btoa(JSON.stringify({rating:correct?3:1,elapsedDays:0,lastElapsedDays:0,scheduledDays:0,learningSteps:0,review:at/1000-978307200})),completedAt:at,finalCorrect:completed,statisticsVersion:1,...(completed?{levelCreditAt:at}:{})};}
