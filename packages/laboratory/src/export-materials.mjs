// Exported packages have their own browser save slot; never migrate the sender's
// or another package's experience, achievements or active run into this slot.
export function browserSaveKey(key, scope=globalThis) {
  const id=scope.PICLEX_LAB_EXPORT?.id;
  return typeof id==='string'&&/^[a-f0-9-]{36}$/i.test(id) ? `${key}.export.${id}` : key;
}

export function exportedPhoto(value) {
  return typeof value==='string'&&/^\.\/photos\/[0-9]{1,3}\.jpg$/.test(value) ? value : '';
}

export function browserPhoto(value){if(typeof value!=='string'||!globalThis.PICLEX_PUBLIC_WEB)return '';try{const u=new URL(value,location.href);return u.origin===location.origin&&(u.protocol==='blob:'||u.pathname.startsWith('/piclex-web/library/'))?u.href:'';}catch{return '';}}
