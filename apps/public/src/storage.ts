import type {DeckSubscriptionRecord} from './deck-subscriptions';

const databaseName = 'piclex-web-v1';
const databaseVersion = 3;
export type StoredDeck = { id: string; bytes: ArrayBuffer; title: string; addedAt: number; progressAliases?: string[]; subscribed?: boolean };

function abortError() {
  try { return new DOMException('已取消。', 'AbortError'); } catch { return Error('已取消。'); }
}
function ensureStores(request: IDBOpenDBRequest) {
  const db = request.result;
  for (const name of ['decks', 'backupPhotos']) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, {keyPath: 'id'});
  if (!db.objectStoreNames.contains('backupMeta')) db.createObjectStore('backupMeta');
  if (!db.objectStoreNames.contains('subscriptions')) db.createObjectStore('subscriptions', {keyPath: 'id'});
}

export function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => ensureStores(request);
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => reject(new Error('浏览器无法保存卡组，请检查存储权限。'));
    request.onblocked = () => reject(new Error('请关闭其他 摄影学英语 页面后重试。'));
  });
}
export async function storedDecks(): Promise<StoredDeck[]> {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const transaction = db.transaction('decks', 'readonly');
    const request = transaction.objectStore('decks').getAll();
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = transaction.onabort = () => reject(new Error('暂时无法读取本地卡组。'));
  }); } finally { db.close(); }
}
export async function saveDeck(deck: StoredDeck) {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('decks', 'readwrite');
    transaction.objectStore('decks').put(deck);
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () => reject(new Error('本地空间不足，卡组未保存。请保留原文件。'));
  }); } finally { db.close(); }
}

/** Deck bytes, progress aliases and subscription metadata commit together. */
export async function saveDeckAndSubscription(deck: StoredDeck, record: DeckSubscriptionRecord, signal?: AbortSignal, expected?: {record?:DeckSubscriptionRecord;deck?:StoredDeck}) {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => {
    let settled = false, transaction: IDBTransaction;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', abort);
      if (error) reject(error); else resolve();
    };
    const abort = () => { try { transaction?.abort(); } catch { /* already finished */ } finish(abortError()); };
    if (signal?.aborted) { finish(abortError()); return; }
    try { transaction = db.transaction(['decks', 'subscriptions'], 'readwrite'); }
    catch (error) { finish(Error('订阅状态未能保存，请检查浏览器存储权限后重试。')); return; }
    transaction.oncomplete = () => finish();
    transaction.onerror = transaction.onabort = () => finish(signal?.aborted ? abortError() : Error('本地空间不足，卡组未保存。请保留原文件。'));
    signal?.addEventListener('abort', abort, {once: true});
    try {
      const decks=transaction.objectStore('decks'),subscriptions=transaction.objectStore('subscriptions');
      const put=()=>{try{decks.put(deck);subscriptions.put(record);}catch{transaction.abort();finish(Error('本地空间不足，卡组未保存。请保留原文件。'));}};
      if(!expected)put();else{const r=subscriptions.get(record.id);r.onsuccess=()=>{
        if(JSON.stringify(r.result)!==JSON.stringify(expected.record)){transaction.abort();finish(Error('订阅已在其他页面变化，请重新检查更新。'));return;}
        const d=decks.get(deck.id);d.onsuccess=()=>{const old=d.result as StoredDeck|undefined,wanted=expected.deck,oldBytes=old?new Uint8Array(old.bytes):undefined,wantedBytes=wanted?new Uint8Array(wanted.bytes):undefined;
          if(!!old!==!!wanted||old&&wanted&&(old.bytes.byteLength!==wanted.bytes.byteLength||oldBytes!.some((v,i)=>v!==wantedBytes![i]))){transaction.abort();finish(Error('本地卡组已变化，请重新检查更新。'));return;}put();};
      };}
    } catch (error) { try { transaction.abort(); } catch { /* already finished */ } finish(error); }
  }); } finally { db.close(); }
}

export async function storedSubscriptions(): Promise<DeckSubscriptionRecord[]> {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const transaction = db.transaction('subscriptions', 'readonly');
    const request = transaction.objectStore('subscriptions').getAll();
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = transaction.onabort = () => reject(new Error('订阅记录暂时无法读取，已下载卡组仍然保留。'));
  }); } finally { db.close(); }
}
export async function loadStoredSubscription(id: string): Promise<DeckSubscriptionRecord | undefined> {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const transaction = db.transaction('subscriptions', 'readonly');
    const request = transaction.objectStore('subscriptions').get(id);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = transaction.onabort = () => reject(new Error('订阅记录暂时无法读取，已下载卡组仍然保留。'));
  }); } finally { db.close(); }
}
export async function saveStoredSubscription(record: DeckSubscriptionRecord, signal?: AbortSignal, expected?: DeckSubscriptionRecord) {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => {
    let settled = false, transaction: IDBTransaction;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', abort);
      if (error) reject(error); else resolve();
    };
    const abort = () => { try { transaction?.abort(); } catch { /* already finished */ } finish(abortError()); };
    if (signal?.aborted) { finish(abortError()); return; }
    try { transaction = db.transaction('subscriptions', 'readwrite'); }
    catch { finish(Error('订阅状态未能保存，请检查浏览器存储权限后重试。')); return; }
    transaction.oncomplete = () => finish();
    transaction.onerror = transaction.onabort = () => finish(signal?.aborted ? abortError() : Error('订阅状态未能保存，请检查浏览器存储权限后重试。'));
    signal?.addEventListener('abort', abort, {once: true});
    try { const store=transaction.objectStore('subscriptions');if(!expected)store.put(record);else{const r=store.get(record.id);r.onsuccess=()=>{if(JSON.stringify(r.result)!==JSON.stringify(expected)){transaction.abort();finish(Error('订阅已在其他页面变化，请刷新后重试。'));return;}try{store.put(record);}catch{transaction.abort();finish(Error('订阅状态未能保存，请检查浏览器存储权限后重试。'));}};} }
    catch (error) { try { transaction.abort(); } catch { /* already finished */ } finish(error); }
  }); } finally { db.close(); }
}

export function readPreference(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
export function writePreference(key: string, value: string) { try { localStorage.setItem(key, value); return true; } catch { return false; } }

export async function storedDeckIDs():Promise<string[]>{const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('decks','readonly').objectStore('decks').getAllKeys();r.onsuccess=()=>resolve(r.result as string[]);r.onerror=()=>reject(r.error);});}finally{db.close();}}
export async function loadStoredDeck(id:string):Promise<StoredDeck|undefined>{const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('decks','readonly').objectStore('decks').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
export async function* iterateStoredDecks(){for(const id of await storedDeckIDs()){const value=await loadStoredDeck(id);if(value)yield value;}}
