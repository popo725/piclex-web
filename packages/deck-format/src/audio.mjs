import {sha256} from './archive.mjs';
export const MAX_AUDIO_BYTES=256*1024;
const fail=()=>{throw new Error('卡组原音频校验失败，请重新导出。');};
export function validateAudioInfo(audio){
 if(!audio||audio.mediaType!=='audio/mpeg'||!Number.isSafeInteger(audio.byteCount)||audio.byteCount<1||audio.byteCount>MAX_AUDIO_BYTES||!Number.isFinite(audio.durationSeconds)||audio.durationSeconds<=0||audio.durationSeconds>60||! /^[a-f0-9]{64}$/.test(audio.sha256))fail();
}
export async function parseEmbeddedAudio(audio){
 if(audio===undefined)return undefined;
 validateAudioInfo(audio);
 if(typeof audio.dataBase64!=='string'||audio.dataBase64.length!==Math.ceil(audio.byteCount/3)*4||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(audio.dataBase64))fail();
 let raw;try{raw=atob(audio.dataBase64);}catch{fail();}
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 const mp3=bytes[0]===0x49&&bytes[1]===0x44&&bytes[2]===0x33||bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0;
 if(!mp3||bytes.length!==audio.byteCount||btoa(raw)!==audio.dataBase64||await sha256(bytes)!==audio.sha256)fail();
 return {mediaType:audio.mediaType,dataBase64:audio.dataBase64,sha256:audio.sha256,byteCount:audio.byteCount,durationSeconds:audio.durationSeconds};
}
