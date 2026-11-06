import {test,expect,type Page} from '@playwright/test';
import path from 'node:path';
const labels=['key','keyboard','space bar','command key','trackpad','productivity','typing'].map((english,i)=>({english,chinese:['按键','键盘','空格键','命令键','触控板','生产力；效率','打字'][i],example:'This is a keyboard.',exampleChinese:'这是一个键盘。',relation:i<5?'visible':'scene_extension',bbox:[10,10,990,990],anchor:[100+i*110,100+i*100]}));
async function open(page:Page){
 await page.clock.install();await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{localStorage.setItem('piclex-web.import-animation','false');document.documentElement.style.setProperty('text-size-adjust','160%');document.documentElement.style.setProperty('-webkit-text-size-adjust','160%');});
 await page.route('https://piclex.v2fy.com/v1/web/analyze',route=>route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},json:{labels,quota:{daily_limit:10,used:1,remaining:9}}}));
 await page.goto('/piclex-web/#/capture');await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(path.resolve('tests/fixtures/covers/portrait.jpg'));await expect(page.locator('.capture-annotation')).toHaveCount(labels.length);await page.clock.runFor(2500);
 await expect(page.getByRole('button',{name:/秒后进入拼写，点击取消/})).toBeVisible({timeout:15000});await page.getByRole('button',{name:/秒后进入拼写，点击取消/}).click();await page.clock.resume();
}
async function fit(page:Page){
 await expect.poll(()=>page.evaluate(()=>{
  const nav=document.querySelector('.app-tabs')!.getBoundingClientRect(),tools=document.querySelector('.capture-vocabulary summary')!.getBoundingClientRect(),actions=document.querySelector('.capture-review-actions')!.getBoundingClientRect();
  const brand=document.querySelector('.capture-poster-brand>span')!,lines=[];
  for(const node of brand.childNodes){if(node.nodeType!==Node.TEXT_NODE)continue;const range=document.createRange();range.selectNode(node);lines.push(...[...range.getClientRects()].map(r=>Math.round(r.top)));}
  const labels=[...document.querySelectorAll('.capture-photo-label')].map(node=>{const b=node.getBoundingClientRect(),text=[...node.children].map(n=>n.getBoundingClientRect());const pad=[text[0].left-b.left,b.right-Math.max(...text.map(t=>t.right)),text[0].top-b.top,b.bottom-text.at(-1)!.bottom];return Math.max(...pad)-Math.min(...pad)<.8&&Math.min(...pad)>0;});
  const v=visualViewport!;return {twoLines:new Set(lines).size===2,toolsAboveNav:tools.bottom+8<=nav.top,actionsAboveNav:actions.bottom+8<=nav.top,navVisible:nav.bottom<=v.offsetTop+v.height,uniformPadding:labels.every(Boolean)};
 })).toEqual({twoLines:true,toolsAboveNav:true,actionsAboveNav:true,navVisible:true,uniformPadding:true});
}
test('portrait review keeps two brand lines, equal label padding and tools clear of navigation with enlarged browser text',async({page},info)=>{
 await page.setViewportSize({width:393,height:740});await open(page);await fit(page);
 for(const size of [{width:320,height:568},{width:430,height:780},{width:393,height:668}]){await page.setViewportSize(size);await fit(page);}
 await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:520});Object.defineProperty(visualViewport,'offsetTop',{configurable:true,value:90});visualViewport!.dispatchEvent(new Event('scroll'));});await fit(page);
 await page.evaluate(()=>{delete (visualViewport as any).height;delete (visualViewport as any).offsetTop;visualViewport!.dispatchEvent(new Event('resize'));});await fit(page);
 await page.screenshot({path:info.outputPath('capture-portrait-mobile.png')});
 const summary=page.locator('.capture-vocabulary summary');await summary.click();
 await page.locator('.capture-vocabulary button').last().click();const detail=page.locator('.capture-label-detail');await detail.scrollIntoViewIfNeeded();await expect(detail).toBeVisible();const nav=await page.locator('.app-tabs').boundingBox(),box=await detail.boundingBox();expect(box!.y+box!.height).toBeLessThan(nav!.y);
 await page.getByRole('button',{name:'编辑卡片',exact:true}).click();const save=page.getByRole('button',{name:'保存修改',exact:true});await save.scrollIntoViewIfNeeded();const saveBox=await save.boundingBox();expect(saveBox!.y+saveBox!.height).toBeLessThan(nav!.y);await save.click();await expect(page.getByRole('button',{name:'开练',exact:true})).toBeVisible();await page.setViewportSize({width:844,height:390});
 // Viewport variables and the photo budget update in animation frames after resize.
 // Re-scroll after those updates, then compare both boxes in the same layout.
 await expect.poll(async()=>{
  await summary.scrollIntoViewIfNeeded();
  return page.evaluate(()=>document.querySelector('.capture-vocabulary summary')!.getBoundingClientRect().bottom-document.querySelector('.app-tabs')!.getBoundingClientRect().top);
 }).toBeLessThan(0);
});
