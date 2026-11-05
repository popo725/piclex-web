import {parseEmbeddedAudio} from '../../deck-format/src/audio.mjs';
import {sha256} from '../../deck-format/src/archive.mjs';
import {openZIP,entryBytes,entryBlob,writeZIP,safePath} from './zip-stream.mjs';
import {asBlob,hashBlob,bytesOf,checkSize,abort,MAX_BACKUP_BYTES,MAX_COMPLETE_BYTES,MAX_PROGRESS_BYTES,MAX_MANIFEST_BYTES,MAX_PHOTO_JSON_BYTES} from './streaming.mjs';
export {MAX_BACKUP_BYTES} from './streaming.mjs';
const fail=()=>{throw Error('照片备份结构或校验无效，现有照片未改变。');};
const json=bytes=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
const encode=value=>new TextEncoder().encode(JSON.stringify(value));
export async function readPhotos(value,{job}={}){
 const {files,reader}=await openZIP(value,{signal:job?.signal});
 try{const m=json(await entryBytes(files.get('manifest.json'),MAX_MANIFEST_BYTES,job?.signal));
 if(m.formatIdentifier!=='com.zhaoolee.piclex.photo-archive'||m.formatVersion!==1||!Array.isArray(m.photos)||m.photoCount!==m.photos.length)fail();const ids=new Set(),photos=[];
 for(const item of m.photos){abort(job?.signal);if(!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(item?.id)||ids.has(item.id.toLowerCase())||!safePath(item.jsonPath))fail();ids.add(item.id.toLowerCase());
  const metadata=await entryBytes(files.get(item.jsonPath),MAX_PHOTO_JSON_BYTES,job?.signal);if(await sha256(metadata)!==item.jsonSHA256)fail();const meta=json(metadata);
  if(meta.id!==item.id||meta.formatVersion!==1||!safePath(meta.imagePath)||!Number.isFinite(meta.createdAt)||(meta.deletedAt!=null&&!Number.isFinite(meta.deletedAt))||!Array.isArray(meta.labels)||meta.labels.length>1000)fail();
  if(meta.labels.some(l=>!l||typeof l.english!=='string'||typeof l.chinese!=='string'||!Number.isInteger(l.x)||!Number.isInteger(l.y)||l.x<0||l.x>1000||l.y<0||l.y>1000))fail();
  if(!meta.quote||['chinese','english','source'].some(k=>typeof meta.quote[k]!=='string')||!['web','model','builtIn','none'].includes(meta.quote.provenance))fail();
  for(const l of meta.labels){
   if(['phoneticUS','phoneticUK','backgroundColor','textColor'].some(k=>typeof l[k]!=='string'))fail();
   for(const name of ['bubblePosition','anchorPosition','suggestedBubblePosition'])if(l[name]!=null&&(![l[name].x,l[name].y].every(n=>Number.isFinite(n)&&n>=0&&n<=1000)))fail();
   const b=l.boundingBox;if(b!=null&&(![b.left,b.top,b.right,b.bottom].every(n=>Number.isInteger(n)&&n>=0&&n<=1000)||b.right<b.left||b.bottom<b.top))fail();
   if(l.learning){if(!['visible','scene_extension','hypothetical'].includes(l.learning.relation)||['partOfSpeech','sceneConnection','association','collocation','example','exampleChinese'].some(k=>typeof l.learning[k]!=='string'))fail();await parseEmbeddedAudio(l.learning.audio);}
  }

  const entry=files.get(meta.imagePath);if(!entry||entry.uncompressedSize!==meta.imageByteCount)fail();
  job?.onProgress({message:`正在校验照片 ${photos.length+1} / ${m.photos.length}`});const image=await entryBlob(entry,job);if(image.size!==meta.imageByteCount||await hashBlob(image,{signal:job?.signal})!==meta.imageSHA256)fail();
  photos.push({id:item.id.toLowerCase(),meta,image,title:typeof m.deckName==='string'?m.deckName:'我的照片'});
 }
 if(m.trashCount!==photos.filter(p=>p.meta.deletedAt!=null).length)fail();return photos;
 }finally{await reader.close();}
}
export async function writePhotos(photos,title='我的照片',now=Date.now(),{job,zip64}={}){
 const items=[];let trashCount=0;
 async function* entries(){for(const p of photos){abort(job?.signal);const id=p.meta.id,ext=p.meta.imagePath.split('.').pop();if(!/^[a-zA-Z0-9]{1,8}$/.test(ext))fail();
  const image=asBlob(p.image),imagePath=`photos/${id.toLowerCase()}.${ext.toLowerCase()}`,jsonPath=`photos/${id.toLowerCase()}.json`;
  const meta={...p.meta,imagePath,imageByteCount:image.size,imageSHA256:await hashBlob(image,{signal:job?.signal})};const bytes=encode(meta);checkSize(bytes.length,MAX_PHOTO_JSON_BYTES);items.push({id,jsonPath,jsonSHA256:await sha256(bytes)});if(meta.deletedAt!=null)trashCount++;
  yield [imagePath,image];yield [jsonPath,bytes];
 }
 const manifest=encode({formatIdentifier:'com.zhaoolee.piclex.photo-archive',formatVersion:1,exporterVersion:'1.3.0',importerVersion:'1.3.0',appVersion:'photography-english-web',exportedAt:now,photoCount:items.length,trashCount,deckName:title,photos:items});checkSize(manifest.length,MAX_MANIFEST_BYTES);yield ['manifest.json',manifest];}
 return writeZIP(entries(),{job,zip64});
}
// The backup path never expands an entire archive into an ArrayBuffer.
export async function packComplete(files,name,options={}){for(const [file,limit]of [['photos.piclexdeck',MAX_BACKUP_BYTES],['learning-progress.json',MAX_PROGRESS_BYTES],['backup.json',MAX_MANIFEST_BYTES]]){if(!files[file])fail();checkSize(asBlob(files[file]).size,limit);}return writeZIP(Object.entries(files).map(([key,value])=>[name+'/'+key,value]),{...options,limit:MAX_COMPLETE_BYTES,expandedLimit:MAX_COMPLETE_BYTES});}
/** @returns {Promise<Record<string,Blob>>} */
export async function unpackComplete(value,{job}={}){
 const {files,reader}=await openZIP(value,{signal:job?.signal,limit:MAX_COMPLETE_BYTES,expandedLimit:MAX_COMPLETE_BYTES,jsonLimit:MAX_PROGRESS_BYTES});
 try{const manifests=[...files.keys()].filter(p=>p==='backup.json'||p.endsWith('/backup.json'));if(manifests.length!==1)fail();const root=manifests[0].slice(0,-'backup.json'.length);/** @type {Record<string,Blob>} */const result={};
 for(const name of ['backup.json','photos.piclexdeck','learning-progress.json'])result[name]=await entryBlob(files.get(root+name),job,name==='photos.piclexdeck'?MAX_BACKUP_BYTES:name==='learning-progress.json'?MAX_PROGRESS_BYTES:MAX_MANIFEST_BYTES);return result;
 }finally{await reader.close();}
}
