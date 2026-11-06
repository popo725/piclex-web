import {decodePositions,encodePositions,mergePositions} from '../../../packages/backup/src/positions.mjs';
import {readPreference,writePreference} from './storage';
const key='piclex-web.deck-positions.v1';
export function positions(){const raw=readPreference(key);return raw?decodePositions(new TextEncoder().encode(raw)):[];}
export function mergeStoredPositions(rows:any[]){const old=positions(),merged=mergePositions(old,rows);if(JSON.stringify(old)!==JSON.stringify(merged)){
 if(!writePreference(key,new TextDecoder().decode(encodePositions(merged))))throw Error('卡组位置未能保存，请保留当前页面后重试。');
 window.dispatchEvent(new Event('piclex-positions-imported'));
}return merged;}
export function recordPosition(scope:string,anchor:any){const old=positions().find((r:any)=>r.deck===scope);
 if(old&&['photo','word','ordinal','finished'].every(k=>old[k]===anchor[k]))return;
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 const revision=`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
 mergeStoredPositions([{deck:scope,...anchor,updatedAt:Math.max(Date.now(),(old?.updatedAt||0)+1),revision}]);
 window.dispatchEvent(new Event('piclex-progress-changed'));
}
