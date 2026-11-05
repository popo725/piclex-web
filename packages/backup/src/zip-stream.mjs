import {ZipReader,ZipWriter,BlobReader,BlobWriter,configure} from '@zip.js/zip.js';
import {asBlob,abort,checkSize,MAX_BACKUP_BYTES,MAX_MANIFEST_BYTES} from './streaming.mjs';
configure({useWebWorkers:false,chunkSize:512*1024,maxWorkers:1});
export const safePath=p=>typeof p==='string'&&p.length<240&&!p.startsWith('/')&&!/[\\:\x00-\x1f]/.test(p)&&p.split('/').every(s=>s&&!['.','..','__proto__','constructor','prototype'].includes(s));
export async function openZIP(value,{signal,limit=MAX_BACKUP_BYTES,expandedLimit=MAX_BACKUP_BYTES,jsonLimit=MAX_MANIFEST_BYTES}={}){
 const blob=asBlob(value);checkSize(blob.size,limit);const reader=new ZipReader(new BlobReader(blob),{checkSignature:true});
 try{const files=new Map();let total=0;for await(const entry of reader.getEntriesGenerator({signal})){
  abort(signal);const name=entry.filename;if(!safePath(name.replace(/\/$/,''))||files.has(name)||entry.encrypted||entry.unixMode&&((entry.unixMode&0xf000)===0xa000))throw Error('备份包含无效路径、重复文件或不支持的加密内容。');
  checkSize(entry.uncompressedSize,expandedLimit);total+=entry.uncompressedSize;checkSize(total,expandedLimit);
  if(name.endsWith('.json'))checkSize(entry.uncompressedSize,jsonLimit);
  files.set(name,entry);
 }
 return {files,reader,total};}catch(e){await reader.close();throw e;}
}
export async function entryBytes(entry,limit,signal){if(!entry||entry.directory)throw Error('备份文件缺失。');checkSize(entry.uncompressedSize,limit);const chunks=[];let size=0;await entry.getData(new WritableStream({write(chunk){abort(signal);checkSize(size+chunk.byteLength,limit);size+=chunk.byteLength;chunks.push(chunk);}}),{signal,checkSignature:true});const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength;}return result;}
export async function entryBlob(entry,job,limit=MAX_BACKUP_BYTES){
 if(!entry||entry.directory)throw Error('备份文件缺失。');checkSize(entry.uncompressedSize,limit);
 if(job){const sink=await job.writer(Math.min(limit,entry.uncompressedSize));await entry.getData(sink.writable,{signal:job.signal,checkSignature:true});return sink.finish();}
 return entry.getData(new BlobWriter(),{checkSignature:true});
}
export async function writeZIP(entries,{job,limit=MAX_BACKUP_BYTES,expandedLimit=MAX_BACKUP_BYTES,zip64=true}={}){
 // ZIPFoundation 0.9.20 expects 64-bit descriptors for entries with ZIP64 offsets.
 // Emit a consistent ZIP64 layout even before the archive crosses 4 GiB.
 const sink=job?await job.writer(limit):null,fallback=sink?null:new BlobWriter('application/zip');
 const writer=new ZipWriter(sink?.writable||fallback,{level:0,bufferedWrite:false,zip64});let total=0;
 try{for await(const [name,value]of entries){abort(job?.signal);if(!safePath(name))throw Error('备份文件名无效。');const blob=asBlob(value);total+=blob.size;checkSize(total,expandedLimit);await writer.add(name,new BlobReader(blob),{signal:job?.signal,level:0,bufferedWrite:false,onprogress:(done,size)=>job?.onProgress({message:'正在打包备份',done,total:size})});}
  const result=await writer.close();const blob=sink?await sink.finish():result;checkSize(blob.size,limit);return blob;
 }catch(e){await writer.close().catch(()=>{});throw e;}
}
