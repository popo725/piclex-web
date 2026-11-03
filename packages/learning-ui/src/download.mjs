/** @typedef {{received:number,total:number|null}} DownloadProgress */
/** Read a bounded response while reporting real decoded bytes, never a simulated percentage.
 * @param {string} url
 * @param {{signal?:AbortSignal,onProgress?:(value:DownloadProgress)=>void,maxBytes?:number,fetcher?:typeof fetch}} options
 */
export async function downloadBytes(url,{signal,onProgress=()=>{},maxBytes=16*1024*1024,fetcher=fetch}={}){
 const response=await fetcher(url,{signal});
 if(!response.ok)throw Error('下载失败，请稍后重试。');
 const length=Number(response.headers.get('content-length'));
 const encoding=response.headers.get('content-encoding');
 // Fetch exposes decoded bytes; a compressed Content-Length is not their total.
 const total=(!encoding||encoding==='identity')&&Number.isSafeInteger(length)&&length>0?length:null;
 if(total&&total>maxBytes){await response.body?.cancel();throw Error('文件过大，暂时无法加载。');}
 let received=0;onProgress({received,total});
 if(!response.body){const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>maxBytes)throw Error('文件过大，暂时无法加载。');signal?.throwIfAborted();onProgress({received:bytes.length,total:bytes.length});return {bytes,type:response.headers.get('content-type')||''};}
 const reader=response.body.getReader(),chunks=[];
 try{
  for(;;){signal?.throwIfAborted();const {done,value}=await reader.read();if(done)break;received+=value.length;if(received>maxBytes)throw Error('文件过大，暂时无法加载。');chunks.push(value);onProgress({received,total:total&&received<=total?total:null});}
  signal?.throwIfAborted();
 }catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
 const bytes=new Uint8Array(received);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 onProgress({received,total:received});return {bytes,type:response.headers.get('content-type')||''};
}
