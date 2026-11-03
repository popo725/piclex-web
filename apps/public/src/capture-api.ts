export type Quota = {daily_limit:number; used:number; remaining:number; resets_at:number};
export type PhotoLabel = {english:string; chinese:string; example:string; exampleChinese:string; phoneticUS?:string; phoneticUK?:string; partOfSpeech?:string; relation?:string; sceneConnection?:string; association?:string; collocation?:string; bbox?:number[]|null; anchor?:number[]|null};
export type PhotoQuote = {chinese:string;english:string;source:string}|null;
const endpoint='https://piclex.v2fy.com/v1/web';
export function browserIdentity(){
 const key='photography-english.capture-id';
 let value=localStorage.getItem(key);
 if(!value||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)){
  value=crypto.randomUUID();localStorage.setItem(key,value);
 }
 return value;
}
async function request(path:string,body:BodyInit,signal:AbortSignal){
 const response=await fetch(`${endpoint}/${path}`,{method:'POST',body,signal,credentials:'omit',cache:'no-store'});
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw Error(data?.error?.message||'识图服务暂时无法连接，请稍后重试。');
 if(!data)throw Error('识图结果暂时无法读取，请重试。');
 return data;
}
export async function readCaptureQuota(signal:AbortSignal):Promise<Quota>{
 return (await request('quota',new URLSearchParams({client_id:browserIdentity()}),signal)).quota;
}
export async function analyzePhoto(photo:Uint8Array,signal:AbortSignal):Promise<{labels:PhotoLabel[];quote:PhotoQuote;quota:Quota}>{
 const body=new FormData();body.append('metadata',JSON.stringify({client_id:browserIdentity()}));
 body.append('image',new Blob([photo.slice().buffer],{type:'image/jpeg'}),'photo.jpg');
 const data=await request('analyze',body,signal);
 if(!Array.isArray(data.labels)||!data.labels.length)throw Error('未识别到完整词条，请换一张照片或手动填写。');
 return data;
}
