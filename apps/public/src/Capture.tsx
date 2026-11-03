import {NativeIcon as Icon} from '../../../packages/learning-ui/src/NativeIcon';
import {useCallback,useEffect,useRef,useState} from 'react';
import {createPhotoDeck} from '../../../packages/deck-format/src/create.mjs';
import {analyzePhoto,readCaptureQuota,type PhotoLabel,type PhotoQuote,type Quota} from './capture-api';
import './capture.css';
const blank=():PhotoLabel=>({english:'',chinese:'',example:'',exampleChinese:''});
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
export default function Capture({active,save,learn,notify}:{active:boolean;save:(bytes:Uint8Array)=>Promise<void>;learn:()=>void;notify:(s:string)=>void}){
 const picker=useRef<HTMLInputElement>(null),video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),generation=useRef(0),request=useRef<AbortController|null>(null);
 const [photo,setPhoto]=useState<Uint8Array|null>(null),[preview,setPreview]=useState(''),[title,setTitle]=useState('我的照片卡组');
 const [working,setWorking]=useState<'photo'|'save'|'ai'|null>(null),[opening,setOpening]=useState(false),[live,setLive]=useState(false),[cameraReady,setCameraReady]=useState(false);
 const [labels,setLabels]=useState<PhotoLabel[]>([blank()]),[quote,setQuote]=useState<PhotoQuote>(null),[quota,setQuota]=useState<Quota|null>(null),[message,setMessage]=useState(''),[attempted,setAttempted]=useState(false);
 const stopCamera=useCallback(()=>{generation.current++;stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(video.current)video.current.srcObject=null;setOpening(false);setLive(false);setCameraReady(false);},[]);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 useEffect(()=>{if(!active)stopCamera();},[active,stopCamera]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stopCamera();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stopCamera);return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',stopCamera);stopCamera();request.current?.abort();};},[stopCamera]);
 useEffect(()=>{if(live&&video.current&&stream.current){video.current.srcObject=stream.current;void video.current.play().catch(()=>{stopCamera();notify('相机预览无法播放，请重试或导入照片。');});}},[live,notify,stopCamera]);
 useEffect(()=>{if(!active)return;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);void readCaptureQuota(controller.signal).then(setQuota).catch(()=>{});return()=>{clearTimeout(timer);controller.abort();};},[active]);
 async function accept(blob:Blob){setPhoto(new Uint8Array(await blob.arrayBuffer()));setPreview(URL.createObjectURL(blob));setLabels([blank()]);setQuote(null);setMessage('');setAttempted(false);}
 async function choose(file?:File){
  if(!file)return;stopCamera();setWorking('photo');
  try{if(!file.type.startsWith('image/')||file.size>20*1024*1024)throw Error('请选择 20 MB 以内的照片。');
   const image=await createImageBitmap(file);try{const canvas=imageCanvas(image.width,image.height);canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);await accept(await jpeg(canvas));}finally{image.close();}
  }catch(e){notify((e as Error).message);}finally{setWorking(null);if(picker.current)picker.current.value='';}
 }
 async function camera(){
  if(live){if(!cameraReady||!video.current)return;setWorking('photo');try{const canvas=imageCanvas(video.current.videoWidth,video.current.videoHeight);canvas.getContext('2d')!.drawImage(video.current,0,0,canvas.width,canvas.height);const blob=await jpeg(canvas);stopCamera();await accept(blob);}catch(e){notify((e as Error).message);}finally{setWorking(null);}return;}
  if(!navigator.mediaDevices?.getUserMedia){notify('当前浏览器无法打开相机，请使用 HTTPS 页面或导入照片。');return;}
  const token=++generation.current;setOpening(true);
  try{const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1600}},audio:false});
   if(token!==generation.current||document.hidden){media.getTracks().forEach(t=>t.stop());return;}
   stream.current=media;setOpening(false);setLive(true);
  }catch(e){if(token!==generation.current)return;setOpening(false);const name=(e as DOMException).name;notify(name==='NotAllowedError'?'相机权限未开启，请在浏览器中允许相机，或导入照片。':name==='NotFoundError'?'未找到可用相机，可以导入照片制卡。':'相机暂时无法使用，请关闭其他占用相机的应用，或导入照片。');}
 }
 async function recognize(){
  if(!photo||working)return;const controller=new AbortController();request.current=controller;setWorking('ai');setMessage('正在识图并生成词汇、例句…');setAttempted(true);
  let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller.abort();},60000);
  try{const result=await analyzePhoto(photo,controller.signal);if(controller.signal.aborted)return;setLabels(result.labels);setQuote(result.quote);setQuota(result.quota);setMessage(`已生成 ${result.labels.length} 个词条，可检查修改后保存。`);}
  catch(e){setMessage(controller.signal.aborted?(timedOut?'识图等待超时，可以重试这张照片。':'已取消等待，照片已保留。'):(e as Error).message);}
  finally{clearTimeout(timer);request.current=null;setWorking(null);const refresh=new AbortController();const timeout=setTimeout(()=>refresh.abort(),10000);void readCaptureQuota(refresh.signal).then(setQuota).catch(()=>{}).finally(()=>clearTimeout(timeout));}
 }
 async function submit(){if(!photo||working)return;setWorking('save');try{await save(await createPhotoDeck({image:photo,title,labels,quote}));setPhoto(null);setPreview('');setLabels([blank()]);setQuote(null);setMessage('');setAttempted(false);}catch(e){notify((e as Error).message);}finally{setWorking(null);}}
 return <main className="capture-page" aria-label="拍摄">
  <div className="capture-viewfinder">
  <div className={`camera-paper ${photo?'has-photo':''}`}>
   {live?<video ref={video} autoPlay muted playsInline aria-label="相机实时预览" onLoadedData={()=>setCameraReady(true)}/>:preview?<img src={preview} alt="准备制卡的照片"/>:<button className="camera-empty" aria-label="打开相机" onClick={()=>void camera()} disabled={!!working||opening}><Icon name="camera"/><span>{opening?'请在浏览器中允许相机权限':'点击开启相机'}</span><small>{opening?'等待你的授权…':'首次使用会请求相机权限'}</small></button>}
   {(opening||live)&&<button className="camera-close native-button" onClick={stopCamera}>关闭相机</button>}
  </div>
  <div className="capture-controls"><button className="native-button" onClick={()=>picker.current?.click()} disabled={!!working}>导入照片</button><button className="shutter" aria-label={live?'拍下这张照片':'拍摄照片'} onClick={()=>void camera()} disabled={!!working||opening||(live&&!cameraReady)}><span/></button><button className="native-button" onClick={learn}>开始练习</button></div>
  </div>
  <input hidden type="file" ref={picker} accept="image/*" aria-label="导入照片制卡" onChange={e=>void choose(e.target.files?.[0])}/>
  {photo&&<section className="capture-editor">
   <div className="capture-ai"><div><strong>让照片变成英语卡片</strong><span className="muted small">{quota?`今日已用 ${quota.used} / ${quota.daily_limit} 张 · 当前可用 ${quota.remaining} 张`:'每个浏览器每日 10 张'}</span></div>
    <small className="muted">点击识图会上传这张照片进行 AI 分析。</small>
    <button className="native-primary" onClick={()=>void recognize()} disabled={!!working||live||opening||(quota?.remaining===0&&!attempted)}>{working==='ai'?'正在识图…':attempted?'重新识图':'AI 识图生成卡片'}</button>
    {working==='ai'&&<button className="text-button" onClick={()=>request.current?.abort()}>取消等待</button>}
    <p role="status">{message||(quota?.remaining===0?'今日可用额度已用完，仍可手动填写词汇。':'也可以直接在下方手动填写。')}</p>
   </div>
   <label>卡组名称<input value={title} maxLength={80} disabled={!!working} onChange={e=>setTitle(e.target.value)}/></label>
   {labels.map((label,i)=><fieldset key={i} disabled={!!working}><legend>词条 {i+1}</legend>{([['english','英文'],['chinese','中文释义'],['example','英文例句（可选）'],['exampleChinese','例句中文（可选）']] as const).map(([key,name])=><label key={key}>{name}<input value={label[key]} maxLength={key.includes('example')?2000:200} onChange={e=>setLabels(v=>v.map((l,n)=>n===i?{...l,[key]:e.target.value}:l))}/></label>)}{labels.length>1&&<button className="text-button" onClick={()=>setLabels(v=>v.filter((_,n)=>n!==i))}>移除此词条</button>}</fieldset>)}
   <button className="native-button" onClick={()=>setLabels(v=>[...v,blank()])} disabled={labels.length>=100||!!working}>添加词条</button><button className="native-primary" disabled={!!working} onClick={()=>void submit()}>{working==='save'?'正在保存…':'保存卡组并学习'}</button>
  </section>}
 </main>;
}
