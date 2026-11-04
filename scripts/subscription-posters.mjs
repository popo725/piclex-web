#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import QRCode from 'qrcode';
import {chromium} from '@playwright/test';
import {EXAMPLES} from '../packages/subscription/links.mjs';
const {values}=parseArgs({options:{output:{type:'string'},help:{type:'boolean'}}});
if(values.help){console.log('node scripts/subscription-posters.mjs --output new-directory (requires Chrome and generated public content)');process.exit(0);}
if(!values.output)throw Error('Specify --output');
const root=fileURLToPath(new URL('../apps/public/public/',import.meta.url));
const catalog=JSON.parse(await readFile(resolve(root,'library/catalog.json'),'utf8'));
const directory=resolve(values.output);await mkdir(directory);
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1024,height:1536},deviceScaleFactor:1});
 for(const item of EXAMPLES){
  const deck=catalog.find(d=>d.sourceURL===item.source);if(!deck)throw Error('Missing generated public deck: '+item.slug);
  const path=resolve(root,deck.covers?.portrait ?? deck.cover);if(!path.startsWith(root+sep)&&!path.startsWith(root))throw Error('Invalid cover path');
  const cover=(await readFile(path)).toString('base64');
  const qr=await QRCode.toDataURL(item.source,{width:600,margin:4,errorCorrectionLevel:'M'});
  const music=item.slug==='classic-english-songs';
  const html=`<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><title>${escape(item.title)} · 扫码下载</title><style>
  *{box-sizing:border-box}html,body{margin:0;width:1024px;height:1536px;overflow:hidden}body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:${music?'#f5d89b':'#19334b'};background:${music?'#062c29':'#f9e7c8'}}
  .cover{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
  .panel{position:absolute;left:56px;right:56px;top:1004px;height:374px;display:flex;align-items:center;gap:34px;padding:30px;background:${music?'rgba(5,35,31,.97)':'rgba(255,247,228,.97)'};border:2px solid ${music?'#c49a50':'#cba56c'};border-radius:24px;box-shadow:0 16px 44px #0003}
  .qr{width:310px;height:310px;border-radius:8px;background:#fff;flex:none}.text{flex:1}.eyebrow{font-size:21px;letter-spacing:4px;margin:0 0 12px;opacity:.75}h1{font-size:43px;line-height:1.3;margin:0 0 20px;font-weight:700;letter-spacing:1px}p{font-size:24px;line-height:1.7;margin:0}.hint{font-size:20px;opacity:.7;margin-top:12px}.steps{font-size:24px;line-height:1.8}
  </style><img class="cover" alt="${escape(item.title)}封面" src="data:image/jpeg;base64,${cover}"><section class="panel"><img class="qr" alt="订阅二维码" src="${qr}"><div class="text"><p class="eyebrow">摄影学英语 · 第三方卡组</p><h1>扫码下载，开始学习</h1><p class="steps">打开摄影学英语 App<br>进入「学习」栏目<br>点右上角「下载第三方卡组」扫码</p><p class="hint">下载后可离线学习 · 支持订阅更新</p></div></section></html>`;
  await page.setContent(html);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:resolve(directory,item.slug+'-poster.png')});
  await writeFile(resolve(directory,item.slug+'-poster.html'),html);
 }
}finally{await browser.close();}
console.log('Created two 1024 × 1536 cover posters with unmodified URL QR payloads.');
