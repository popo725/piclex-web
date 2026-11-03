import {zipSync,strToU8} from 'fflate';
import {sha256} from './archive.mjs';
export async function createPhotoDeck({image,title,labels,id=crypto.randomUUID(),date=Date.now()}){
 if(!(image instanceof Uint8Array)||!image.length||image.length>12*1024*1024||typeof title!=='string'||!title.trim()||title.length>80||!Array.isArray(labels)||!labels.length||labels.length>100)throw Error('请填写卡组名称、英文和中文释义。');
 for(const l of labels)if(typeof l.english!=='string'||!/^[a-z][a-z0-9 '\-.,!?()]{0,99}$/i.test(l.english.trim())||typeof l.chinese!=='string'||!l.chinese.trim()||l.chinese.length>200)throw Error('请填写有效的英文单词或短语和中文释义。');
 const imagePath=`photos/${id}.jpg`,jsonPath=`photos/${id}.json`;
 const data=strToU8(JSON.stringify({formatVersion:1,id,createdAt:date,imagePath,imageByteCount:image.length,imageSHA256:await sha256(image),recognitionCompleted:true,libraryAppendOrder:0,quote:{chinese:'',english:'',source:'',sourceURL:null,provenance:'none'},labels:labels.map(l=>({english:l.english.trim(),chinese:l.chinese.trim(),x:500,y:500,phoneticUS:'',phoneticUK:'',backgroundColor:'#ffffff',textColor:'#202020',paletteColorIsFixed:true,positionUnavailable:true,learning:{partOfSpeech:'',relation:'contextual',sceneConnection:l.chinese,association:l.chinese,collocation:l.english,example:l.example||'',exampleChinese:l.exampleChinese||''}}))}));
 const manifest={formatIdentifier:'com.zhaoolee.piclex.photo-archive',formatVersion:1,exporterVersion:'1.3.0',importerVersion:'1.3.0',appVersion:'photography-english-web',exportedAt:date,photoCount:1,trashCount:0,deckName:title.trim(),photos:[{id,jsonPath,jsonSHA256:await sha256(data)}]};
 return zipSync({'manifest.json':strToU8(JSON.stringify(manifest)),[jsonPath]:data,[imagePath]:image},{level:0});
}
