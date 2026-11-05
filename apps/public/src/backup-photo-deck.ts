import {asBlob} from '../../../packages/backup/src/streaming.mjs';
import {sha256} from '../../../packages/deck-format/src/archive.mjs';
import {parseEmbeddedAudio} from '../../../packages/deck-format/src/audio.mjs';
import type {BackupPhoto} from './backup-store';
const text=(value:any,limit=2000)=>typeof value==='string'&&value.length<=limit?value:'';
export async function backupPhotoDeck(photo:BackupPhoto){
 const words=[];
 for(const [index,label] of photo.meta.labels.entries()){
  const english=text(label.english,100).trim(),chinese=text(label.chinese,200).trim();if(!english||!chinese||!/[a-z]/i.test(english)||! /^[a-z0-9\s'’.,!?()\-‐‑‒–—−]+$/i.test(english))throw Error('照片已保留，但这张照片含暂不支持的练习词条。');
  const b=label.boundingBox,visible=label.positionUnavailable!==true&&(!label.learning||label.learning.relation==='visible');
  const focus=visible&&b&&b.right>b.left&&b.bottom>b.top?{visible:true,box:[b.left/1000,b.top/1000,(b.right-b.left)/1000,(b.bottom-b.top)/1000]}:null;
  const audio=await parseEmbeddedAudio(label.learning?.audio);
  words.push({...(audio?{audio}:{}),id:`${photo.meta.id}:${index}`,english,chinese,imageIndex:0,focus,occurrenceID:text(label.learning?.occurrenceID,200),example:text(label.learning?.example),exampleChinese:text(label.learning?.exampleChinese),phonetic:text(label.phoneticUS,200),partOfSpeech:text(label.learning?.partOfSpeech,50)});
 }
 const fingerprint=await sha256(new TextEncoder().encode(JSON.stringify({photos:[{id:photo.meta.id,sha256:photo.meta.imageSHA256}],words:words.map(({audio,...word})=>word)})));
 return {id:'local-backup-'+photo.id,title:photo.title,fingerprint,words,images:[URL.createObjectURL(asBlob(photo.image))],backupPhoto:photo};
}
export async function thumbnail(blob:Blob){try{const image=await createImageBitmap(blob);const canvas=document.createElement('canvas');canvas.width=160;canvas.height=Math.max(1,Math.round(160*image.height/image.width));canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);image.close();return await new Promise<Blob>(resolve=>canvas.toBlob(value=>resolve(value||blob),'image/jpeg',.7));}catch{return blob;}}
