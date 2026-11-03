import {zipSync,strToU8} from 'fflate';
import {sha256} from './archive.mjs';
/** @param {{image:Uint8Array,title:string,labels:any[],quote?:{chinese:string,english:string,source:string}|null,id?:string,date?:number}} options */
export async function createPhotoDeck({image,title,labels,quote=null,id=crypto.randomUUID(),date=Date.now()}){
 if(!(image instanceof Uint8Array)||!image.length||image.length>12*1024*1024||typeof title!=='string'||!title.trim()||title.length>80||!Array.isArray(labels)||!labels.length||labels.length>100)throw Error('请填写卡组名称、英文和中文释义。');
 for(const l of labels)if(typeof l.english!=='string'||!/^[a-z][a-z0-9 '\-.,!?()]{0,99}$/i.test(l.english.trim())||typeof l.chinese!=='string'||!l.chinese.trim()||l.chinese.length>200)throw Error('请填写有效的英文单词或短语和中文释义。');
 const imagePath=`photos/${id}.jpg`,jsonPath=`photos/${id}.json`;
 const data=strToU8(JSON.stringify({formatVersion:1,id,createdAt:date,imagePath,imageByteCount:image.length,imageSHA256:await sha256(image),recognitionCompleted:true,libraryAppendOrder:0,quote:quote?{...quote,sourceURL:null,provenance:'model'}:{chinese:'',english:'',source:'',sourceURL:null,provenance:'none'},labels:labels.map(l=>{
  const b=l.bbox,a=l.anchor;
  const box=l.relation==='visible'&&Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[0]>=0&&b[1]>=0&&b[2]>b[0]&&b[3]>b[1]&&b[2]<=1000&&b[3]<=1000;
  const visible=box&&Array.isArray(a)&&a.length===2&&a.every(Number.isFinite)&&a[0]>=b[0]&&a[0]<=b[2]&&a[1]>=b[1]&&a[1]<=b[3];
  return {english:l.english.trim(),chinese:l.chinese.trim(),x:visible?a[0]:500,y:visible?a[1]:500,
   phoneticUS:l.phoneticUS||'',phoneticUK:l.phoneticUK||'',backgroundColor:'#ffffff',textColor:'#202020',paletteColorIsFixed:true,positionUnavailable:!visible,
   ...(visible?{boundingBox:{left:b[0],top:b[1],right:b[2],bottom:b[3]}}:{}),
   learning:{partOfSpeech:l.partOfSpeech||'',relation:visible?'visible':l.relation==='hypothetical'?'hypothetical':'scene_extension',sceneConnection:l.sceneConnection||l.chinese,association:l.association||l.chinese,collocation:l.collocation||l.english,example:l.example||'',exampleChinese:l.exampleChinese||''}};
 })}));
 const manifest={formatIdentifier:'com.zhaoolee.piclex.photo-archive',formatVersion:1,exporterVersion:'1.3.0',importerVersion:'1.3.0',appVersion:'photography-english-web',exportedAt:date,photoCount:1,trashCount:0,deckName:title.trim(),photos:[{id,jsonPath,jsonSHA256:await sha256(data)}]};
 return zipSync({'manifest.json':strToU8(JSON.stringify(manifest)),[jsonPath]:data,[imagePath]:image},{level:0});
}
