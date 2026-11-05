import {useEffect,useState} from 'react';
import {readCaptureQuota,type Quota} from './capture-api';
import {readAISettings,saveAISettings,configurationError,type AISettings as Configuration} from './ai-settings';
import './ai-settings.css';
export default function AISettings(){
 const [settings,setSettings]=useState(readAISettings),[showKey,setShowKey]=useState(false),[saveError,setSaveError]=useState(''),[quota,setQuota]=useState<Quota|null>(null),[error,setError]=useState(''),[revision,retry]=useState(0),[loading,setLoading]=useState(false);
 function update(value:Configuration){try{saveAISettings(value);setSettings(value);setSaveError('');}catch{setSaveError('配置保存失败，请允许浏览器保存网站数据后重试。');}}
 function mode(value:Configuration['mode']){setShowKey(false);update({...settings,mode:value});}
 useEffect(()=>{setShowKey(false);const hide=()=>setShowKey(false);document.addEventListener('visibilitychange',hide);window.addEventListener('hashchange',hide);return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('hashchange',hide);};},[]);
 useEffect(()=>{setQuota(null);setError('');if(settings.mode!=='official')return;const c=new AbortController();setLoading(true);readCaptureQuota(c.signal).then(q=>{if(!c.signal.aborted)setQuota(q);}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[settings.mode,revision]);
 const provider=settings.mode==='official'?null:settings[settings.mode],invalid=configurationError(settings);
 return <section className="ai-configuration" aria-label="AI配置">
 <div className="ai-source" role="group" aria-label="模型来源"><button aria-pressed={settings.mode==='official'} onClick={()=>mode('official')}>官方模型</button><button aria-pressed={settings.mode!=='official'} onClick={()=>mode(settings.mode==='custom'?'custom':'deepSeek')}>自定义模型</button><button disabled title="Web 尚未接入本机模型">本机模型</button></div>
 {provider?<><label className="settings-row"><span>大模型厂商</span><select aria-label="大模型厂商" value={settings.mode} onChange={e=>mode(e.target.value as Configuration['mode'])}><option value="deepSeek">DeepSeek</option><option value="custom">自定义</option></select></label>
 {(['baseURL','model','apiKey'] as const).map(field=><label className="ai-field" key={`${settings.mode}-${field}`}><span>{field==='baseURL'?'Base URL（必填）':field==='model'?'模型名称（需支持图片识别）':'API Key'}</span><div><input aria-label={field==='baseURL'?'Base URL':field==='model'?'模型名称':'API Key'} type={field==='apiKey'&&!showKey?'password':'text'} inputMode={field==='baseURL'?'url':undefined} autoComplete="off" autoCapitalize="none" spellCheck={false} value={provider[field]} onChange={e=>update({...settings,[settings.mode]:{...provider,[field]:e.target.value}})}/>{field==='apiKey'&&<button type="button" aria-label={showKey?'隐藏 API Key':'显示 API Key'} onClick={()=>setShowKey(v=>!v)}>{showKey?'隐藏':'显示'}</button>}</div></label>)}
 {invalid&&<p className="settings-footnote" role="status">{invalid}</p>}<p className="settings-footnote">配置自动保存在当前浏览器。API Key 不加密保存，请仅在自己的设备填写。照片直接发送给所选服务，不占用官方额度；服务需支持图片识别和浏览器跨域请求。</p></>:<><div className="settings-row"><span>今日剩余额度</span><span>{quota?`${quota.remaining} / ${quota.daily_limit}`:'—'}</span></div>{error&&<p role="alert">{error}</p>}<button className="settings-row" disabled={loading} onClick={()=>retry(v=>v+1)}>{loading?'正在刷新…':'刷新额度'}</button></>}
 <p className="settings-footnote">Web 尚未接入本机模型，可在 App 中使用。</p>{saveError&&<p role="alert">{saveError}</p>}
 </section>;
}
