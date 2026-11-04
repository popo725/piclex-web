import {useEffect,useRef,useState} from 'react';
import {downloadBytes} from '../../../packages/learning-ui/src/download.mjs';
import LoadProgress,{type DownloadProgress} from '../../../packages/learning-ui/src/LoadProgress';
import {MAX_PACKAGE_BYTES,sha256} from '../../../packages/deck-format/src/archive.mjs';
import {parseDeckSource,type SourceDeck,deckURL} from './deck-source';
import Dialog from './Dialog';

type Props={close:()=>void;installed:{id:string;fingerprint?:string}[];save:(bytes:Uint8Array,signal:AbortSignal)=>Promise<void>};
export default function DeckDownload({close,installed,save}:Props){
 const [url,setURL]=useState(''),[entries,setEntries]=useState<SourceDeck[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[progress,setProgress]=useState<DownloadProgress|null>(null);
 const request=useRef<AbortController|null>(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 function cancel(){request.current?.abort();close();}
 async function run(entry?:SourceDeck){
  if(busy)return;const c=new AbortController();request.current=c;setBusy(true);setError('');setProgress(null);
  try{
   const address=entry?.packageURL||deckURL(url);
   const {bytes}=await downloadBytes(address,{signal:c.signal,maxBytes:MAX_PACKAGE_BYTES,onProgress:setProgress,fetcher:(input,init)=>fetch(input,{...init,credentials:'omit',referrerPolicy:'no-referrer'})});
   c.signal.throwIfAborted();
   if(!entry&&bytes[0]!==0x50){
    if(bytes.length>2*1024*1024)throw Error('卡组来源文件过大。');
    const values=parseDeckSource(bytes,address);setEntries(values);return;
   }
   if(entry&&(bytes.length!==entry.packageBytes||await sha256(bytes)!==entry.packageSHA256))throw Error('卡组校验失败，原有卡组未改动。');
   c.signal.throwIfAborted();await save(bytes,c.signal);if(!c.signal.aborted)close();
  }catch(e){if(!c.signal.aborted)setError(e instanceof TypeError?'无法下载这个链接，请检查地址或改为导入卡组文件。':(e as Error).message);}
  finally{if(!c.signal.aborted){setBusy(false);setProgress(null);}}
 }
 let valid=false;try{deckURL(url);valid=true;}catch{}
 return <Dialog title="下载第三方卡组" close={cancel}><form className="deck-download-form" onSubmit={e=>{e.preventDefault();void run();}}><input autoFocus aria-label="粘贴卡组 URL" placeholder="粘贴卡组 URL" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={url} disabled={busy} onChange={e=>{setURL(e.target.value);setEntries(null);setError('');}}/><button className="settings-row" type="submit" disabled={!valid||busy}>下载卡组 <span aria-hidden="true">↓</span></button></form>{busy&&<><LoadProgress label="正在下载卡组" progress={progress}/><button className="text-button" onClick={()=>{request.current?.abort();setBusy(false);setProgress(null);}}>取消下载</button></>}{error&&<p role="alert">{error}</p>}{entries&&<section><h3>选择卡组</h3>{entries.map(entry=>{const exists=installed.some(c=>c.fingerprint===entry.packageSHA256);return <button className="settings-row" key={entry.deckID} disabled={busy||exists||entry.access!=='public'} onClick={()=>void run(entry)}><span>{entry.title}</span><small>{exists?'已下载':entry.access==='public'?'下载':'需在 App 中购买'}</small></button>;})}{!entries.length&&<p>这个来源暂时没有卡组。</p>}</section>}</Dialog>;
}
