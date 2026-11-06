import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
const catalog=JSON.parse(fs.readFileSync('apps/public/public/library/catalog.json','utf8')),card=catalog[0];
const payload=fs.readFileSync('apps/public/public/'+card.payload),deck=JSON.parse(payload.toString());
const photo=fs.readFileSync('apps/public/public/'+deck.photos[0].path);
test('the inline Pac-Man appears before app assets and leaves after the styled app mounts',async({page})=>{
 let releaseStyle!:()=>void,releaseScript!:()=>void;
 const styleGate=new Promise<void>(resolve=>releaseStyle=resolve),scriptGate=new Promise<void>(resolve=>releaseScript=resolve);
 await page.route(/\/assets\/main-[^/]+\.css$/,async route=>{await styleGate;await route.continue();});
 await page.route(/\/assets\/main-[^/]+\.js$/,async route=>{await scriptGate;await route.continue();});
 try{
  await page.goto('/piclex-web/#/capture',{waitUntil:'commit'});
  const loader=page.getByRole('status',{name:'页面加载中'});
  await expect(loader).toBeVisible();
  await expect(loader.locator('.boot-pac')).toHaveCount(1);
  await expect.poll(()=>loader.locator('.boot-pac').evaluate(el=>getComputedStyle(el,'::before').animationName)).toBe('boot-chomp-top');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>loader.locator('.boot-pac').evaluate(el=>getComputedStyle(el,'::before').animationName)).toBe('none');
  releaseScript();
  await expect.poll(()=>page.locator('#root').evaluate(el=>el.childElementCount)).toBeGreaterThan(0);
  await expect(loader).toBeVisible();
  releaseStyle();
  await expect(loader).toHaveCount(0);
  await expect(page.getByRole('navigation',{name:'底部导航'})).toBeVisible();
 }finally{releaseScript();releaseStyle();}
});
test('all bottom icon assets start loading before any tap and delayed atlases retain square static icons',async({page})=>{
 const requested:string[]=[],loadedFrames=new Set<string>();let unlock!:()=>void;const gate=new Promise<void>(resolve=>unlock=resolve);
 page.on('request',r=>{if(/\/icons\/tab-/.test(r.url()))requested.push(r.url());});
 page.on('requestfinished',r=>{if(r.resourceType()==='image'&&/\/icons\/tab-.*-frames\.png$/.test(r.url()))loadedFrames.add(r.url());});
 await page.route('**/icons/tab-*-frames.png',async route=>{await gate;await route.continue();});
 await page.goto('/piclex-web/#/capture',{waitUntil:'domcontentloaded'});
 await expect.poll(()=>new Set(requested.map(url=>new URL(url).pathname)).size).toBe(6);
 const tabs=page.getByRole('navigation',{name:'底部导航'});
 await tabs.getByRole('button',{name:'设置',exact:true}).click();await expect(tabs.locator('.native-tab-motion')).toHaveCount(0);
 for(const icon of await tabs.locator('.native-tab-icon').all()){const rect=await icon.boundingBox();expect(rect!.width).toBeGreaterThan(18);expect(rect!.height).toBe(rect!.width);}
 // networkidle can occur before requestIdleCallback starts the background warmup.
 // Wait for the three actual image fetches (not just HTML fetch preloads).
 unlock();await expect.poll(()=>loadedFrames.size,{timeout:15000}).toBe(3);await page.waitForLoadState('networkidle');
 for(const name of ['学习','拍摄','设置'])await tabs.getByRole('button',{name,exact:true}).click();
 await expect(tabs.locator('.native-tab-motion')).toHaveCount(0,{timeout:3000});
});
// Playwright routing disables HTTP caching, so the delayed-image test above
// cannot also validate cache reuse. Exercise the normal browser cache separately.
test('warmed bottom icons reuse image bytes when navigating without request interception',async({page})=>{
 const loadedFrames=new Set<string>();
 page.on('requestfinished',r=>{if(r.resourceType()==='image'&&/\/icons\/tab-.*-frames\.png$/.test(r.url()))loadedFrames.add(r.url());});
 await page.goto('/piclex-web/#/capture');
 await expect.poll(()=>loadedFrames.size,{timeout:15000}).toBe(3);
 await page.waitForLoadState('networkidle');
 const resources=()=>page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/\/icons\/tab-/.test(e.name)).map(e=>({name:e.name,transferSize:(e as PerformanceResourceTiming).transferSize})));
 const before=await resources();expect(new Set(before.map(e=>e.name)).size).toBe(6);
 const tabs=page.getByRole('navigation',{name:'底部导航'});
 for(const name of ['学习','拍摄','设置'])await tabs.getByRole('button',{name,exact:true}).click();
 await expect(tabs.locator('.native-tab-motion')).toHaveCount(0,{timeout:3000});await page.waitForLoadState('networkidle');
 // A memory/disk hit transfers zero bytes; conditional validation can report
 // the Resource Timing header allowance (300 bytes), but must not redownload PNG data.
 const subsequent=(await resources()).slice(before.length);
 for(const entry of subsequent){expect(before.some(e=>e.name===entry.name)).toBe(true);expect(entry.transferSize).toBeLessThanOrEqual(300);}
});
test('deck and photo downloads display actual intermediate progress, then clear after decoding',async({page},testInfo)=>{
 let releaseDeck!:()=>void,releasePhoto!:()=>void;
 const deckGate=new Promise<void>(r=>releaseDeck=r),photoGate=new Promise<void>(r=>releasePhoto=r);
 const server=http.createServer(async(req,res)=>{const bytes=req.url==='/deck'?payload:photo;res.writeHead(200,{'Content-Type':req.url==='/deck'?'application/json':'image/jpeg','Content-Length':bytes.length,'Access-Control-Allow-Origin':'*'});const split=Math.floor(bytes.length/2);res.write(bytes.subarray(0,split));await(req.url==='/deck'?deckGate:photoGate);res.end(bytes.subarray(split));});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const port=(server.address() as any).port;
 try{
  await page.route('**/'+card.payload,route=>route.continue({url:`http://127.0.0.1:${port}/deck`}));
  await page.route('**/'+deck.photos[0].path,route=>route.continue({url:`http://127.0.0.1:${port}/photo`}));
  await page.goto('/piclex-web/#/deck/'+card.id,{waitUntil:'domcontentloaded'});
  const data=page.getByRole('progressbar',{name:'正在加载卡组',exact:true});await expect(data).toBeVisible();await expect.poll(async()=>Number(await data.getAttribute('value'))).toBeGreaterThan(0);expect(Number(await data.getAttribute('value'))).toBeLessThan(100);
  const bounds=await data.boundingBox(),height=page.viewportSize()!.height;expect(bounds!.y).toBeGreaterThan(height*.3);expect(bounds!.y).toBeLessThan(height*.7);
  await page.screenshot({path:testInfo.outputPath('deck-download-progress.png')});
  releaseDeck();const image=page.getByRole('progressbar',{name:'正在加载图片',exact:true});await expect(image).toBeVisible();await expect.poll(async()=>Number(await image.getAttribute('value'))).toBeGreaterThan(0);expect(Number(await image.getAttribute('value'))).toBeLessThan(100);await expect(page.locator('.focus-image')).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath('photo-download-progress.png')});
  releasePhoto();await expect(page.locator('.focus-image')).toBeVisible();await expect(image).toHaveCount(0);expect(await page.locator('.focus-image').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 }finally{releaseDeck();releasePhoto();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
test('a failed photo has an explicit retry action and no endless progress bar',async({page})=>{
 let attempts=0;await page.route('**/'+deck.photos[0].path,async route=>{if(++attempts===1)await route.abort();else await route.continue();});
 await page.goto('/piclex-web/#/deck/'+card.id);await expect(page.getByText('图片加载失败，点击重试',{exact:true})).toBeVisible();await expect(page.getByRole('progressbar',{name:'正在加载图片',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'重新加载图片',exact:true}).click();await expect(page.locator('.focus-image')).toBeVisible();await expect(page.getByText('图片加载失败，点击重试',{exact:true})).toHaveCount(0);expect(attempts).toBe(2);
});
