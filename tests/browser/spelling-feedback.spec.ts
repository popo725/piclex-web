import {test,expect} from '@playwright/test';
import path from 'node:path';
async function open(page:any){
 await page.goto('/piclex-web/#/decks',{waitUntil:'domcontentloaded'});
 await page.getByLabel('选择照片卡组文件').setInputFiles(path.resolve('tests/fixtures/demo/decks/cafe.piclexdeck'));
 await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toBeVisible();
 await page.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak:(u:any)=>{(window as any).__feedbackSpeech=u;},cancel:()=>{},getVoices:()=>[]}}));
}
test('hardware input survives replay focus, protected IME keys, and keeps dialogs isolated',async({page})=>{
 await open(page);const field=page.getByRole('textbox',{name:'输入英文',exact:true});
 await field.press('c');await expect(field).toHaveValue('c');
 await page.locator('.playback-button').click();await page.keyboard.press('r');await expect(field).toHaveValue('cr');
 await page.locator('.playback-button').click();await page.locator('.playback-button').dispatchEvent('keydown',{key:'Process',code:'KeyO',keyCode:229,bubbles:true,cancelable:true});await expect(field).toHaveValue('cro');await field.press('Backspace');
 await field.dispatchEvent('keydown',{key:'Process',code:'KeyO',keyCode:229,bubbles:true,cancelable:true});await expect(field).toHaveValue('cro');
 await field.dispatchEvent('keydown',{key:'你',code:'',keyCode:229,bubbles:true,cancelable:true});await expect(field).toHaveValue('cro');
 await page.getByRole('button',{name:'隐藏中文提示',exact:true}).click();await page.keyboard.press('Backspace');await expect(field).toHaveValue('cr');
 await page.keyboard.press('o');await expect(field).toHaveValue('cro');
 await page.getByRole('button',{name:'当前卡组，学习设置',exact:true}).click();await page.keyboard.press('i');await expect(field).toHaveValue('cro');
 await page.getByRole('button',{name:'关闭',exact:true}).click();await page.keyboard.press('i');await expect(field).toHaveValue('croi');
 await page.getByRole('button',{name:'退格',exact:true}).click();await expect(field).toHaveValue('cro');
});
for(const colorScheme of ['light','dark'] as const)test(`spelling progress stays below glyphs and unknown playback remains a moving segment: ${colorScheme}`,async({page},info)=>{
 await page.emulateMedia({colorScheme});await open(page);const field=page.getByRole('textbox',{name:'输入英文',exact:true});
 await field.pressSequentially('croissa');
 // ResizeObserver updates the SVG viewBox after layout; typing can finish first.
 // Wait for the rendered result while keeping the exact geometry assertions.
 await expect(async()=>{
  const geometry=await page.evaluate(()=>{
   const glyphs=[...document.querySelectorAll('.letter-glyph')].map(e=>e.getBoundingClientRect());
   return [...document.querySelectorAll<SVGPathElement>('.spelling-glow path')].map(p=>({top:p.getBoundingClientRect().top,glyphBottom:Math.max(...glyphs.map(r=>r.bottom)),filter:getComputedStyle(p).filter}));
  });
  expect(geometry).toHaveLength(2);
  for(const g of geometry){expect(g.top).toBeGreaterThanOrEqual(g.glyphBottom);expect(g.filter).toBe('none');}
 }).toPass({timeout:5000});
 await page.locator('.playback-button').click();await page.evaluate(()=>(window as any).__feedbackSpeech.onstart());
 const bar=page.getByRole('progressbar',{name:'播放进度'});await expect(bar).toHaveAttribute('aria-valuetext','正在播放');expect(await bar.getAttribute('aria-valuenow')).toBeNull();
 const segment=page.locator('.playback-activity');expect((await segment.boundingBox())!.width).toBeLessThan((await bar.boundingBox())!.width*.35);
 const first=await segment.evaluate(e=>getComputedStyle(e).transform);await expect.poll(()=>segment.evaluate(e=>getComputedStyle(e).transform)).not.toBe(first);
 await page.screenshot({path:info.outputPath(`feedback-${colorScheme}.png`)});
 await page.evaluate(()=>(window as any).__feedbackSpeech.onboundary({charIndex:10}));await expect(bar).toHaveAttribute('aria-valuenow',/^[1-9]\d?$/);await expect(segment).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.playback-button').click();await page.evaluate(()=>(window as any).__feedbackSpeech.onstart());await expect(segment).toHaveCSS('animation-name','none');
});
