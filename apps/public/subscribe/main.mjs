import QRCode from 'qrcode';
import {sourceURL,EXAMPLES} from '../../../packages/subscription/links.mjs';
import './style.css';
const el=id=>document.getElementById(id);
let current='';let generation=0;
async function render(value){
 const token=++generation;el('error').textContent='';el('result').hidden=true;
 try{
  const url=sourceURL(value);const image=await QRCode.toDataURL(url,{errorCorrectionLevel:'M',margin:4,width:1024});
  if(token!==generation)return;
  current=url;el('qr').src=image;el('save-qr').href=image;el('source-display').textContent=url;el('result').hidden=false;
 }catch(error){if(token===generation)el('error').textContent=error.message;}
}
el('copy-source').onclick=async()=>{try{await navigator.clipboard.writeText(current);el('notice').textContent='已复制';}catch{el('notice').textContent='无法自动复制，请长按下面的订阅地址复制。';}};
el('generator').onsubmit=event=>{event.preventDefault();render(el('source').value.trim());};
for(const item of EXAMPLES){const b=document.createElement('button');b.textContent=item.title;b.onclick=()=>{el('source').value=item.source;render(item.source);};el('examples').append(b);}
