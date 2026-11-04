import {test,expect} from '@playwright/test';
for(const orientation of ['landscape','portrait'])test(`camera saves the visible crop for a ${orientation} source and plays the native shutter once`,async({page},info)=>{
 await page.addInitScript(({orientation})=>{
  const w=window as any;w.__sounds=[];w.__playing=[];const AudioClass=window.Audio;
  w.Audio=function(src?:string){const a=new AudioClass(src);a.muted=true;const play=a.play.bind(a);a.play=()=>{w.__sounds.push(a.src);return play();};a.addEventListener('playing',()=>w.__playing.push(a.src));return a;};
  w.__cameraMock=async()=>{
   const c=document.createElement('canvas');c.width=orientation==='landscape'?1280:480;c.height=orientation==='landscape'?720:960;
   const g=c.getContext('2d')!;g.fillStyle='#ff0000';g.fillRect(0,0,c.width,c.height);
   const width=Math.min(c.width,c.height*.75),height=width/.75,x=(c.width-width)/2,y=(c.height-height)/2;
   g.fillStyle='#00ff00';g.fillRect(x,y,width,height);g.fillStyle='#0000ff';g.fillRect(x+width*.4,y+height*.4,width*.2,height*.2);
   const stream=c.captureStream(30);w.__testStream=stream;const draw=()=>{g.fillStyle='#0000ff';g.fillRect(x+width*.4,y+height*.4,width*.2,height*.2);if(stream.getTracks()[0].readyState==='live')requestAnimationFrame(draw);};requestAnimationFrame(draw);return stream;
  };
  const blob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback,...rest){blob.call(this,value=>(window as any).__finishPhoto=()=>callback(value),...rest);};
 },{orientation});
 await page.route('https://piclex.v2fy.com/v1/web/analyze',route=>route.fulfill({status:429,headers:{'Access-Control-Allow-Origin':'*'},json:{error:{message:'测试保留照片'}}}));
 await page.goto('/piclex-web/#/capture');await page.evaluate(()=>{Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:(window as any).__cameraMock}});});await page.getByRole('button',{name:'打开相机',exact:true}).click();await expect(page.getByRole('button',{name:'拍下这张照片'})).toBeEnabled();
 expect(await page.evaluate(()=>(window as any).__sounds.length)).toBe(0);
 await page.getByRole('button',{name:'拍下这张照片'}).click();await expect(page.locator('.capture-printing')).toBeVisible();
 await expect.poll(()=>page.locator('.print-slot-front').evaluate(n=>n.getBoundingClientRect().width)).toBeGreaterThan(150);
 await expect(page.locator('.print-paper img')).toHaveCount(0);
 const slot=await page.locator('.print-slot-front').evaluate(n=>({height:n.getBoundingClientRect().height,border:getComputedStyle(n).boxShadow,radius:getComputedStyle(n).borderRadius}));expect(slot.height).toBe(40);expect(slot.border).toContain("1.6px");expect(parseFloat(slot.radius)).toBeGreaterThan(100);
 await page.screenshot({path:info.outputPath(`island-open-${orientation}.png`)});
 await page.evaluate(()=>(window as any).__finishPhoto());await expect(page.locator('.print-paper img')).toHaveCount(1);await expect.poll(()=>page.evaluate(()=>(window as any).__playing.filter((s:string)=>s.endsWith('minolta-shutter.wav')).length)).toBe(1);
 await page.waitForTimeout(1100);await page.screenshot({path:info.outputPath(`paper-feed-${orientation}.png`)});
 const result=await page.locator('.print-paper img').evaluate((img:HTMLImageElement)=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const g=c.getContext('2d')!;g.drawImage(img,0,0);return {width:c.width,height:c.height,pixels:[[.05,.05],[.95,.05],[.05,.95],[.95,.95],[.5,.5]].map(([x,y])=>Array.from(g.getImageData(c.width*x,c.height*y,1,1).data).slice(0,3))};});
 expect(result.width/result.height).toBeCloseTo(.75,2);for(const p of result.pixels.slice(0,4)){expect(p[0]).toBeLessThan(10);expect(p[1]).toBeGreaterThan(240);}expect(result.pixels[4][2]).toBeGreaterThan(240);
 await expect(page.locator('.capture-printing')).toHaveCount(0,{timeout:12000});const saved=await page.getByAltText('拍摄后的照片卡片').evaluate((img:HTMLImageElement)=>[img.naturalWidth,img.naturalHeight]);expect(saved).toEqual([result.width,result.height]);
 expect(await page.evaluate(()=>(window as any).__testStream.getTracks()[0].readyState)).toBe('ended');expect(await page.evaluate(()=>(window as any).__sounds.filter((s:string)=>s.endsWith('minolta-shutter.wav')).length)).toBe(1);
});
