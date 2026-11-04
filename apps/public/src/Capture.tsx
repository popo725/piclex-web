import {NativeIcon as Icon} from '../../../packages/learning-ui/src/NativeIcon';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {PhotoLabel} from './capture-api';
import {useCaptureJobs,type CaptureJob} from './useCaptureJobs';
import './capture.css';
const blank=():PhotoLabel=>({english:'',chinese:'',example:'',exampleChinese:''});
const busy=(job:CaptureJob)=>['queued','recognizing','saving'].includes(job.phase);
async function jpeg(canvas:HTMLCanvasElement){
 for(const quality of [.9,.75,.55]){
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('照片暂时无法读取。')),'image/jpeg',quality));
  if(blob.size<=3*1024*1024)return blob;
 }
 throw Error('照片过大，请换一张照片。');
}
function imageCanvas(width:number,height:number){
 const scale=Math.min(1,1600/Math.max(width,height)),canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));return canvas;
}
export default function Capture({active,save,learn,notify}:{active:boolean;save:(bytes:Uint8Array,id:string)=>Promise<string>;learn:(id?:string)=>void;notify:(s:string)=>void}){
 const picker=useRef<HTMLInputElement>(null),video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),generation=useRef(0);
 const [opening,setOpening]=useState(false),[live,setLive]=useState(false),[cameraReady,setCameraReady]=useState(false),[preparing,setPreparing]=useState(false);
 const flow=useCaptureJobs(save,notify),[presented,setPresented]=useState<string|null>(null),[printing,setPrinting]=useState(false);
 const job=flow.jobs.find(value=>value.id===presented);
 const stopCamera=useCallback(()=>{generation.current++;stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(video.current)video.current.srcObject=null;setOpening(false);setLive(false);setCameraReady(false);},[]);
 useEffect(()=>{if(!active){stopCamera();setPrinting(false);}},[active,stopCamera]);
 useEffect(()=>{const hide=()=>{if(document.hidden){stopCamera();setPrinting(false);}};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stopCamera);window.addEventListener('hashchange',stopCamera);return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',stopCamera);window.removeEventListener('hashchange',stopCamera);stopCamera();};},[stopCamera]);
 useEffect(()=>{if(live&&video.current&&stream.current){video.current.srcObject=stream.current;void video.current.play().catch(()=>{stopCamera();notify('相机预览无法播放，请重试或导入照片。');});}},[live,notify,stopCamera]);
 useEffect(()=>{if(!printing)return;const timer=setTimeout(()=>setPrinting(false),700);return()=>clearTimeout(timer);},[printing]);
 async function accept(blob:Blob){const id=flow.add(new Uint8Array(await blob.arrayBuffer()));setPresented(id);}
 async function choose(file?:File){
  if(!file)return;stopCamera();setPreparing(true);
  try{if(!file.type.startsWith('image/')||file.size>20*1024*1024)throw Error('请选择 20 MB 以内的照片。');
   const image=await createImageBitmap(file);try{const canvas=imageCanvas(image.width,image.height);canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);await accept(await jpeg(canvas));}finally{image.close();}
  }catch(e){notify((e as Error).message);}finally{setPreparing(false);if(picker.current)picker.current.value='';}
 }
 async function camera(){
  if(live){if(!cameraReady||!video.current)return;setPreparing(true);setPrinting(true);try{const canvas=imageCanvas(video.current.videoWidth,video.current.videoHeight);canvas.getContext('2d')!.drawImage(video.current,0,0,canvas.width,canvas.height);const blob=await jpeg(canvas);stopCamera();await accept(blob);}catch(e){setPrinting(false);notify((e as Error).message);}finally{setPreparing(false);}return;}
  if(!navigator.mediaDevices?.getUserMedia){notify('当前浏览器无法打开相机，请使用 HTTPS 页面或导入照片。');return;}
  const token=++generation.current;setOpening(true);
  try{const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1600}},audio:false});
   if(token!==generation.current||document.hidden){media.getTracks().forEach(t=>t.stop());return;}
   stream.current=media;setOpening(false);setLive(true);
  }catch(e){if(token!==generation.current)return;setOpening(false);const name=(e as DOMException).name;notify(name==='NotAllowedError'?'相机权限未开启，请在浏览器中允许相机，或导入照片。':name==='NotFoundError'?'未找到可用相机，可以导入照片制卡。':'相机暂时无法使用，请关闭其他占用相机的应用，或导入照片。');}
 }
 function resume(){if(job)flow.consume(job.id);setPresented(null);setPrinting(false);}
 const pending=flow.jobs.filter(value=>value.id!==presented);
 return <main className={`capture-page ${job?'capture-result-page':''}`} aria-label="拍摄">
  {job?<CaptureReview key={job.id} job={job} active={active} settled={!printing} consume={()=>flow.consume(job.id)} retry={()=>flow.retry(job)} cancel={()=>flow.cancel(job.id)} edit={(title,labels)=>flow.edit(job.id,title,labels,job.quote)} start={()=>{if(job.deckID){flow.consume(job.id);setPresented(null);learn(job.deckID);}}} resume={resume}/>:<div className="capture-viewfinder">
   <div className="camera-paper">
    {live?<video ref={video} autoPlay muted playsInline aria-label="相机实时预览" onLoadedData={()=>setCameraReady(true)}/>:<button className="camera-empty" aria-label="打开相机" onClick={()=>void camera()} disabled={!flow.ready||preparing||opening}><Icon name="camera"/><span>{opening?'请在浏览器中允许相机权限':'点击开启相机'}</span><small>{opening?'等待你的授权…':'首次使用会请求相机权限'}</small></button>}
    {(opening||live)&&<button className="camera-close native-button" onClick={stopCamera}>关闭相机</button>}
   </div>
   <div className="capture-controls"><button className="native-button" onClick={()=>picker.current?.click()} disabled={!flow.ready||preparing}>导入照片</button><button className="shutter" aria-label={live?'拍下这张照片':'拍摄照片'} onClick={()=>void camera()} disabled={!flow.ready||preparing||opening||(live&&!cameraReady)}><span/></button><button className="native-button" onClick={()=>learn()}>开始练习</button></div>
   <p className="capture-upload-hint">拍摄或导入后，照片将自动上传进行 AI 识图</p>
   {preparing&&<p className="capture-status" role="status">正在准备照片…</p>}
  </div>}
  <input hidden type="file" ref={picker} accept="image/*" aria-label="导入照片制卡" onChange={e=>void choose(e.target.files?.[0])}/>
  {pending.length>0&&<div className="capture-recent" aria-label="本次拍摄的卡片">{pending.map((value,index)=><button key={value.id} className="native-button" onClick={()=>{stopCamera();flow.consume(value.id);setPresented(value.id);}}>照片 {index+1} · {busy(value)?'正在生成':value.phase==='review'?'已保存':'待重试'}</button>)}</div>}
  {printing&&active&&<div className="capture-printing" aria-label="正在出片"><span/></div>}
 </main>;
}

function CaptureReview({job,active,settled,consume,retry,cancel,edit,start,resume}:{job:CaptureJob;active:boolean;settled:boolean;consume:()=>void;retry:()=>void;cancel:()=>void;edit:(title:string,labels:PhotoLabel[])=>void;start:()=>void;resume:()=>void}){
 const [preview,setPreview]=useState(''),[loaded,setLoaded]=useState(false),[seconds,setSeconds]=useState<number|null>(null),[editing,setEditing]=useState(false),[title,setTitle]=useState(job.title),[labels,setLabels]=useState<PhotoLabel[]>(job.labels.length?job.labels:[blank()]),[selected,setSelected]=useState<number|null>(null);
 const countdown=useRef<ReturnType<typeof setInterval>|null>(null),consumed=useRef(!job.autoPractice),latest=useRef({start,consume,active});latest.current={start,consume,active};
 const processing=busy(job);
 const stopCountdown=useCallback(()=>{if(countdown.current)clearInterval(countdown.current);countdown.current=null;setSeconds(null);consumed.current=true;latest.current.consume();},[]);
 useEffect(()=>{const url=URL.createObjectURL(new Blob([job.image.slice().buffer],{type:'image/jpeg'}));setPreview(url);return()=>URL.revokeObjectURL(url);},[job.image]);
 useEffect(()=>{
  const hide=()=>{if(document.hidden)stopCountdown();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stopCountdown);
  return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',stopCountdown);if(countdown.current)clearInterval(countdown.current);};
 },[stopCountdown]);
 useEffect(()=>{if(!active&&!processing)stopCountdown();},[active,processing,stopCountdown]);
 useEffect(()=>{
  if(job.phase!=='review'||!settled||!loaded||editing||consumed.current||!job.autoPractice)return;
  if(!active||document.hidden){stopCountdown();return;}
  consumed.current=true;let remaining=3;setSeconds(remaining);
  countdown.current=setInterval(()=>{remaining--;if(remaining>0){setSeconds(remaining);return;}stopCountdown();if(latest.current.active&&!document.hidden)latest.current.start();},1000);
 },[job.phase,job.autoPractice,settled,loaded,editing,active,stopCountdown]);
 function openEditor(){stopCountdown();setTitle(job.title);setLabels(job.labels.length?job.labels:[blank()]);setEditing(true);}
 function saveEdit(){stopCountdown();edit(title,labels);setEditing(false);}
 function interact(){if(seconds!==null)stopCountdown();}
 const currentLabel=selected===null?null:job.labels[selected];
 return <section className="capture-review" aria-label="照片卡片预览" onPointerDownCapture={interact} onKeyDownCapture={interact} onWheelCapture={interact}>
  <div className={`capture-card ${processing?'is-processing':''}`}>
   <div className="capture-annotated-photo">
    {preview&&<img src={preview} alt="拍摄后的照片卡片" onLoad={()=>setLoaded(true)}/>}
    {processing&&<span className="capture-scan" aria-hidden="true"/>}
    {job.labels.map((label,index)=>{
     const a=label.anchor,b=label.bbox,visible=label.relation==='visible'&&a?.length===2&&b?.length===4&&a.every(Number.isFinite)&&b.every(Number.isFinite)&&b[0]>=0&&b[1]>=0&&b[2]<=1000&&b[3]<=1000&&b[2]>b[0]&&b[3]>b[1]&&a[0]>=b[0]&&a[0]<=b[2]&&a[1]>=b[1]&&a[1]<=b[3];
     if(!visible)return null;
     return <div key={index} className="capture-annotation">
      {selected===index&&<span className="capture-object-box" style={{left:`${b[0]/10}%`,top:`${b[1]/10}%`,width:`${(b[2]-b[0])/10}%`,height:`${(b[3]-b[1])/10}%`}}/>}
      <button className="capture-photo-label" aria-pressed={selected===index} onClick={()=>setSelected(selected===index?null:index)} style={{left:`${Math.max(18,Math.min(82,a[0]/10))}%`,top:`${Math.max(10,Math.min(90,a[1]/10))}%`}}><strong>{label.english}</strong><span>{label.chinese}</span></button>
     </div>;
    })}
   </div>
   {!!job.labels.length&&<div className="capture-vocabulary" aria-label="识别词汇">{job.labels.map((label,index)=><button key={index} aria-pressed={selected===index} onClick={()=>setSelected(selected===index?null:index)}>{label.english}<span>{label.chinese}</span></button>)}</div>}
   {currentLabel&&<div className="capture-label-detail"><strong>{currentLabel.english} {currentLabel.phoneticUS||currentLabel.phoneticUK}</strong><p>{currentLabel.example}</p><small>{currentLabel.exampleChinese}</small></div>}
   {job.quote&&(job.quote.chinese||job.quote.english)&&<blockquote className="capture-quote"><p>{job.quote.chinese}</p><p>{job.quote.english}</p>{job.quote.source&&<cite>{job.quote.source}</cite>}</blockquote>}
  </div>
  {processing?<><p className="capture-status" role="status"><span className="capture-spinner"/>{job.phase==='queued'?'正在准备识图…':job.phase==='recognizing'?'正在识图并生成卡片…':'正在保存卡片…'}</p><div className="capture-review-actions">{job.phase!=='saving'&&<button className="native-button" onClick={cancel}>取消等待</button>}<button className="native-button" onClick={resume}>继续拍摄</button></div></>:editing?<form className="capture-editor" aria-label="编辑照片卡片" onSubmit={e=>{e.preventDefault();saveEdit();}}>
   <label>卡组名称<input value={title} maxLength={80} required onChange={e=>setTitle(e.target.value)}/></label>
   {labels.map((label,i)=><fieldset key={i}><legend>词条 {i+1}</legend>{([['english','英文'],['chinese','中文释义'],['example','英文例句（可选）'],['exampleChinese','例句中文（可选）']] as const).map(([key,name])=><label key={key}>{name}<input value={label[key]||''} required={key==='english'||key==='chinese'} maxLength={key.includes('example')?2000:200} onChange={e=>setLabels(v=>v.map((l,n)=>n===i?{...l,[key]:e.target.value}:l))}/></label>)}{labels.length>1&&<button type="button" className="text-button" onClick={()=>setLabels(v=>v.filter((_,n)=>n!==i))}>移除此词条</button>}</fieldset>)}
   <button type="button" className="native-button" onClick={()=>setLabels(v=>[...v,blank()])} disabled={labels.length>=100}>添加词条</button><div className="capture-review-actions"><button type="button" className="native-button" onClick={()=>setEditing(false)}>取消编辑</button><button className="native-primary" type="submit">保存修改</button></div>
  </form>:<>
   {job.phase==='failed'&&<p className="capture-status capture-error" role="status">{job.message}</p>}
   {seconds!==null?<button className="capture-countdown native-primary" onClick={stopCountdown}>{seconds}秒后进入拼写，点击取消</button>:<div className="capture-review-actions">
    <button className="native-button" onClick={openEditor}>{job.labels.length?'编辑卡片':'手动填写'}</button>
    {job.phase==='failed'?<button className="native-primary" onClick={retry}>{job.retrySave?'重试保存':'重试识别'}</button>:<button className="native-primary" onClick={start}>开练</button>}
    <button className="native-button" onClick={resume}>继续拍摄</button>
   </div>}
  </>}
 </section>;
}
