const databaseName = 'piclex-web-v1';
export type StoredDeck = { id: string; bytes: ArrayBuffer; title: string; addedAt: number; progressAliases?: string[]; subscribed?: boolean };
export function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 2);
    request.onupgradeneeded = () => {for(const name of ['decks','backupPhotos'])if(!request.result.objectStoreNames.contains(name))request.result.createObjectStore(name,{keyPath:'id'});if(!request.result.objectStoreNames.contains('backupMeta'))request.result.createObjectStore('backupMeta');};
    request.onsuccess = () => {request.result.onversionchange=()=>request.result.close();resolve(request.result);};
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
export function readPreference(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
export function writePreference(key: string, value: string) { try { localStorage.setItem(key, value); return true; } catch { return false; } }
