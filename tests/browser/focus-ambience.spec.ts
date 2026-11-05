import {test,expect} from '@playwright/test';
import path from 'node:path';
async function open(page:any){
 await page.goto('/piclex-web/#/decks');
 await page.getByLabel('选择照片卡组文件').setInputFiles(path.resolve('tests/fixtures/demo/decks/cafe.piclexdeck'));
 await expect(page.locator('.focus-box')).toBeVisible();
}
test('default cafe is controllable in spelling; choice survives modules and reload, pauses on exit',async({page},info)=>{
 await page.addInitScript(()=>{const Original=window.Audio,w=window as any;w.__ambience=[];w.Audio=class extends Original{constructor(src?:string){super(src);this.muted=true;if(src?.includes('/ambience/'))w.__ambience.push(this);}};});
 await open(page);
 const press=(locator:any)=>info.project.use.hasTouch?locator.tap():locator.click();
 const menu=page.locator('.sentence-ambience');await expect(menu.locator('summary')).toHaveAttribute('aria-label','背景声：咖啡厅');
 await press(menu.locator('summary'));
 await expect.poll(()=>page.evaluate(()=>{const a=(window as any).__ambience.at(-1);return a&&!a.paused&&a.currentTime>0&&a.loop&&a.src.endsWith('/cafe.m4a');})).toBe(true);
 expect(await page.evaluate(()=>(window as any).__ambience.at(-1).volume)).toBeCloseTo(.14);
 await press(menu.getByRole('button',{name:'轻柔钢琴'}));
 await expect.poll(()=>page.evaluate(()=>{const a=(window as any).__ambience.at(-1);return a&&!a.paused&&a.currentTime>0&&a.src.endsWith('/piano.m4a');})).toBe(true);
 await press(page.getByRole('tab',{name:'练听力',exact:true}));await expect(menu.locator('summary')).toHaveAttribute('aria-label','背景声：轻柔钢琴');
 await page.reload();await expect(menu.locator('summary')).toHaveAttribute('aria-label','背景声：轻柔钢琴');
 await press(menu.locator('summary'));await menu.getByLabel('背景声音量').selectOption('0.45');
 await expect.poll(()=>page.evaluate(()=>(window as any).__ambience.at(-1)?.volume)).toBeCloseTo(.225);
 await press(menu.getByRole('button',{name:'关闭',exact:true}));await expect.poll(()=>page.evaluate(()=>(window as any).__ambience.every((a:HTMLAudioElement)=>a.paused))).toBe(true);
 await press(menu.locator('summary'));await press(menu.getByRole('button',{name:'咖啡厅'}));
 await expect.poll(()=>page.evaluate(()=>(window as any).__ambience.at(-1)?.paused)).toBe(false);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 await expect.poll(()=>page.evaluate(()=>(window as any).__ambience.every((a:HTMLAudioElement)=>a.paused))).toBe(true);
 await page.screenshot({path:info.outputPath('ambience.png')});
});
test('gradient stays on the ring surface through resize, pause and reduced motion',async({page},info)=>{
 await open(page);
 const ring=page.locator('.focus-box');await expect(ring.locator('span')).toHaveCount(0);
 for(const [width,height] of [[180,130],[30,30],[160,40],[40,160]]){
  await ring.evaluate((el,[width,height])=>{Object.assign((el as HTMLElement).style,{width:width+'px',height:height+'px',left:'180px',top:'110px'});},[width,height]);
  expect(await ring.evaluate(el=>getComputedStyle(el,'::after').backgroundImage)).toContain('conic-gradient');
  expect(await ring.evaluate(el=>getComputedStyle(el,'::after').transform)).toBe('none');
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await ring.evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('none');
 await page.screenshot({path:info.outputPath('ring.png')});
});
