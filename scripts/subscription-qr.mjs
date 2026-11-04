#!/usr/bin/env node
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import QRCode from 'qrcode';
import {sourceURL,EXAMPLES} from '../packages/subscription/links.mjs';
const {values} = parseArgs({options:{source:{type:'string'},output:{type:'string'},examples:{type:'boolean'},help:{type:'boolean'}}});
if(values.help){console.log('node scripts/subscription-qr.mjs --source https://example.com/feed.json --output new-directory\nnode scripts/subscription-qr.mjs --examples --output new-directory');process.exit(0);}
try {
  if(!values.output || (values.examples ? values.source : !values.source)) throw Error('指定 --output，并选择 --source 或 --examples。');
  const entries=(values.examples ? EXAMPLES : [{slug:'subscription',source:values.source}]).map(e=>({...e,source:sourceURL(e.source)}));
  const dir=resolve(values.output); await mkdir(dir);
  for(const e of entries){
    const options={errorCorrectionLevel:'M',margin:4,width:1024};
    await writeFile(resolve(dir,e.slug+'.svg'),await QRCode.toString(e.source,{...options,type:'svg'}));
    await QRCode.toFile(resolve(dir,e.slug+'.png'),e.source,options);
  }
  await writeFile(resolve(dir,'links.json'),JSON.stringify(entries,null,2)+'\n');
  console.log(`已生成 ${entries.length} 个纯 URL 二维码：${dir}`);
} catch(error){console.error(error.message);process.exitCode=1;}
