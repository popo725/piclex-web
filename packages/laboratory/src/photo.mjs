import { exportedPhoto, browserPhoto } from './export-materials.mjs';
import {focusLayout} from '../focus.mjs';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function wordPhoto(word){
  if(exportedPhoto(word?.photo)||browserPhoto(word?.photo))return word.photo;
  if(uuid.test(word?.photoID||''))return `piclex-lab-photo://photo/${word.photoID}`;
  if(typeof word?.photo==='string'&&/^\/api\/photo\/[a-f0-9-]{36}\/image\?size=1600$/i.test(word.photo))return word.photo;
  return '';
}
export function wordFocus(value){
  if(!value||typeof value.visible!=='boolean'||!Array.isArray(value.box)||value.box.length!==4||!value.box.every(n=>Number.isFinite(n)&&n>=0&&n<=1)||value.box[2]<=0||value.box[3]<=0||value.box[0]+value.box[2]>1.000001||value.box[1]+value.box[3]>1.000001)return undefined;
  return {visible:value.visible,box:[...value.box]};
}
export function spellingPhoto(frame,img,box,word){
  const source=wordPhoto(word);frame.hidden=!source;img.onload=null;img.onerror=null;img.removeAttribute('src');box.hidden=true;
  if(!source)return;
  const draw=()=>{if(!img.naturalWidth||frame.hidden)return;const layout=focusLayout({width:img.naturalWidth,height:img.naturalHeight},{width:frame.clientWidth,height:frame.clientHeight},wordFocus(word.focus));if(!layout)return;
    Object.assign(img.style,{left:`${layout.image.x}px`,top:`${layout.image.y}px`,width:`${layout.image.width}px`,height:`${layout.image.height}px`,visibility:'visible'});
    box.hidden=!layout.box;if(layout.box)Object.assign(box.style,{left:`${layout.box.x}px`,top:`${layout.box.y}px`,width:`${layout.box.width}px`,height:`${layout.box.height}px`});
  };
  img.style.visibility='hidden';img.alt=`${word.chinese}的对应图片`;img.onload=draw;img.onerror=()=>{frame.hidden=true;};img.src=source;
  if(img.complete)draw();return draw;
}
