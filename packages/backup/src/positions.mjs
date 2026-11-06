import {sha256} from '../../deck-format/src/archive.mjs';
import {canonical,practiceWordKey} from './progress.mjs';
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const fail=()=>{throw Error('卡组位置格式无效，原有学习数据已保留。');};
export const positionLimit=2*1024*1024;
export function normalizePositions(rows){
 if(!Array.isArray(rows)||rows.length>5000)fail();const seen=new Set();
 return rows.map(r=>{
  if(!r||typeof r.deck!=='string'||!r.deck.length||[...r.deck].length>200||/[\r\n]/.test(r.deck)||seen.has(r.deck)||!uuid.test(r.photo)||typeof r.word!=='string'||!r.word.length||[...r.word].length>200||/[\r\n]/.test(r.word)||!Number.isInteger(r.ordinal)||r.ordinal<0||r.ordinal>999||typeof r.finished!=='boolean'||!Number.isSafeInteger(r.updatedAt)||r.updatedAt<0||r.updatedAt>8640000000000000||!uuid.test(r.revision))fail();
  seen.add(r.deck);return {deck:r.deck,photo:r.photo,word:r.word,ordinal:r.ordinal,finished:r.finished,updatedAt:r.updatedAt,revision:r.revision};
 }).sort((a,b)=>a.deck<b.deck?-1:1);
}
export const positionNewer=(a,b)=>!b||a.updatedAt>b.updatedAt||(a.updatedAt===b.updatedAt&&a.revision>b.revision);
export function mergePositions(local,remote){const map=new Map(normalizePositions(local).map(r=>[r.deck,r]));for(const r of normalizePositions(remote))if(positionNewer(r,map.get(r.deck)))map.set(r.deck,r);return normalizePositions([...map.values()]);}
export function encodePositions(rows){const bytes=new TextEncoder().encode(canonical({format:'com.zhaoolee.piclex.deck-positions',version:1,positions:normalizePositions(rows)}));if(bytes.length>positionLimit)fail();return bytes;}
export function decodePositions(bytes){if(bytes.length>positionLimit)fail();const o=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(o.format!=='com.zhaoolee.piclex.deck-positions'||o.version!==1)fail();return normalizePositions(o.positions);}
export const positionName=async bytes=>'PicLex-positions-v1-'+await sha256(bytes)+'.json';
export const isPositionName=name=>/^PicLex-positions-v1-[a-f0-9]{64}\.json$/.test(name);
export const photoID=word=>word.id.split(':')[0].toLowerCase();
export async function positionScope(deck){
 if(uuid.test(deck.id.toLowerCase()))return 'deck:'+deck.id.toLowerCase();
 return 'photos:'+await sha256(new TextEncoder().encode([...new Set(deck.words.map(photoID))].sort().join('\n')));
}
export function positionAnchor(deck,state){
 const index=Math.min(state.index,deck.words.length-1),w=deck.words[index];if(!w)return null;
 const photo=photoID(w),word=practiceWordKey(w),ordinal=deck.words.slice(0,index).filter(v=>photoID(v)===photo&&practiceWordKey(v)===word).length;
 return {photo,word,ordinal,finished:state.index>=deck.words.length};
}
export function positionIndex(deck,row){
 let ordinal=0;for(let i=0;i<deck.words.length;i++){const w=deck.words[i];if(photoID(w)===row.photo&&practiceWordKey(w)===row.word){if(ordinal++===row.ordinal)return i+(row.finished?1:0);}}
 return null; // Deleted/missing words never fall back to an unrelated numeric index.
}
