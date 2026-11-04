#!/usr/bin/env node
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import QRCode from 'qrcode';
import {chromium} from '@playwright/test';
import {EXAMPLES} from '../packages/subscription/links.mjs';
const {values}=parseArgs({options:{output:{type:'string'},help:{type:'boolean'}}});
if(values.help){console.log('node scripts/subscription-posters.mjs --output new-directory (Chrome + generated public content)');process.exit(0);}
if(!values.output)throw Error('Specify --output');
const root=fileURLToPath(new URL('../apps/public/public/',import.meta.url));
const catalog=JSON.parse(await readFile(resolve(root,'library/catalog.json'),'utf8'));
const template=await readFile(new URL('../packages/subscription/poster.mjs',import.meta.url),'utf8');
const directory=resolve(values.output);await mkdir(directory);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1024,height:1536},deviceScaleFactor:1});
 await page.setContent('<style>html,body{margin:0}canvas{display:block}</style><canvas id="poster"></canvas>');
 await page.addScriptTag({content:template.replace(/^export /gm,'')+'\nwindow.PiclexPoster={drawSubscriptionPoster,loadPosterImage};'});
 for(const item of EXAMPLES){
  const deck=catalog.find(d=>d.sourceURL===item.source);if(!deck)throw Error('Missing generated public deck: '+item.slug);
  const path=resolve(root,deck.covers?.portrait??deck.cover);if(!path.startsWith(root))throw Error('Invalid cover path');
  const cover='data:image/jpeg;base64,'+(await readFile(path)).toString('base64');
  const qr=await QRCode.toDataURL(item.source,{width:1024,margin:4,errorCorrectionLevel:'M'});
  await page.evaluate(async ({cover,qr,theme})=>{const api=window.PiclexPoster;const images=await Promise.all([api.loadPosterImage(cover),api.loadPosterImage(qr)]);await document.fonts.ready;api.drawSubscriptionPoster(document.getElementById('poster'),...images,{theme});},{cover,qr,theme:item.slug==='classic-english-songs'?'night':'paper'});
  await page.locator('#poster').screenshot({path:resolve(directory,item.slug+'-poster.png')});
 }
}finally{await browser.close();}
console.log('Created two cover posters with the same editable browser template.');
