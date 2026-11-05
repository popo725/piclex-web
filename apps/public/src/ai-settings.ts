import {useSyncExternalStore} from 'react';
export type Provider = {baseURL:string;model:string;apiKey:string};
export type AISettings = {mode:'official'|'deepSeek'|'custom';deepSeek:Provider;custom:Provider};
const key='piclex-web.ai-settings.v1',event='piclex-ai-settings';
const defaults=():AISettings=>({mode:'official',deepSeek:{baseURL:'https://api.deepseek.com',model:'deepseek-flash',apiKey:''},custom:{baseURL:'',model:'',apiKey:''}});
export function readAISettings():AISettings {
 try {const raw=JSON.parse(localStorage.getItem(key)||'null'),value=defaults();if(!raw)return value;
 if(['official','deepSeek','custom'].includes(raw.mode))value.mode=raw.mode;
 for(const name of ['deepSeek','custom'] as const)for(const field of ['baseURL','model','apiKey'] as const)if(typeof raw[name]?.[field]==='string')value[name][field]=raw[name][field];
 return value;}catch{return defaults();}
}
export function saveAISettings(value:AISettings){localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event(event));}
function subscribe(callback:()=>void){window.addEventListener(event,callback);window.addEventListener('storage',callback);return()=>{window.removeEventListener(event,callback);window.removeEventListener('storage',callback);};}
export function useAIModelLabel(){return useSyncExternalStore(subscribe,()=>{const mode=readAISettings().mode;return mode==='official'?'官方模型':mode==='deepSeek'?'DeepSeek':'自定义模型';});}
export function completionURL(base:string){
 let url:URL;try{url=new URL(base.trim());}catch{throw Error('请填写有效的 Base URL。');}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Base URL 请使用不含账号、参数的 HTTPS 地址。');
 const path=url.pathname.replace(/\/+$/,'');url.pathname=path.endsWith('/chat/completions')?path:`${path}/chat/completions`;return url.href;
}
export function configurationError(settings:AISettings){if(settings.mode==='official')return '';const provider=settings[settings.mode];try{completionURL(provider.baseURL);}catch(e){return (e as Error).message;}if(!provider.model.trim())return '请填写支持图片识别的模型名称。';if(!provider.apiKey.trim())return '请填写 API Key。';return '';}
