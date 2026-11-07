import {useEffect,useRef,useState} from 'react';
import Dialog from './Dialog';
import {listSubscriptions,checkSubscription,updateSubscription,cancelSubscription,resumeSubscription,type DeckSubscriptionRecord} from './deck-subscriptions';
export default function SubscriptionSettings({notify}:{notify:(message:string)=>void}){
 const [records,setRecords]=useState<DeckSubscriptionRecord[]>([]),[selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[available,setAvailable]=useState<Record<string,number>>({}),[statuses,setStatuses]=useState<Record<string,string>>({}),[confirming,setConfirming]=useState(false);
 const controller=useRef<AbortController|null>(null),refresh=()=>listSubscriptions().then(setRecords),record=records.find(r=>r.id===selected);
 useEffect(()=>{void refresh().catch(e=>notify(e.message));return()=>controller.current?.abort();},[]);
 function close(){controller.current?.abort();setSelected('');setConfirming(false);}
 async function run(action:(signal:AbortSignal)=>Promise<string>){if(busy||!record)return;const c=new AbortController();controller.current=c;setBusy(true);try{const message=await action(c.signal);if(!c.signal.aborted){setStatuses(s=>({...s,[record.id]:message}));await refresh();}}catch(e){if(!c.signal.aborted)notify((e as Error).message);}finally{setBusy(false);}}
 if(!records.length)return null;
 return <section aria-label="订阅管理">{records.map(r=><button key={r.id} className="settings-row" onClick={()=>setSelected(r.id)} aria-label={`管理订阅：${r.title}`}><span>{r.title}</span><span className="settings-value">v{r.version} · {r.active?'管理订阅':'已取消订阅'} ›</span></button>)}{record&&<Dialog title={record.title} close={close}><section aria-label="订阅详情">
 <p>当前版本 <strong>v{record.version}</strong> · {record.photoCount} 张卡片 · {record.wordCount} 个单词</p><p className="muted">{record.author} · {new URL(record.sourceURL).host}</p>
 <button className="settings-row" disabled={busy} onClick={()=>void run(async signal=>{
  if(!record.active){await resumeSubscription(record.id,signal);return '已恢复订阅';}
  if(available[record.id]){const result=await updateSubscription(record.id,{signal});setAvailable(a=>{const next={...a};delete next[record.id];return next;});return result.status==='unchanged'?'已是最新版本':`已更新至 v${result.version}，照片和学习进度已保留。`;}
  const result=await checkSubscription(record,{signal});if(result.status==='available'){setAvailable(a=>({...a,[record.id]:result.feed.version}));return `发现 v${result.feed.version} · ${result.feed.photoCount} 张卡片`;}
  return '已是最新版本';
 })}>{busy?'正在处理…':!record.active?'恢复订阅':available[record.id]?`更新至 v${available[record.id]}`:'检查更新'}</button>
 {!record.active&&<p>已取消订阅，照片已保留</p>}{statuses[record.id]&&<p role="status">{statuses[record.id]}</p>}
 {record.active&&<button className="text-button" disabled={busy} onClick={()=>setConfirming(true)}>取消订阅</button>}
 {confirming&&<div role="group" aria-label="确认取消订阅"><p>取消订阅？已下载卡片和学习记录会保留。</p><button className="native-button" disabled={busy} onClick={()=>void run(async signal=>{await cancelSubscription(record.id,signal);setConfirming(false);return '已取消订阅，照片和学习进度已保留。';})}>确认取消订阅</button><button className="text-button" onClick={()=>setConfirming(false)}>继续订阅</button></div>}
 {busy&&<button className="text-button" onClick={()=>controller.current?.abort()}>取消下载</button>}
 </section></Dialog>}</section>;
}
