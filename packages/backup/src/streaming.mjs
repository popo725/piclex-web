import {sha256} from '@noble/hashes/sha2.js';
export const MAX_BACKUP_BYTES=20*1024**3;
export const MAX_PROGRESS_BYTES=64*1024**2;
export const MAX_MANIFEST_BYTES=8*1024**2;
export const MAX_PHOTO_JSON_BYTES=2*1024**2;
export const MAX_COMPLETE_BYTES=MAX_BACKUP_BYTES+MAX_PROGRESS_BYTES+MAX_MANIFEST_BYTES+1024**2;
export const CHUNK_BYTES=512*1024;
const digests=new WeakMap(),references=new WeakMap();
export const fileReference=file=>references.get(file)?.reference;
export function commitFiles(files){for(const file of files){const value=references.get(file);if(value)value.job.kept.add(value.reference.file);}}
export async function resolveImage(reference){let root;try{root=await navigator.storage.getDirectory();}catch{throw Error('当前浏览器未开放文件存储，请使用普通窗口或更新浏览器后重试。');}const parent=await root.getDirectoryHandle('piclex-backup-transfers'),dir=await parent.getDirectoryHandle(reference.directory);return (await dir.getFileHandle(reference.file)).getFile();}
async function protectedDirectories(){const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('piclex-web-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{if(!db.objectStoreNames.contains('backupPhotos'))return new Set();return await new Promise((resolve,reject)=>{const dirs=new Set(),t=db.transaction('backupPhotos'),r=t.objectStore('backupPhotos').openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(c.value.imageRef)dirs.add(c.value.imageRef.directory);c.continue();}};t.oncomplete=()=>resolve(dirs);t.onerror=()=>reject(t.error);});}finally{db.close();}}
export const asBlob=value=>value instanceof Blob?value:new Blob([value]);
export const byteSize=value=>value instanceof Blob?value.size:value.byteLength;
export const abort=signal=>signal?.throwIfAborted();
export const sizeError=()=>Error('照片备份及解压内容不能超过20 GB，与 App 一致。');
export function checkSize(size,limit=MAX_BACKUP_BYTES){if(!Number.isSafeInteger(size)||size<0||size>limit)throw limit===MAX_PROGRESS_BYTES?Error('学习进度文件不能超过64 MB，与 App 一致。'):limit<MAX_BACKUP_BYTES?Error('备份中的元数据文件过大。'):sizeError();}
export function storageError(error){return error?.name==='QuotaExceededError'?Error('浏览器可用存储空间不足，现有照片和进度未删除。请释放空间后重试。'):error;}
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
/** @param {any} value @param {{signal?:AbortSignal,onProgress?:(done:number,total:number)=>void}} options */
export async function hashBlob(value,{signal,onProgress=(_done,_total)=>{}}={}){
 const blob=asBlob(value);if(digests.has(blob))return digests.get(blob);
 const hash=sha256.create();for(let offset=0;offset<blob.size;offset+=CHUNK_BYTES){abort(signal);hash.update(new Uint8Array(await blob.slice(offset,offset+CHUNK_BYTES).arrayBuffer()));onProgress(offset+Math.min(CHUNK_BYTES,blob.size-offset),blob.size);}
 const result=hex(hash.digest());digests.set(blob,result);return result;
}
export async function bytesOf(value,limit){checkSize(byteSize(value),limit);return value instanceof Uint8Array?value:new Uint8Array(await value.arrayBuffer());}
/** Each operation owns a private OPFS directory. No data directory is ever removed. */
export class BackupJob {
 static async create(signal,onProgress=(_progress)=>{}){
  abort(signal);if(!navigator.storage?.getDirectory)throw Error('当前浏览器不支持大文件暂存，请更新浏览器后重试。');
  let root;try{root=await navigator.storage.getDirectory();}catch{throw Error('当前浏览器未开放文件存储，请使用普通窗口或更新浏览器后重试。');}const parent=await root.getDirectoryHandle('piclex-backup-transfers',{create:true});
  // Expired download files are safe to remove only when their operation lock is free.
  const protectedNames=await protectedDirectories();
  if(navigator.locks)for await(const [name]of parent.entries())if(!protectedNames.has(name)&&/^job-\d+-[\da-f-]+$/.test(name)&&Date.now()-Number(name.split('-')[1])>86400000)await navigator.locks.request(name,{ifAvailable:true},async lock=>{if(lock)await parent.removeEntry(name,{recursive:true}).catch(()=>{});});
  const name='job-'+Date.now()+'-'+crypto.randomUUID(),directory=await parent.getDirectoryHandle(name,{create:true});
  const job=new BackupJob(parent,directory,name,signal,onProgress);
  if(navigator.locks){let ready;const started=new Promise(resolve=>ready=resolve);job.lock=navigator.locks.request(name,async()=>{ready();await new Promise(resolve=>job.unlock=resolve);});await started;}
  return job;
 }
 constructor(parent,directory,name,signal,onProgress){Object.assign(this,{parent,directory,name,signal,onProgress});this.sequence=0;this.kept=new Set();this.downloadFiles=new Set();this.closed=false;}
 async writer(limit=MAX_BACKUP_BYTES){
  abort(this.signal);const name=String(++this.sequence),handle=await this.directory.getFileHandle(name,{create:true}),disk=await handle.createWritable();
  let size=0;const hash=sha256.create(),signal=this.signal;
  const writable=new WritableStream({write:async chunk=>{try{abort(signal);checkSize(size+chunk.byteLength,limit);hash.update(chunk);size+=chunk.byteLength;await disk.write(chunk);}catch(e){await disk.abort().catch(()=>{});throw storageError(e);}},close:()=>disk.close(),abort:()=>disk.abort().catch(()=>{})});
  return {writable,finish:async()=>{const file=await handle.getFile();digests.set(file,hex(hash.digest()));references.set(file,{job:this,reference:{directory:this.name,file:name}});return file;}};
 }
 async receive(stream,limit,total=0){
  if(total)checkSize(total,limit);
  // Storage estimates may be padded or stale. The actual disk writer enforces
  // quota; a conservative estimate must not reject a valid large backup.
  const sink=await this.writer(limit);let done=0;
  const progress=new TransformStream({transform:(chunk,controller)=>{done+=chunk.byteLength;this.onProgress({done,total});controller.enqueue(chunk);}});
  await stream.pipeThrough(progress).pipeTo(sink.writable,{signal:this.signal});return sink.finish();
 }
 retainDownload(file){const ref=fileReference(file);if(ref?.directory===this.name)this.downloadFiles.add(ref.file);}
 async close(){if(this.closed)return;this.closed=true;try{const keep=new Set([...this.kept,...this.downloadFiles]);if(keep.size){const names=[];for await(const [name]of this.directory.entries())names.push(name);for(const name of names)if(!keep.has(name))await this.directory.removeEntry(name);}else await this.parent.removeEntry(this.name,{recursive:true});}finally{this.unlock?.();await this.lock;}}
}
