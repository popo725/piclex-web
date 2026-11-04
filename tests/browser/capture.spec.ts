import {test,expect,type Page} from '@playwright/test';
import path from 'node:path';
test.use({permissions:['camera'],launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
const photo=path.resolve('tests/fixtures/demo/images/cafe.jpg');
const label={english:'cup',chinese:'杯子',example:'This is a cup.',exampleChinese:'这是一个杯子。',phoneticUS:'/kʌp/',partOfSpeech:'noun',relation:'visible',bbox:[100,200,400,600],anchor:[150,250]};
const quota={daily_limit:10,used:1,remaining:9,resets_at:2000000000};
const api='https://piclex.v2fy.com/v1/web/';
async function response(route:any,data:any,status=200){await route.fulfill({status,headers:{'Access-Control-Allow-Origin':'*'},json:data});}
async function importPhoto(page:Page){await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(photo);await expect(page.getByAltText('拍摄后的照片卡片')).toBeVisible();}
async function cancelCountdown(page:Page){await page.getByRole('button',{name:/秒后进入拼写，点击取消/}).click();await expect(page.getByRole('button',{name:'开练',exact:true})).toBeVisible();}
async function savedCount(page:Page){return page.evaluate(async()=>new Promise<number>((resolve,reject)=>{const r=indexedDB.open('piclex-web-v1');r.onsuccess=()=>{const db=r.result,t=db.transaction('decks','readonly'),q=t.objectStore('decks').count();t.oncomplete=()=>{resolve(q.result);db.close();};};r.onerror=reject;}));}
test.beforeEach(async({page})=>{await page.route(`${api}analyze`,route=>response(route,{labels:[label],quote:{chinese:'生活中的小小发现。',english:'Little discoveries in everyday life.',source:''},quota}));});
test('camera starts automatic recognition, retains a full photo and releases tracks on capture and tab exit',async({page})=>{
 await page.goto('/piclex-web/#/capture');await expect(page.getByText('首次使用会请求相机权限',{exact:true})).toBeVisible();await expect(page.getByText('拍摄或导入后，照片将自动上传进行 AI 识图',{exact:true})).toBeVisible();await page.getByRole('button',{name:'打开相机',exact:true}).click();
 const video=page.getByLabel('相机实时预览');await expect(video).toBeVisible();await expect(page.getByRole('button',{name:'拍下这张照片'})).toBeEnabled();await video.evaluate((element:HTMLVideoElement)=>(window as any).__captureTrack=(element.srcObject as MediaStream).getVideoTracks()[0]);
 await page.getByRole('button',{name:'拍下这张照片'}).click();await cancelCountdown(page);expect(await page.evaluate(()=>(window as any).__captureTrack.readyState)).toBe('ended');
 await page.getByRole('button',{name:'继续拍摄',exact:true}).click();await page.getByRole('button',{name:'拍摄照片',exact:true}).click();await expect(video).toBeVisible();await video.evaluate((element:HTMLVideoElement)=>(window as any).__captureTrack=(element.srcObject as MediaStream).getVideoTracks()[0]);
 await page.getByRole('navigation',{name:'底部导航'}).getByRole('button',{name:'设置',exact:true}).click();expect(await page.evaluate(()=>(window as any).__captureTrack.readyState)).toBe('ended');
});
test('import automatically recognizes and saves, then enters spelling after three seconds',async({page})=>{
 let uploads=0;await page.route(`${api}analyze`,async route=>{uploads++;expect(route.request().method()).toBe('POST');expect(route.request().headers()['content-type']).toContain('multipart/form-data');expect(route.request().postData()).toContain('client_id');await response(route,{labels:[label],quote:null,quota});});
 await page.goto('/piclex-web/#/capture');await importPhoto(page);await expect(page.getByRole('button',{name:/秒后进入拼写，点击取消/})).toBeVisible();expect(await savedCount(page)).toBe(1);await expect(page.getByLabel('卡组名称',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'杯子',exact:true})).toBeVisible({timeout:6000});await expect(page.locator('.photo-focus')).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'杯子',exact:true})).toBeVisible();expect(uploads).toBe(1);
});
test('review cancels once, edits replace the saved card and retain focus and examples',async({page},info)=>{
 await page.goto('/piclex-web/#/capture');await importPhoto(page);await cancelCountdown(page);await expect(page.getByRole('form',{name:'编辑照片卡片'})).toHaveCount(0);
 await page.getByRole('button',{name:'cup 杯子',exact:true}).first().click();await expect(page.locator('.capture-object-box')).toBeVisible();
 const geometry=await page.locator('.capture-annotated-photo>img').evaluate((img:HTMLImageElement)=>({width:img.clientWidth,height:img.clientHeight,ratio:img.naturalWidth/img.naturalHeight,overflow:document.documentElement.scrollWidth>innerWidth}));expect(geometry.height).toBeGreaterThan(160);expect(geometry.width/geometry.height).toBeCloseTo(geometry.ratio,1);expect(geometry.overflow).toBe(false);
 await page.screenshot({path:info.outputPath(`capture-review-${info.project.name}.png`),fullPage:true});
 await page.getByRole('button',{name:'编辑卡片',exact:true}).click();await expect(page.getByLabel('英文例句（可选）',{exact:true})).toHaveValue('This is a cup.');await page.getByLabel('中文释义',{exact:true}).fill('茶杯');await page.getByRole('button',{name:'保存修改',exact:true}).click();await expect(page.getByRole('button',{name:'开练',exact:true})).toBeVisible();expect(await savedCount(page)).toBe(1);
 await page.waitForTimeout(3200);await expect(page).toHaveURL(/#\/capture$/);await page.getByRole('button',{name:'开练',exact:true}).click();await expect(page.getByRole('heading',{name:'茶杯',exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'茶杯',exact:true})).toBeVisible();
});
test('quota failure retains the draft across reload and manual editing is optional',async({page})=>{
 let uploads=0;await page.route(`${api}analyze`,route=>{uploads++;return response(route,{error:{code:'quota_exhausted',message:'今日 10 张识图额度已用完，明天再来吧。'}},429);});
 await page.goto('/piclex-web/#/capture');await importPhoto(page);await expect(page.getByRole('status').filter({hasText:'今日 10 张'})).toBeVisible();await page.reload();await page.getByRole('button',{name:/照片 1 · 待重试/}).click();await expect(page.getByAltText('拍摄后的照片卡片')).toBeVisible();expect(uploads).toBe(1);
 await page.getByRole('button',{name:'手动填写',exact:true}).click();await page.getByLabel('英文',{exact:true}).fill('cup');await page.getByLabel('中文释义',{exact:true}).fill('杯子');await page.getByRole('button',{name:'保存修改',exact:true}).click();await expect(page.getByRole('button',{name:'开练',exact:true})).toBeVisible();await page.getByRole('button',{name:'开练',exact:true}).click();await expect(page.getByRole('heading',{name:'杯子',exact:true})).toBeVisible();expect(uploads).toBe(1);
});
test('background completion saves without changing tabs or restarting a countdown',async({page})=>{
 let finish!:()=>void;const blocked=new Promise<void>(resolve=>finish=resolve);await page.route(`${api}analyze`,async route=>{await blocked;await response(route,{labels:[label],quote:null,quota});});
 await page.goto('/piclex-web/#/capture');await importPhoto(page);await expect(page.getByRole('status').filter({hasText:'正在识图并生成卡片'})).toBeVisible();const tabs=page.getByRole('navigation',{name:'底部导航'});await tabs.getByRole('button',{name:'设置',exact:true}).click();finish();await expect.poll(()=>savedCount(page)).toBe(1);await page.waitForTimeout(3200);await expect(page).toHaveURL(/#\/settings$/);await tabs.getByRole('button',{name:'拍摄',exact:true}).click();await expect(page.getByRole('button',{name:'开练',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/秒后进入拼写/})).toHaveCount(0);
});
test('continuing capture serializes recognition and preserves both cards',async({page})=>{
 let finish!:()=>void;const blocked=new Promise<void>(resolve=>finish=resolve);let uploads=0;await page.route(`${api}analyze`,async route=>{uploads++;if(uploads===1)await blocked;await response(route,{labels:[label],quote:null,quota});});
 await page.goto('/piclex-web/#/capture');await importPhoto(page);await expect.poll(()=>uploads).toBe(1);await page.getByRole('button',{name:'继续拍摄',exact:true}).click();await importPhoto(page);await expect(page.getByRole('status').filter({hasText:'正在准备识图'})).toBeVisible();expect(uploads).toBe(1);await expect.poll(()=>page.evaluate(()=>new Promise<number>((resolve,reject)=>{const r=indexedDB.open('photography-english-capture-v1');r.onsuccess=()=>{const db=r.result,t=db.transaction('drafts','readonly'),q=t.objectStore('drafts').count();t.oncomplete=()=>{resolve(q.result);db.close();};};r.onerror=reject;}))).toBe(2);finish();await cancelCountdown(page);await expect.poll(()=>savedCount(page)).toBe(2);expect(uploads).toBe(2);
});
test('failed local save retries stored recognition without another upload',async({page})=>{
 await page.addInitScript(()=>{const transaction=IDBDatabase.prototype.transaction;(window as any).__failCaptureSave=true;IDBDatabase.prototype.transaction=function(...args:any[]){if(this.name==='piclex-web-v1'&&args[1]==='readwrite'&&(window as any).__failCaptureSave){(window as any).__failCaptureSave=false;throw Error('本地空间不足，卡组未保存。');}return transaction.apply(this,args as any);};});
 let uploads=0;await page.route(`${api}analyze`,route=>{uploads++;return response(route,{labels:[label],quote:null,quota});});await page.goto('/piclex-web/#/capture');await importPhoto(page);await expect(page.getByRole('status').filter({hasText:'本地空间不足'})).toBeVisible();await expect(page.getByAltText('拍摄后的照片卡片')).toBeVisible();await page.getByRole('button',{name:'重试保存',exact:true}).click();await expect(page.getByRole('button',{name:'开练',exact:true})).toBeVisible();expect(await savedCount(page)).toBe(1);expect(uploads).toBe(1);
});
test('cancel waiting keeps photo and allows retry without stale response navigation',async({page})=>{
 let finish!:()=>void;const blocked=new Promise<void>(resolve=>finish=resolve);let uploads=0;await page.route(`${api}analyze`,async route=>{uploads++;if(uploads===1)await blocked;await response(route,{labels:[label],quote:null,quota}).catch(()=>{});});
 await page.goto('/piclex-web/#/capture');await importPhoto(page);await expect.poll(()=>uploads).toBe(1);await page.getByRole('button',{name:'取消等待',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'已取消等待，照片已保留'})).toBeVisible();finish();await page.getByRole('button',{name:'重试识别',exact:true}).click();await expect(page.getByRole('button',{name:'开练',exact:true})).toBeVisible();expect(await savedCount(page)).toBe(1);expect(uploads).toBe(2);
});
test('denied camera permission still allows import and automatic recognition',async({page})=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError');};});await page.goto('/piclex-web/#/capture');await page.getByRole('button',{name:'拍摄照片',exact:true}).click();await expect(page.getByText('相机权限未开启，请在浏览器中允许相机，或导入照片。',{exact:true})).toBeVisible();await importPhoto(page);await cancelCountdown(page);
});
