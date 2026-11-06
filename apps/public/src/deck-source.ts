import {MAX_PACKAGE_BYTES} from '../../../packages/deck-format/src/archive.mjs';
export type SourceDeck={deckID:string;title:string;packageURL:string;packageBytes:number;packageSHA256:string;access:'public'|'storekit'};
const invalid=()=>{throw Error('这个链接不是有效的摄影学英语卡组来源。');};
export function deckURL(value:string){
 const text=value.trim();if(text.length>4096||/[\u0000-\u001f]/.test(text))invalid();
 let url:URL;try{url=new URL(text);}catch{return invalid();}
 if(!['https:','http:'].includes(url.protocol)||!url.hostname||url.username||url.password||url.hash)invalid();
 return url.href;
}
export function parseDeckSource(bytes:Uint8Array,source:string):SourceDeck[]{
 if(bytes.length>2*1024*1024)invalid();let doc:any;try{doc=JSON.parse(new TextDecoder().decode(bytes));}catch{return invalid();}
 if(doc?.format==='com.piclex.deck-subscription'&&doc.schemaVersion===1)doc={format:'com.piclex.deck-source',schemaVersion:1,decks:[{...doc,access:'public'}]};
 if(doc?.format!=='com.piclex.deck-source'||doc.schemaVersion!==1||!Array.isArray(doc.decks)||doc.decks.length>1000)invalid();
 const ids=new Set<string>();return doc.decks.map((entry:any)=>{
  if(!entry||typeof entry.deckID!=='string'||!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(entry.deckID)||ids.has(entry.deckID.toLowerCase())||typeof entry.title!=='string'||!entry.title.trim()||entry.title.length>80||!Number.isSafeInteger(entry.packageBytes)||entry.packageBytes<1||entry.packageBytes>MAX_PACKAGE_BYTES||typeof entry.packageSHA256!=='string'||!/^[\da-f]{64}$/.test(entry.packageSHA256)||!['public','storekit'].includes(entry.access)||typeof entry.packageURL!=='string'||entry.packageURL.startsWith('//'))invalid();
  ids.add(entry.deckID.toLowerCase());
  const packageURL=deckURL(entry.packageURL.startsWith('/')?new URL(entry.packageURL,source).href:entry.packageURL);
  if(new URL(packageURL).origin!==new URL(source).origin)invalid();
  return {deckID:entry.deckID.toLowerCase(),title:entry.title,packageURL,packageBytes:entry.packageBytes,packageSHA256:entry.packageSHA256,access:entry.access};
 });
}
