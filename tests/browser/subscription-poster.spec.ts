import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
const cover=fileURLToPath(new URL('../fixtures/demo/images/cafe.jpg',import.meta.url));
test('editable template exports a real PNG and never sends the subscription URL to its host',async({page},info)=>{
 let contacted=false;await page.route('https://author.example/**',r=>{contacted=true;return r.abort();});
 await page.goto('/piclex-web/subscribe/');await expect(page.locator('#poster-result')).toBeVisible();
 await expect(page.getByLabel('顶部文案')).toHaveValue('App Store下载“摄影学英语”');
 await expect(page.getByLabel('加粗词')).toHaveValue('学习,右上角');
 await page.getByLabel('订阅清单地址').fill('https://author.example/english/feed.json');
 await page.getByLabel('主标题').fill('扫码获取这个卡组');
 await page.getByLabel('扫码指引').fill('进入学习栏目\n点击右上角按钮\n扫码即可获取卡组');
 await page.getByLabel('上传自己的封面').setInputFiles(cover);
 await page.getByLabel('配色').selectOption('night');
 await page.getByRole('button',{name:'生成二维码',exact:true}).click();
 await expect(page.locator('#save-poster')).toHaveAttribute('href',/^blob:/);
 const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'下载封面 PNG',exact:true}).click();const download=await downloadPromise;
 const output=info.outputPath('poster-export.png');await download.saveAs(output);
 const data=await readFile(output);expect([...data.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);expect(data.readUInt32BE(16)).toBe(1024);expect(data.readUInt32BE(20)).toBe(1536);
 expect(contacted).toBe(false);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('poster-page.png'),fullPage:true});
 await page.getByLabel('扫码指引').fill('一\n二\n三\n四');await expect(page.getByRole('alert')).toContainText('1至3行');await expect(page.locator('#save-poster')).not.toHaveAttribute('href',/^blob:/);
 await page.getByRole('button',{name:'恢复默认文案',exact:true}).click();await expect(page.locator('#poster-result')).toBeVisible();
 await page.getByLabel('上传自己的封面').setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('no image')});await expect(page.getByRole('alert')).toContainText('JPEG');await expect(page.locator('#poster-result')).toBeHidden();
});

test('preview recovers before PNG export finishes and stale exports cannot replace newer text',async({page})=>{
 await page.addInitScript(()=>{
  const state={hold:false,pending:[] as Array<()=>void>};
  (window as any).posterExport=state;
  const original=HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob=function(callback,...args){
   const hold=state.hold;
   return original.call(this,blob=>{if(hold)state.pending.push(()=>callback(blob));else callback(blob);},...args);
  };
 });
 await page.goto('/piclex-web/subscribe/');
 await expect(page.getByRole('link',{name:'下载封面 PNG',exact:true})).toBeVisible();
 await page.evaluate(()=>{(window as any).posterExport.hold=true;});
 await page.getByLabel('扫码指引').fill('一\n二\n三\n四');
 await expect(page.getByRole('alert')).toContainText('1至3行');
 await page.getByRole('button',{name:'恢复默认文案',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).posterExport.pending.length)).toBe(1);
 await expect(page.locator('#poster-result')).toBeVisible();
 await expect(page.locator('#save-poster')).toBeHidden();
 await expect(page.locator('#save-poster')).not.toHaveAttribute('href',/^blob:/);
 const first=await page.locator('#poster').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL());
 await page.getByLabel('主标题').fill('新的分享标题');
 await expect.poll(()=>page.evaluate(()=>(window as any).posterExport.pending.length)).toBe(2);
 const latest=await page.locator('#poster').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL());
 expect(latest).not.toBe(first);
 await page.evaluate(()=>{(window as any).posterExport.pending[0]();});
 await expect(page.locator('#save-poster')).not.toHaveAttribute('href',/^blob:/);
 expect(await page.locator('#poster').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL())).toBe(latest);
 await page.evaluate(()=>{(window as any).posterExport.pending[1]();});
 await expect(page.getByRole('link',{name:'下载封面 PNG',exact:true})).toBeVisible();
 const exported=await page.locator('#save-poster').evaluate(async(link:HTMLAnchorElement)=>{
  const blob=await(await fetch(link.href)).blob();
  return await new Promise<string>(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.readAsDataURL(blob);});
 });
 expect(exported).toBe(latest);
});
