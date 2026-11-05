import {test,expect} from '@playwright/test';
import path from 'node:path';
// Compare alpha ramps at a fixed physical pixel density across CI browsers.
test.use({deviceScaleFactor:2});
const photo=path.resolve('tests/fixtures/demo/images/cafe.jpg');
test.beforeEach(async({page})=>{
 await page.route('https://piclex.v2fy.com/v1/web/analyze',()=>{});
});
test('diffuse colour is baked into every layer even with CSS filters disabled',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('piclex-web.import-animation','false'));
 await page.goto('/piclex-web/#/capture');
 await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();
 await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(photo);
 await expect(page.locator('.recognition-halo')).toBeVisible();
 await page.addStyleTag({content:'.recognition-halo canvas{filter:none!important;-webkit-filter:none!important}'});
 await expect.poll(()=>page.locator('.recognition-halo canvas').evaluateAll((nodes:HTMLCanvasElement[])=>nodes.length===5&&nodes.every(n=>n.width>10&&Number.isFinite(parseFloat(n.style.width))&&Number.isFinite(parseFloat(n.style.top))))).toBe(true);
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

const entranceLabels=[
 {english:'cup',chinese:'杯子',example:'',exampleChinese:'',relation:'visible',bbox:[100,200,400,600],anchor:[150,250],suggestedBubblePosition:{x:700,y:170}},
 {english:'table',chinese:'桌子',example:'',exampleChinese:'',relation:'visible',bbox:[400,500,900,900],anchor:[600,700],suggestedBubblePosition:{x:200,y:700}},
 {english:'coffee',chinese:'咖啡',example:'',exampleChinese:'',relation:'associated'},
];
async function recordEntrance(page:any){
 await page.evaluate(()=>{
  const samples:any[]=[];(window as any).__labelFrames=samples;
  const sample=()=>{
   const nodes=[...document.querySelectorAll<HTMLElement>('.capture-annotation')];
   if(nodes.length)samples.push({time:performance.now(),printing:!!document.querySelector('.capture-printing'),opacity:nodes.map(n=>Number(getComputedStyle(n).opacity)),transforms:nodes.map(n=>getComputedStyle(n.querySelector('button')!).transform),countdown:!!document.querySelector('.capture-countdown')});
   if(samples.length<1500)requestAnimationFrame(sample);
  };requestAnimationFrame(sample);
 });
}
function checkEntrance(frames:any[]){
 expect(frames.length).toBeGreaterThan(8);
 const mid=frames.find(f=>f.opacity[0]>.45&&f.opacity[0]<.8);
 expect(mid,'must capture the actual staggered reveal, not only the final DOM').toBeTruthy();
 expect(mid.opacity[0]-mid.opacity[1]).toBeCloseTo(.22,2);
 expect(mid.opacity[1]-mid.opacity[2]).toBeCloseTo(.22,2);
 const regressions=frames.flatMap((frame,index)=>frame.opacity.map((p:number,i:number)=>({index,label:i,p,previous:index?frames[index-1].opacity[i]:0})).filter((v:any)=>v.p<v.previous-.001));
 expect(regressions,'no frame may flash then hide a label').toEqual([]);
 expect(frames.filter(frame=>frame.countdown&&frame.opacity.some((p:number)=>p!==1)),'countdown must wait for every label').toEqual([]);
 expect(frames.at(-1).opacity).toEqual([1,1,1]);
}
test('early recognition keeps every label hidden through landing and reveals once in native order',async({page},info)=>{
 await page.route('https://piclex.v2fy.com/v1/web/analyze',route=>route.fulfill({json:{labels:entranceLabels,quote:null}}));
 await page.addInitScript(()=>{
  const original=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){const a=original.call(this,frames,options);if(this.classList.contains('capture-printing')&&typeof options==='object'&&options.duration===160){(window as any).__fade=a;a.pause();}else a.playbackRate=20;return a;};
 });
 await page.goto('/piclex-web/#/capture');await recordEntrance(page);
 await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(photo);
 await expect.poll(()=>page.evaluate(()=>!!(window as any).__fade),{timeout:15000}).toBe(true);
 await expect(page.locator('.capture-review')).toHaveCSS('visibility','visible');
 await expect(page.locator('.capture-annotation')).toHaveCount(3);
 for(const node of await page.locator('.capture-annotation').all())await expect(node).toHaveCSS('opacity','0');
 await expect(page.getByRole('button',{name:/秒后进入拼写/})).toHaveCount(0);
 await page.screenshot({path:info.outputPath('landed-labels-still-hidden.png')});
 await page.evaluate(()=>{(window as any).__fade.finish();});
 await expect(page.getByRole('button',{name:/秒后进入拼写/})).toBeVisible();
 await page.getByRole('button',{name:/秒后进入拼写/}).click();
 const frames=await page.evaluate(()=>(window as any).__labelFrames);checkEntrance(frames);
 expect(frames.filter((f:any)=>f.printing).every((f:any)=>f.opacity.every((p:number)=>p===0))).toBe(true);
 await info.attach('entrance-frames',{body:JSON.stringify(frames),contentType:'application/json'});
 const tabs=page.getByRole('navigation',{name:'底部导航'});
 await tabs.getByRole('button',{name:'设置',exact:true}).click();await tabs.getByRole('button',{name:'拍摄',exact:true}).click();
 await page.waitForTimeout(300);
 checkEntrance(await page.evaluate(()=>(window as any).__labelFrames));
 await expect(page.getByRole('button',{name:/秒后进入拼写/})).toHaveCount(0);
});
for(const reduced of [false,true])test(`late recognition preserves stagger and connector travel (reduced motion ${reduced})`,async({page},info)=>{
 let finish!:()=>void;const pending=new Promise<void>(resolve=>finish=resolve);
 await page.route('https://piclex.v2fy.com/v1/web/analyze',async route=>{await pending;await route.fulfill({json:{labels:entranceLabels,quote:null}});});
 await page.addInitScript(()=>localStorage.setItem('piclex-web.import-animation','false'));
 await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
 await page.goto('/piclex-web/#/capture');await recordEntrance(page);
 await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(photo);
 await expect(page.locator('.recognition-halo')).toBeVisible();finish();
 await expect(page.getByRole('button',{name:/秒后进入拼写/})).toBeVisible();await page.getByRole('button',{name:/秒后进入拼写/}).click();
 const frames=await page.evaluate(()=>(window as any).__labelFrames);checkEntrance(frames);
 const mid=frames.find((f:any)=>f.opacity[0]>.45&&f.opacity[0]<.8),last=frames.at(-1);
 expect(mid.transforms[2]).toBe(last.transforms[2]); // Associations fade in place.
 if(reduced)expect(mid.transforms).toEqual(last.transforms);
 else expect(mid.transforms[0]).not.toBe(last.transforms[0]);
 await info.attach('entrance-frames',{body:JSON.stringify(frames),contentType:'application/json'});
 await page.getByRole('button',{name:'cup 杯子',exact:true}).click();await expect(page.locator('.capture-object-box')).toBeVisible();
});
