import {unzipSync,zipSync,strToU8,strFromU8} from 'fflate';
import {parseEmbeddedAudio} from '../../deck-format/src/audio.mjs';
import {sha256,parseArchive} from '../../deck-format/src/archive.mjs';
export const MAX_BACKUP_BYTES=64*1024*1024;
const safe=p=>typeof p==='string'&&p.length<240&&!p.startsWith('/')&&!/[\\:\x00-\x1f]/.test(p)&&p.split('/').every(s=>s&&!['.','..','__proto__','constructor','prototype'].includes(s));
const fail=()=>{throw Error('照片备份结构或校验无效，现有照片未改变。');};
export function unpack(bytes){if(!(bytes instanceof Uint8Array)||bytes.length>MAX_BACKUP_BYTES)throw Error('网页支持单个文件不超过64 MB；更大的备份请在 App 恢复。');let total=0,count=0;const seen=new Set();try{return unzipSync(bytes,{filter:f=>{if(!safe(f.name.replace(/\/$/,''))||seen.has(f.name)||(count++)>15001||(total+=f.originalSize)>96*1024*1024||f.originalSize>MAX_BACKUP_BYTES||(f.name.endsWith('.json')&&f.originalSize>8*1024*1024))fail();seen.add(f.name);return !f.name.endsWith('/');}});}catch{fail();}}
export async function readPhotos(bytes){
 const files=unpack(bytes);let m;try{m=JSON.parse(strFromU8(files['manifest.json']));}catch{fail();}
 if(m.formatIdentifier!=='com.zhaoolee.piclex.photo-archive'||m.formatVersion!==1||!Array.isArray(m.photos)||m.photos.length>5000||m.photoCount!==m.photos.length)fail();const ids=new Set(),photos=[];
 for(const item of m.photos){if(!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(item?.id)||ids.has(item.id.toLowerCase())||!safe(item.jsonPath)||!files[item.jsonPath]||await sha256(files[item.jsonPath])!==item.jsonSHA256)fail();ids.add(item.id.toLowerCase());let meta;try{meta=JSON.parse(strFromU8(files[item.jsonPath]));}catch{fail();}
  const image=files[meta.imagePath];if(meta.id!==item.id||meta.formatVersion!==1||!safe(meta.imagePath)||!image||image.length!==meta.imageByteCount||await sha256(image)!==meta.imageSHA256||!Number.isFinite(meta.createdAt)||(meta.deletedAt!=null&&!Number.isFinite(meta.deletedAt))||!Array.isArray(meta.labels)||meta.labels.length>1000)fail();
  if(meta.labels.some(l=>!l||typeof l.english!=='string'||typeof l.chinese!=='string'||!Number.isInteger(l.x)||!Number.isInteger(l.y)||l.x<0||l.x>1000||l.y<0||l.y>1000))fail();
  if(!meta.quote||['chinese','english','source'].some(k=>typeof meta.quote[k]!=='string')||!['web','model','builtIn','none'].includes(meta.quote.provenance))fail();
  for(const l of meta.labels){
   if(['phoneticUS','phoneticUK','backgroundColor','textColor'].some(k=>typeof l[k]!=='string'))fail();
   for(const name of ['bubblePosition','anchorPosition','suggestedBubblePosition'])if(l[name]!=null&&(![l[name].x,l[name].y].every(n=>Number.isFinite(n)&&n>=0&&n<=1000)))fail();
   const b=l.boundingBox;if(b!=null&&(![b.left,b.top,b.right,b.bottom].every(n=>Number.isInteger(n)&&n>=0&&n<=1000)||b.right<b.left||b.bottom<b.top))fail();
   if(l.learning){if(!['visible','scene_extension','hypothetical'].includes(l.learning.relation)||['partOfSpeech','sceneConnection','association','collocation','example','exampleChinese'].some(k=>typeof l.learning[k]!=='string'))fail();await parseEmbeddedAudio(l.learning.audio);}
  }
  photos.push({id:item.id.toLowerCase(),meta,image,title:typeof m.deckName==='string'?m.deckName:'我的照片'});
 }
 if(m.trashCount!==photos.filter(p=>p.meta.deletedAt!=null).length)fail();return photos;
}
export async function writePhotos(photos,title='我的照片',now=Date.now()){
 const files={},items=[];
 for(const p of photos){const id=p.meta.id,ext=p.meta.imagePath.split('.').pop();if(!/^[a-zA-Z0-9]{1,8}$/.test(ext))fail();const imagePath=`photos/${id.toLowerCase()}.${ext.toLowerCase()}`,jsonPath=`photos/${id.toLowerCase()}.json`;const meta={...p.meta,imagePath,imageByteCount:p.image.length,imageSHA256:await sha256(p.image)};const json=strToU8(JSON.stringify(meta));files[imagePath]=p.image;files[jsonPath]=json;items.push({id,jsonPath,jsonSHA256:await sha256(json)});}
 const manifest={formatIdentifier:'com.zhaoolee.piclex.photo-archive',formatVersion:1,exporterVersion:'1.3.0',importerVersion:'1.3.0',appVersion:'photography-english-web',exportedAt:now,photoCount:items.length,trashCount:photos.filter(p=>p.meta.deletedAt!=null).length,deckName:title,photos:items};files['manifest.json']=strToU8(JSON.stringify(manifest));const bytes=zipSync(files,{level:0});if(bytes.length>MAX_BACKUP_BYTES)throw Error('备份超过网页64 MB限制，请在 App 处理大型备份。');return bytes;
}
export async function practicePhoto(photo){
 if(photo.meta.deletedAt!=null)return null;
 // Preserve unsupported HEIC and unrecognized photos in the backup; never discard them.
 const bytes=await writePhotos([photo],photo.title);try{const parsed=await parseArchive(bytes);return {id:'local-backup-'+photo.id,bytes:bytes.slice().buffer,title:parsed.title,addedAt:photo.meta.createdAt};}catch{return null;}
}
export function packComplete(files,name){return zipSync(Object.fromEntries(Object.entries(files).map(([k,v])=>[name+'/'+k,v])),{level:0});}
/** @returns {Record<string,Uint8Array>} */
export function unpackComplete(bytes){const files=unpack(bytes),manifest=Object.keys(files).filter(p=>p==='backup.json'||p.endsWith('/backup.json'));if(manifest.length!==1)fail();const root=manifest[0].slice(0,-'backup.json'.length);/** @type {Record<string,Uint8Array>} */ const result={};for(const name of ['backup.json','photos.piclexdeck','learning-progress.json']){if(!files[root+name])fail();result[name]=files[root+name];}return result;}
