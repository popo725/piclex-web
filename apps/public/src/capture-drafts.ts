import type {PhotoLabel,PhotoQuote} from './capture-api';

export type CaptureDraft = {id:string;createdAt:number;image:Uint8Array;title:string;labels:PhotoLabel[];quote:PhotoQuote};
// Pending photos survive reload independently of the completed deck library.
function database():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('photography-english-capture-v1',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('drafts',{keyPath:'id'});
  request.onsuccess=()=>resolve(request.result);
  request.onerror=request.onblocked=()=>reject(Error('照片暂时无法保存，请检查浏览器存储空间后重试。'));
 });
}
async function transact<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const db=await database();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('drafts',mode),request=action(tx.objectStore('drafts'));
  tx.oncomplete=()=>resolve(request.result);
  tx.onerror=tx.onabort=()=>reject(Error('照片暂时无法保存，请检查浏览器存储空间后重试。'));
 });}finally{db.close();}
}
export const captureDrafts=()=>transact<CaptureDraft[]>('readonly',store=>store.getAll());
export const saveCaptureDraft=(draft:CaptureDraft)=>transact('readwrite',store=>store.put(draft));
export const removeCaptureDraft=(id:string)=>transact('readwrite',store=>store.delete(id));
