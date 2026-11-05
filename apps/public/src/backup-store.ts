import {resolveImage,fileReference,commitFiles} from '../../../packages/backup/src/streaming.mjs';
import {database,iterateStoredDecks} from './storage';
import {emptyProgress,mergeProgress,practiceWordKey,spellingEvent,stableID} from '../../../packages/backup/src/progress.mjs';
import {readPhotos} from '../../../packages/backup/src/photos.mjs';
export type BackupPhoto={id:string;meta:any;image:Blob|Uint8Array;imageRef?:{directory:string;file:string};title:string};
export async function backupState(includePhotos=true):Promise<{photos:BackupPhoto[];content:any;receipts:Record<string,boolean>}>{const db=await database();try{const result=await new Promise<{photos:BackupPhoto[];content:any;receipts:Record<string,boolean>}>((resolve,reject)=>{const photos:BackupPhoto[]=[];const t=db.transaction(['backupPhotos','backupMeta'],'readonly'),p=includePhotos?t.objectStore('backupPhotos').openCursor():null,c=t.objectStore('backupMeta').get('progress'),r=t.objectStore('backupMeta').get('receipts');if(p)p.onsuccess=()=>{const cursor=p.result;if(cursor){const value=cursor.value;photos.push({...value,image:value.imageRef?null:value.image instanceof Blob?value.image:new Blob([value.image])});cursor.continue();}};t.oncomplete=()=>resolve({photos,content:c.result||emptyProgress(),receipts:r.result||{}});t.onerror=t.onabort=()=>reject(Error('备份数据读取失败。'));});for(const p of result.photos)if(p.imageRef)p.image=await resolveImage(p.imageRef);return result;}finally{db.close();}}
export async function collectPhotos(){const {photos}=await backupState(),map=new Map(photos.map(p=>[p.id,p]));for await(const deck of iterateStoredDecks())for(const photo of await readPhotos(new Uint8Array(deck.bytes))){const raw=map.get(photo.id);map.set(photo.id,{...photo,meta:{...photo.meta,...(raw?{deletedAt:raw.meta.deletedAt}: {})}});}return [...map.values()];}
export async function mergeBackup(photos:BackupPhoto[],remote:any){
 // Keep image files outside IndexedDB; commit their references only after validation.
 const existingPhotos=await collectPhotos();
 let added=0,unplayable=0;const committedImages:any[]=[];
 const db=await database();try{await new Promise<void>((resolve,reject)=>{
  const t=db.transaction(['backupPhotos','backupMeta'],'readwrite'),meta=t.objectStore('backupMeta'),store=t.objectStore('backupPhotos');
  const current=meta.get('progress'),raw=store.getAllKeys();raw.onsuccess=()=>{try{
   meta.put(mergeProgress(current.result||emptyProgress(),remote),'progress');
   const known=new Set([...raw.result,...existingPhotos.map(p=>p.id)]),rawIDs=new Set(raw.result);
   for(const p of existingPhotos)if(!rawIDs.has(p.id))store.add(p);
   for(const p of photos)if(!known.has(p.id)){known.add(p.id);const ref=fileReference(p.image);store.add(ref?{...p,image:undefined,imageRef:ref}:p);added++;committedImages.push(p.image);if(!p.meta.labels.length&&p.meta.deletedAt==null)unplayable++;}
  }catch{t.abort();}};
  t.oncomplete=()=>resolve();t.onerror=t.onabort=()=>reject(Error('恢复未能保存，原有照片与进度已保留。'));
 });}finally{db.close();}
 commitFiles(committedImages);window.dispatchEvent(new Event('piclex-backup-changed'));return {added,kept:photos.length-added,unplayable};
}
export async function recordPortableStudy(deck:any,state:any){
 const completed=await Promise.all(deck.words.filter((w:any)=>state.words[w.id]?.result).map(async(w:any)=>{const receipt=`spell:${deck.fingerprint}:${state.round}:${w.id}`;return {w,d:state.words[w.id],h:state.history[w.id],receipt,id:await stableID(receipt)};}));if(!completed.length)return;
 const db=await database();try{await new Promise<void>((resolve,reject)=>{const t=db.transaction('backupMeta','readwrite'),store=t.objectStore('backupMeta'),c=store.get('progress'),r=store.get('receipts');r.onsuccess=()=>{try{let content=c.result||emptyProgress();const receipts=r.result||{},progress=new Map<string,any>(content.progress.map((v:any)=>[v.wordKey,v])),events=new Map<string,any>(content.events.map((v:any)=>[v.id,v]));let changed=false;
 for(const {w,d,h,receipt,id} of completed){if(receipts[receipt])continue;receipts[receipt]=true;changed=true;if(events.has(id))continue;const wordKey=practiceWordKey(w),old=progress.get(wordKey),at=Date.now(),correct=d.result==='correct',counted=d.result!=='revealed';const streak=counted?(old?.streak||0)+1:0;progress.set(wordKey,{wordKey,attempts:(old?.attempts||0)+1,correctAnswers:(old?.correctAnswers||0)+(counted?1:0),streak,lastPracticedAt:at,nextReviewAt:at+(streak?[1,2,4,7,15,30][Math.min(streak-1,5)]*86400000:0),misspelledIndices:h?.mistakes||[]});if(!events.has(id))events.set(id,spellingEvent(id,wordKey,d.result,at));}
 if(changed){content={...content,progress:[...progress.values()],events:[...events.values()]};store.put(content,'progress');store.put(receipts,'receipts');}
 }catch{t.abort();}};t.oncomplete=()=>resolve();t.onerror=t.onabort=()=>reject(Error('跨端学习进度未能保存，请保留当前页面后重试。'));});}finally{db.close();}}
export async function portableHistory(deck:any){const {content}=await backupState(false);const records=new Map<string,any>(content.progress.map((r:any)=>[r.wordKey,r]));return Object.fromEntries(deck.words.flatMap((w:any)=>{const r=records.get(practiceWordKey(w));return r?[[w.id,{mastered:r.correctAnswers>0&&r.streak>0&&(!r.misspelledIndices||!r.misspelledIndices.length),mistakes:r.misspelledIndices||[]}]]:[];}));}
export async function setPhotoDeleted(photo:BackupPhoto,deleted:boolean){
 const value={...photo,...(photo.imageRef?{image:undefined}:{}),meta:{...photo.meta,deletedAt:deleted?Date.now():null}};
 const db=await database();try{await new Promise<void>((resolve,reject)=>{const t=db.transaction('backupPhotos','readwrite');t.objectStore('backupPhotos').put(value);t.oncomplete=()=>resolve();t.onerror=t.onabort=()=>reject(Error('照片状态未能保存，原照片仍在。'));});}finally{db.close();}
}
