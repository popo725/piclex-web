import {completionURL,configurationError,type AISettings} from './ai-settings';
import type {PhotoLabel,PhotoQuote} from './capture-api';
const prompt=`你是摄影学英语助手。识别照片中可见的物体和场景，生成5到10个适合学习的英文词条。只返回JSON，不要Markdown。格式：{"labels":[{"english":"apple","chinese":"苹果","example":"An apple is on the table.","exampleChinese":"桌上有一个苹果。","phoneticUS":"/ˈæpəl/","partOfSpeech":"n.","bbox":[0.1,0.2,0.3,0.4]}],"quote":null}。bbox是照片中从左上角计算的归一化[x,y,width,height]；只有可定位的物体才填写，场景词不填bbox。每个词必须有中英释义和贴合照片的双语例句。可在quote返回与照片相关、有真实出处的诗句，字段为chinese、english、source；不确定时用null。不要猜测照片中没有的内容。`;
export function parseCustomRecognition(content:unknown):{labels:PhotoLabel[];quote:PhotoQuote}{
 if(typeof content!=='string')throw Error('模型没有返回可读的识别内容，请重试。');
 let data:any;try{data=JSON.parse(content.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}catch{throw Error('模型返回格式不正确，请重试或更换模型。');}
 if(!Array.isArray(data?.labels)||!data.labels.length||data.labels.length>50)throw Error('模型没有返回有效词条，请重试或更换模型。');
 const labels:PhotoLabel[]=data.labels.map((item:any)=>{
  if(!item||['english','chinese','example','exampleChinese'].some(k=>typeof item[k]!=='string'||!item[k].trim()||item[k].length>2000))throw Error('模型返回的词条不完整，请重试。');
  const label:PhotoLabel={english:item.english.trim(),chinese:item.chinese.trim(),example:item.example.trim(),exampleChinese:item.exampleChinese.trim()};
  for(const name of ['phoneticUS','phoneticUK','partOfSpeech'] as const)if(typeof item[name]==='string')label[name]=item[name].slice(0,200);
  if(Array.isArray(item.bbox)&&item.bbox.length===4&&item.bbox.every((v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)&&item.bbox[2]>0&&item.bbox[3]>0&&item.bbox[0]+item.bbox[2]<=1&&item.bbox[1]+item.bbox[3]<=1){const [x,y,w,h]=item.bbox;label.bbox=[x*1000,y*1000,(x+w)*1000,(y+h)*1000];label.anchor=[(x+w/2)*1000,(y+h/2)*1000];label.relation='visible';}
  return label;
 });
 const q=data.quote;const quote=q&&['chinese','english','source'].every(k=>typeof q[k]==='string'&&q[k].trim()&&q[k].length<=2000)?{chinese:q.chinese,english:q.english,source:q.source}:null;
 return {labels,quote};
}
export async function analyzeCustomPhoto(photo:Uint8Array,signal:AbortSignal,settings:AISettings){
 const error=configurationError(settings);if(error)throw Error(error+' 请前往设置 → AI配置。');
 if(settings.mode==='official')throw Error('请选择自定义模型。');
 const provider=settings[settings.mode];let binary='';for(let i=0;i<photo.length;i+=8192)binary+=String.fromCharCode(...photo.subarray(i,i+8192));
 let response:Response;
 try{response=await fetch(completionURL(provider.baseURL),{method:'POST',signal,credentials:'omit',cache:'no-store',redirect:'error',headers:{'Content-Type':'application/json',Authorization:`Bearer ${provider.apiKey.trim()}`},body:JSON.stringify({model:provider.model.trim(),stream:false,messages:[{role:'system',content:prompt},{role:'user',content:[{type:'text',text:'请识别这张照片并生成词条。'},{type:'image_url',image_url:{url:`data:image/jpeg;base64,${btoa(binary)}`}}]}]})});}
 catch(e){if(signal.aborted)throw e;throw Error('无法连接所选模型，请检查网络、Base URL 和服务的浏览器跨域设置。');}
 if(!response.ok){if(response.status===401||response.status===403)throw Error('模型授权失败，请检查 API Key 和账户权限。');if(response.status===429)throw Error('所选模型额度不足或请求过于频繁，请稍后重试。');throw Error(`模型请求失败（${response.status}），请检查模型名称及图片识别支持。`);}
 const data=await response.json().catch(()=>null);return {...parseCustomRecognition(data?.choices?.[0]?.message?.content),quota:null};
}
