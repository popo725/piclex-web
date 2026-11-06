import QRCode from 'qrcode';
import {sourceURL,EXAMPLES} from '../../../packages/subscription/links.mjs';
import {DEFAULT_POSTER_TEXT,drawSubscriptionPoster,loadPosterImage} from '../../../packages/subscription/poster.mjs';
import './style.css';
const el=id=>document.getElementById(id);
let current='',generation=0,coverGeneration=0,cover=null,posterURL=null,uploadedURL=null,catalogPromise,timer;
const fields={brand:'brand-text',heading:'heading-text',guide:'guide-text',emphasis:'emphasis-text',theme:'theme',panelY:'panel-y',qrSize:'qr-size'};
function defaults(){for(const [key,id] of Object.entries(fields))el(id).value=DEFAULT_POSTER_TEXT[key];}
function settings(){return Object.fromEntries(Object.entries(fields).map(([key,id])=>[key,el(id).value]));}
function clearPoster(){el('poster-result').hidden=true;el('save-poster').hidden=true;el('save-poster').removeAttribute('href');if(posterURL){URL.revokeObjectURL(posterURL);posterURL=null;}}
async function render(){
 const token=++generation;el('error').textContent='';el('result').hidden=true;clearPoster();
 try{
  const url=sourceURL(el('source').value.trim());const qr=await QRCode.toCanvas(url,{errorCorrectionLevel:'M',margin:4,width:1024});const image=qr.toDataURL('image/png');
  if(token!==generation)return;
  current=url;el('qr').src=image;el('save-qr').href=image;el('source-display').textContent=url;el('result').hidden=false;
  if(!cover)return;
  const canvas=drawSubscriptionPoster(document.createElement('canvas'),cover,qr,settings());
  el('poster').width=1024;el('poster').height=1536;el('poster').getContext('2d').drawImage(canvas,0,0);
  el('poster-result').hidden=false;el('preview-placeholder').hidden=true;
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(token!==generation)return;if(!blob)throw Error('图片生成失败，请重试。');
  posterURL=URL.createObjectURL(blob);el('save-poster').href=posterURL;el('save-poster').hidden=false;
 }catch(error){if(token===generation){el('error').textContent=error.message;el('preview-placeholder').hidden=false;el('preview-placeholder').textContent='修改输入后会自动更新预览。';}}
}
async function loadPreset(slug){
 const token=++coverGeneration;++generation;cover=null;clearPoster();el('preview-placeholder').hidden=false;el('preview-placeholder').textContent='正在准备封面…';
 const item=EXAMPLES.find(e=>e.slug===slug);el('source').value=item.source;el('theme').value=slug==='classic-english-songs'?'night':'paper';
 try{
  catalogPromise??=fetch('../library/catalog.json').then(r=>{if(!r.ok)throw Error('示例封面暂不可用，请上传自己的封面。');return r.json();});
  const catalog=await catalogPromise;const entry=catalog.find(d=>d.sourceURL===item.source);if(!entry)throw Error('示例封面暂不可用，请上传自己的封面。');
  const address=new URL('../'+(entry.covers?.portrait??entry.cover),location.href);if(address.origin!==location.origin)throw Error('示例封面地址无效。');
  const image=await loadPosterImage(address.href);if(token!==coverGeneration)return;
  cover=image;await render();
 }catch(error){if(token===coverGeneration){el('preview-placeholder').textContent=error.message;await render();}}
}
el('copy-source').onclick=async()=>{try{await navigator.clipboard.writeText(current);el('notice').textContent='已复制';}catch{el('notice').textContent='无法自动复制，请长按订阅地址复制。';}};
el('generator').onsubmit=event=>{event.preventDefault();clearTimeout(timer);render();};
for(const id of ['source',...Object.values(fields)])el(id).addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(render,120);});
el('reset-template').onclick=()=>{clearTimeout(timer);defaults();render();};
el('preset').onchange=()=>loadPreset(el('preset').value);
el('cover-file').onchange=async()=>{
 const file=el('cover-file').files[0];if(!file)return;const token=++coverGeneration;++generation;cover=null;clearPoster();
 try{if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)throw Error('请选择12MB以内的 JPEG、PNG 或 WebP 封面。');
  if(uploadedURL)URL.revokeObjectURL(uploadedURL);uploadedURL=URL.createObjectURL(file);const image=await loadPosterImage(uploadedURL);if(token!==coverGeneration)return;cover=image;await render();
 }catch(error){if(token===coverGeneration){el('error').textContent=error.message;el('preview-placeholder').hidden=false;el('preview-placeholder').textContent='请重新选择封面。';}}
};
for(const item of EXAMPLES){const b=document.createElement('button');b.textContent=item.title;b.onclick=()=>{el('preset').value=item.slug;loadPreset(item.slug);};el('examples').append(b);}
window.addEventListener('pagehide',()=>{if(posterURL)URL.revokeObjectURL(posterURL);if(uploadedURL)URL.revokeObjectURL(uploadedURL);});
defaults();loadPreset('nce2');
