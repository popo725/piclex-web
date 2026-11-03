import {test,expect} from '@playwright/test';
import path from 'node:path';
test.use({permissions:['camera'],launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
const photo=path.resolve('tests/fixtures/demo/images/cafe.jpg');
const label={english:'cup',chinese:'杯子',example:'This is a cup.',exampleChinese:'这是一个杯子。',phoneticUS:'/kʌp/',partOfSpeech:'noun',relation:'visible',bbox:[100,200,400,600],anchor:[150,250]};
const quota={daily_limit:10,used:0,remaining:10,resets_at:2000000000};
const api='https://piclex.v2fy.com/v1/web/';
async function response(route:any,data:any,status=200){await route.fulfill({status,headers:{'Access-Control-Allow-Origin':'*'},json:data});}
test.beforeEach(async({page})=>{await page.route(`${api}quota`,route=>response(route,{enabled:true,quota}));});
test('camera really opens a video stream, captures a photo and releases tracks on capture and tab exit',async({page})=>{
 await page.goto('/piclex-web/#/capture');await page.getByRole('button',{name:'拍摄照片',exact:true}).click();
 const video=page.getByLabel('相机实时预览');await expect(video).toBeVisible();await expect(page.getByRole('button',{name:'拍下这张照片'})).toBeEnabled();
 await video.evaluate((element:HTMLVideoElement)=>(window as any).__captureTrack=(element.srcObject as MediaStream).getVideoTracks()[0]);
 await page.getByRole('button',{name:'拍下这张照片'}).click();await expect(page.getByAltText('准备制卡的照片')).toBeVisible();expect(await page.evaluate(()=>(window as any).__captureTrack.readyState)).toBe('ended');
 await page.getByRole('button',{name:'拍摄照片',exact:true}).click();await expect(video).toBeVisible();await video.evaluate((element:HTMLVideoElement)=>(window as any).__captureTrack=(element.srcObject as MediaStream).getVideoTracks()[0]);
 await page.getByRole('navigation',{name:'底部导航'}).getByRole('button',{name:'设置',exact:true}).click();expect(await page.evaluate(()=>(window as any).__captureTrack.readyState)).toBe('ended');
});
test('AI upload is explicit; editable complete cards preserve examples and focus after saving',async({page})=>{
 let uploads=0;await page.route(`${api}analyze`,async route=>{uploads++;expect(route.request().method()).toBe('POST');expect(route.request().headers()['content-type']).toContain('multipart/form-data');expect(route.request().postData()).toContain('client_id');await response(route,{labels:[label],quote:null,quota:{...quota,used:1,remaining:9}});});
 await page.goto('/piclex-web/#/capture');await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(photo);await expect(page.getByAltText('准备制卡的照片')).toBeVisible();expect(uploads).toBe(0);
 await page.getByRole('button',{name:'AI 识图生成卡片'}).click();await expect(page.getByLabel('英文',{exact:true})).toHaveValue('cup');await expect(page.getByLabel('英文例句（可选）',{exact:true})).toHaveValue('This is a cup.');await page.getByLabel('中文释义',{exact:true}).fill('茶杯');
 await page.getByRole('button',{name:'保存卡组并学习'}).click();await expect(page.getByRole('heading',{name:'茶杯',exact:true})).toBeVisible();await expect(page.locator('.photo-focus')).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'茶杯',exact:true})).toBeVisible();expect(uploads).toBe(1);
});
test('quota failure preserves photo and permits manual cards; anonymous browser ID survives reload',async({page})=>{
 const identities:string[]=[];await page.route(`${api}quota`,async route=>{identities.push(new URLSearchParams(route.request().postData()!).get('client_id')!);await response(route,{enabled:true,quota});});
 await page.route(`${api}analyze`,route=>response(route,{error:{code:'quota_exhausted',message:'今日 10 张识图额度已用完，明天再来吧。'}},429));
 await page.goto('/piclex-web/#/capture');await expect.poll(()=>identities.length).toBeGreaterThan(0);await page.reload();await expect.poll(()=>identities.length).toBeGreaterThan(1);expect(new Set(identities).size).toBe(1);
 await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(photo);await page.getByRole('button',{name:'AI 识图生成卡片'}).click();await expect(page.getByRole('status').filter({hasText:'今日 10 张'})).toBeVisible();await expect(page.getByAltText('准备制卡的照片')).toBeVisible();await page.getByLabel('英文',{exact:true}).fill('cup');await page.getByLabel('中文释义',{exact:true}).fill('杯子');await page.getByRole('button',{name:'保存卡组并学习'}).click();await expect(page.getByRole('heading',{name:'杯子',exact:true})).toBeVisible();
});
test('denied camera permission explains the fallback and never prevents importing',async({page})=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError');};});await page.goto('/piclex-web/#/capture');await page.getByRole('button',{name:'拍摄照片',exact:true}).click();await expect(page.getByText('相机权限未开启，请在浏览器中允许相机，或导入照片。',{exact:true})).toBeVisible();await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(photo);await expect(page.getByAltText('准备制卡的照片')).toBeVisible();
});
