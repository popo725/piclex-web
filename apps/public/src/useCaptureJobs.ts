import {useEffect,useRef,useState} from 'react';
import {createPhotoDeck} from '../../../packages/deck-format/src/create.mjs';
import {analyzePhoto,type PhotoLabel,type PhotoQuote} from './capture-api';
import {captureDrafts,saveCaptureDraft,removeCaptureDraft,type CaptureDraft} from './capture-drafts';

export type CaptureJob=CaptureDraft & {phase:'queued'|'recognizing'|'saving'|'review'|'failed';message:string;deckID?:string;retrySave?:boolean;autoPractice:boolean};
export function useCaptureJobs(save:(bytes:Uint8Array,id:string)=>Promise<string>,notify:(message:string)=>void){
 const [jobs,setJobs]=useState<CaptureJob[]>([]),[ready,setReady]=useState(false);
 const current=useRef<CaptureJob[]>([]),chain=useRef(Promise.resolve()),requests=useRef(new Map<string,AbortController>()),callbacks=useRef({save,notify}),mounted=useRef(false);
 callbacks.current={save,notify};
 function patch(id:string,change:Partial<CaptureJob>){current.current=current.current.map(job=>job.id===id?{...job,...change}:job);if(mounted.current)setJobs(current.current);}
 useEffect(()=>{
  mounted.current=true;let cancelled=false;
  void captureDrafts().then(drafts=>{if(cancelled)return;current.current=drafts.sort((a,b)=>a.createdAt-b.createdAt).map(draft=>({...draft,phase:'failed',message:draft.labels.length?'词条已保留，点击重试保存。':'照片已保留，点击重试识别。',retrySave:!!draft.labels.length,autoPractice:false}));setJobs(current.current);}).catch(e=>{if(!cancelled)callbacks.current.notify(e.message);}).finally(()=>{if(!cancelled)setReady(true);});
  return()=>{cancelled=true;mounted.current=false;requests.current.forEach(controller=>controller.abort());};
 },[]);
 function run(id:string,recognize:boolean){
  if(requests.current.has(id))return;
  const controller=new AbortController();requests.current.set(id,controller);
  patch(id,{phase:'queued',message:'',retrySave:!recognize});
  // Persist immediately, including photos waiting behind an earlier request.
  const snapshot=current.current.find(value=>value.id===id)!;
  const prepared=saveCaptureDraft(snapshot).then(()=>null,error=>error as Error);
  chain.current=chain.current.then(async()=>{
   let job=current.current.find(value=>value.id===id);if(!job)return;
   let retrySave=!recognize;
   try{
    if(controller.signal.aborted)throw Error('已取消等待，照片已保留。');
    const prepareError=await prepared;if(prepareError)throw prepareError;
    if(recognize){
     patch(id,{phase:'recognizing'});let timedOut=false;
     const timer=setTimeout(()=>{timedOut=true;controller.abort();},60000);
     try{
      const result=await analyzePhoto(job.image,controller.signal);
      if(controller.signal.aborted)throw Error('已取消等待，照片已保留。');
      job={...job,labels:result.labels,quote:result.quote};retrySave=true;
      patch(id,{labels:job.labels,quote:job.quote,retrySave:true});
     }catch(e){throw Error(controller.signal.aborted?(timedOut?'识图等待超时，可以重试这张照片。':'已取消等待，照片已保留。'):(e as Error).message);}
     finally{clearTimeout(timer);}
     await saveCaptureDraft(job);
    }
    if(controller.signal.aborted)throw Error('已取消等待，照片已保留。');
    patch(id,{phase:'saving'});
    const bytes=await createPhotoDeck({image:job.image,title:job.title,labels:job.labels,quote:job.quote,id:job.id,date:job.createdAt});
    const deckID=await callbacks.current.save(bytes,`local-capture-${job.id}`);
    // A leftover draft after an interrupted cleanup can only replace this same deck.
    await removeCaptureDraft(id).catch(()=>{});
    patch(id,{phase:'review',deckID,message:'',retrySave:true});
   }catch(e){patch(id,{phase:'failed',message:(e as Error).message,retrySave,autoPractice:false});}
   finally{requests.current.delete(id);}
  });
 }
 function add(image:Uint8Array){
  const id=crypto.randomUUID(),job:CaptureJob={id,createdAt:Date.now(),image,title:'我的照片卡组',labels:[],quote:null,phase:'queued',message:'',autoPractice:true};
  current.current=[...current.current,job];setJobs(current.current);run(id,true);return id;
 }
 function edit(id:string,title:string,labels:PhotoLabel[],quote:PhotoQuote){patch(id,{title,labels,quote,autoPractice:false});run(id,false);}
 return {jobs,ready,add,edit,retry:(job:CaptureJob)=>run(job.id,!job.retrySave),cancel:(id:string)=>{requests.current.get(id)?.abort();patch(id,{autoPractice:false});},consume:(id:string)=>patch(id,{autoPractice:false})};
}
