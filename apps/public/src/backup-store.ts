import {database,storedDecks,type StoredDeck} from './storage';
import {emptyProgress,mergeProgress,practiceWordKey,spellingEvent,stableID} from '../../../packages/backup/src/progress.mjs';
import {readPhotos,practicePhoto} from '../../../packages/backup/src/photos.mjs';
export type BackupPhoto={id:string;meta:any;image:Uint8Array;title:string};
export async function backupState():Promise<{photos:BackupPhoto[];content:any;receipts:Record<string,boolean>}>{const db=await database();try{return await new Promise((resolve,reject)=>{const t=db.transaction(['backupPhotos','backupMeta'],'readonly'),p=t.objectStore('backupPhotos').getAll(),c=t.objectStore('backupMeta').get('progress'),r=t.objectStore('backupMeta').get('receipts');t.oncomplete=()=>resolve({photos:p.result,content:c.result||emptyProgress(),receipts:r.result||{}});t.onerror=t.onabort=()=>reject(Error('备份数据读取失败。'));});}finally{db.close();}}
export async function collectPhotos(){const {photos}=await backupState(),map=new Map(photos.map(p=>[p.id,p]));for(const deck of await storedDecks())for(const photo of await readPhotos(new Uint8Array(deck.bytes))){const raw=map.get(photo.id);map.set(photo.id,{...photo,meta:{...photo.meta,...(raw?{deletedAt:raw.meta.deletedAt}: {})}});}return [...map.values()];}
export async function mergeBackup(photos:BackupPhoto[],remote:any){
 // Validate playable derivatives before writing; recheck identities within the transaction.
 const existingPhotos=await collectPhotos(),prepared=new Map<string,StoredDeck>();
 for(const photo of photos){const deck=await practicePhoto(photo);if(deck)prepared.set(photo.id,deck);}
 let added=0,unplayable=0;
 const db=await database();try{await new Promise<void>((resolve,reject)=>{
  const t=db.transaction(['decks','backupPhotos','backupMeta'],'readwrite'),meta=t.objectStore('backupMeta'),store=t.objectStore('backupPhotos'),decks=t.objectStore('decks');
  const current=meta.get('progress'),raw=store.getAll(),stored=decks.getAll();stored.onsuccess=()=>{try{
   meta.put(mergeProgress(current.result||emptyProgress(),remote),'progress');
   const known=new Set([...raw.result,...existingPhotos].map(p=>p.id)),rawIDs=new Set(raw.result.map(p=>p.id)),deckIDs=new Set(stored.result.map(d=>d.id));
   for(const p of existingPhotos)if(!rawIDs.has(p.id))store.add(p);
   for(const p of photos)if(!known.has(p.id)){known.add(p.id);store.add(p);added++;const d=prepared.get(p.id);if(d&&!deckIDs.has(d.id)){decks.add(d);deckIDs.add(d.id);}else if(!d&&p.meta.deletedAt==null)unplayable++;}
  }catch{t.abort();}};
  t.oncomplete=()=>resolve();t.onerror=t.onabort=()=>reject(Error('恢复未能保存，原有照片与进度已保留。'));
 });}finally{db.close();}
 window.dispatchEvent(new Event('piclex-backup-changed'));return {added,kept:photos.length-added,unplayable};
}
export async function recordPortableStudy(deck:any,state:any){
 const completed=await Promise.all(deck.words.filter((w:any)=>state.words[w.id]?.result).map(async(w:any)=>{const receipt=`spell:${deck.fingerprint}:${state.round}:${w.id}`;return {w,d:state.words[w.id],h:state.history[w.id],receipt,id:await stableID(receipt)};}));if(!completed.length)return;
 const db=await database();try{await new Promise<void>((resolve,reject)=>{const t=db.transaction('backupMeta','readwrite'),store=t.objectStore('backupMeta'),c=store.get('progress'),r=store.get('receipts');r.onsuccess=()=>{try{let content=c.result||emptyProgress();const receipts=r.result||{},progress=new Map<string,any>(content.progress.map((v:any)=>[v.wordKey,v])),events=new Map<string,any>(content.events.map((v:any)=>[v.id,v]));let changed=false;
 for(const {w,d,h,receipt,id} of completed){if(receipts[receipt])continue;receipts[receipt]=true;changed=true;if(events.has(id))continue;const wordKey=practiceWordKey(w),old=progress.get(wordKey),at=Date.now(),correct=d.result==='correct',counted=d.result!=='revealed';const streak=counted?(old?.streak||0)+1:0;progress.set(wordKey,{wordKey,attempts:(old?.attempts||0)+1,correctAnswers:(old?.correctAnswers||0)+(counted?1:0),streak,lastPracticedAt:at,nextReviewAt:at+(streak?[1,2,4,7,15,30][Math.min(streak-1,5)]*86400000:0),misspelledIndices:h?.mistakes||[]});if(!events.has(id))events.set(id,spellingEvent(id,wordKey,d.result,at));}
 if(changed){content={...content,progress:[...progress.values()],events:[...events.values()]};store.put(content,'progress');store.put(receipts,'receipts');}
 }catch{t.abort();}};t.oncomplete=()=>resolve();t.onerror=t.onabort=()=>reject(Error('跨端学习进度未能保存，请保留当前页面后重试。'));});}finally{db.close();}}
export async function portableHistory(deck:any){const {content}=await backupState();const records=new Map<string,any>(content.progress.map((r:any)=>[r.wordKey,r]));return Object.fromEntries(deck.words.flatMap((w:any)=>{const r=records.get(practiceWordKey(w));return r?[[w.id,{mastered:r.correctAnswers>0&&r.streak>0&&(!r.misspelledIndices||!r.misspelledIndices.length),mistakes:r.misspelledIndices||[]}]]:[];}));}
export async function setPhotoDeleted(photo:BackupPhoto,deleted:boolean){
 const value={...photo,meta:{...photo.meta,deletedAt:deleted?Date.now():null}};let present=false;if(!deleted)for(const deck of await storedDecks())if((await readPhotos(new Uint8Array(deck.bytes))).some(p=>p.id===photo.id))present=true;const playable=deleted||present?null:await practicePhoto(value);
 const db=await database();try{await new Promise<void>((resolve,reject)=>{const t=db.transaction(['backupPhotos','decks'],'readwrite');t.objectStore('backupPhotos').put(value);if(playable){const store=t.objectStore('decks'),r=store.get(playable.id);r.onsuccess=()=>{if(!r.result)store.add(playable);};}t.oncomplete=()=>resolve();t.onerror=t.onabort=()=>reject(Error('照片状态未能保存，原照片仍在。'));});}finally{db.close();}
}
