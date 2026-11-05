import {test,expect} from '@playwright/test';
import path from 'node:path';
const photo=path.resolve('tests/fixtures/demo/images/cafe.jpg');
test.beforeEach(async({page})=>{
 await page.route('https://piclex.v2fy.com/v1/web/analyze',()=>{});
});
test('diffuse colour is baked into every layer even with CSS filters disabled',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('piclex-web.import-animation','false'));
 await page.goto('/piclex-web/#/capture');
 await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();
 await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(photo);
 await expect(page.locator('.recognition-halo')).toBeVisible();
 await page.addStyleTag({content:'.recognition-halo canvas{filter:none!important;-webkit-filter:none!important}'});
 await expect.poll(()=>page.locator('.recognition-halo canvas').first().evaluate((n:HTMLCanvasElement)=>n.width)).toBeGreaterThan(10);
 const profiles=await page.locator('.recognition-halo canvas').evaluateAll((nodes:HTMLCanvasElement[])=>nodes.map(n=>{
  const dpr=n.width/parseFloat(n.style.width),pad=-parseFloat(n.style.top)*dpr,x=Math.floor(n.width/2);
  const data=n.getContext('2d')!.getImageData(x,Math.round(pad),1,Math.min(80,n.height-Math.round(pad))).data;
  const alpha=Array.from({length:data.length/4},(_,i)=>data[4*i+3]);
  return {levels:new Set(alpha).size,peak:Math.max(...alpha),tail:alpha.at(-1),filter:getComputedStyle(n).filter};
 }));
 // Broad waves must have a continuous alpha ramp; subpixel highlight rims
 // span fewer physical pixels at this mobile size. Hard strokes fail either check.
 profiles.forEach((p,i)=>{expect(p.filter).toBe('none');expect(p.levels).toBeGreaterThan(i<3?10:2);expect(p.peak).toBeGreaterThan(15);expect(p.tail).toBeLessThan(3);});
 await info.attach('alpha-profiles',{body:JSON.stringify(profiles),contentType:'application/json'});
 const first=await page.locator('.recognition-halo canvas').first().evaluate((n:HTMLCanvasElement)=>n.toDataURL());await page.waitForTimeout(150);
 expect(await page.locator('.recognition-halo canvas').first().evaluate((n:HTMLCanvasElement)=>n.toDataURL())).toBe(first);
 await page.screenshot({path:info.outputPath('baked-soft-glow.png')});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await expect.poll(()=>page.locator('.recognition-halo canvas').first().evaluate((n:HTMLCanvasElement)=>n.toDataURL())).not.toBe(first);
});
test('destination remains hidden until the entire tilted sheet lands, including the final flight frames',async({page},info)=>{
 await page.addInitScript(()=>{
  const original=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){
   const a=original.call(this,frames,options),duration=typeof options==='object'?options.duration:options;
   if(this.classList.contains('print-paper')&&duration===720){(window as any).__flight=a;a.pause();}
   if(this.classList.contains('capture-printing')&&duration===160){(window as any).__fade=a;a.pause();}
   return a;
  };
 });
 await page.goto('/piclex-web/#/capture');await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();
 await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(photo);
 await expect(page.locator('.capture-printing')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>!!(window as any).__flight),{timeout:15000}).toBe(true);
 for(const time of [0,180,360,600,719]){
  await page.evaluate(t=>{(window as any).__flight.currentTime=t;},time);
  await expect(page.locator('.capture-review')).toHaveCSS('visibility','hidden');
  await expect(page.locator('.capture-review')).toHaveAttribute('inert','');
  await expect(page.getByRole('button',{name:/秒后进入拼写/})).toHaveCount(0);
  if(time===600)await page.screenshot({path:info.outputPath('single-sheet-returning.png')});
 }
 await page.evaluate(()=>{(window as any).__flight.finish();});
 await expect.poll(()=>page.evaluate(()=>!!(window as any).__fade)).toBe(true);
 await expect(page.locator('.capture-review')).toHaveCSS('visibility','visible');
 const boxes=await page.evaluate(()=>['.print-paper','.capture-card'].map(s=>{const r=document.querySelector(s)!.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
 for(const key of ['x','y','w','h'] as const)expect(Math.abs(boxes[0][key]-boxes[1][key])).toBeLessThan(1.1);
 await page.screenshot({path:info.outputPath('landed-before-fade.png')});
 await page.evaluate(()=>{(window as any).__fade.finish();});
 await expect(page.locator('.capture-printing')).toHaveCount(0);
 await expect(page.locator('.capture-review')).not.toHaveAttribute('inert','');
 await expect(page.locator('.recognition-halo')).toBeVisible();
});
test('closing during the tilted flight removes both the hidden destination and printing overlay',async({page})=>{
 await page.addInitScript(()=>{const original=Element.prototype.animate;Element.prototype.animate=function(frames,options){const a=original.call(this,frames,options);if(this.classList.contains('print-paper')&&typeof options==='object'&&options.duration===720){(window as any).__flight=a;a.pause();}return a;};});
 await page.goto('/piclex-web/#/capture');await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(photo);
 await expect.poll(()=>page.evaluate(()=>!!(window as any).__flight),{timeout:15000}).toBe(true);
 await page.locator('.print-close').click();await expect(page.locator('.capture-printing,.capture-review')).toHaveCount(0);await expect(page.getByRole('button',{name:'打开相机',exact:true})).toBeVisible();
});
