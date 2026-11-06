import {observeAmbienceMix,ambienceGain} from './helpers/ambience';
import {test,expect,type Page} from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('apps/public/public/library/catalog.json','utf8'));
async function open(page:Page){
 await page.goto('/piclex-web/#/decks');await expect(page.getByRole('button',{name:'导入自己的卡组',exact:true})).toBeEnabled();
 await page.getByLabel('选择照片卡组文件').setInputFiles(path.resolve('tests/fixtures/demo/decks/cafe.piclexdeck'));
 await expect(page.getByRole('heading',{name:'牛角包',exact:true})).toBeVisible();await page.getByRole('button',{name:'关闭提示',exact:true}).click();
}
async function photoColors(page:Page,selector:string){
 await expect.poll(()=>page.locator('.native-practice').evaluate(e=>e.style.getPropertyValue('--photo-background'))).not.toBe('');
 const palette=await page.locator('.native-practice').evaluate(e=>({background:e.style.getPropertyValue('--photo-background'),ink:e.style.getPropertyValue('--photo-ink')}));
 const normalized=(value:string)=>`rgb(${value.match(/\d+/g)!.join(', ')})`;
 await expect(page.locator(selector)).toHaveCSS('background-color',normalized(palette.background));
 for(const node of await page.locator(`${selector}, ${selector} h1, ${selector} small, ${selector}>select`).all())await expect(node).toHaveCSS('color',normalized(palette.ink));
 const luminance=(value:string)=>value.match(/\d+/g)!.map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 const a=luminance(palette.background),b=luminance(palette.ink);expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThanOrEqual(4.5);
}
async function speech(page:Page){await page.evaluate(()=>{const w=window as any;w.__utterances=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak:(u:any)=>w.__utterances.push(u),cancel(){},getVoices:()=>[]}});});}
async function listen(page:Page){await page.getByRole('tab',{name:'练听力',exact:true}).click();await page.getByLabel('句子练习模式',{exact:true}).selectOption('listening');}
async function end(page:Page){await page.evaluate(()=>{const u=(window as any).__utterances.at(-1);u.onstart?.();u.onend?.();});}
async function geometry(page:Page){
 const buttons=page.locator('.listening-transport>button');const boxes=await buttons.evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom};}));
 expect(boxes).toHaveLength(3);expect(Math.max(...boxes.map(b=>b.w))-Math.min(...boxes.map(b=>b.w))).toBeLessThan(1);
 const nav=(await page.getByRole('navigation',{name:'底部导航'}).boundingBox())!;for(const b of boxes){expect(b.h).toBeGreaterThanOrEqual(44);expect(b.bottom).toBeLessThanOrEqual(nav.y+1);}
 const metadata=(await page.locator('.listening-metadata').boundingBox())!,seek=(await page.getByRole('slider',{name:'句子播放位置'}).boundingBox())!;
 expect(metadata.y+metadata.height).toBeLessThanOrEqual(boxes[0].y);expect(seek.y+seek.height).toBeLessThanOrEqual(metadata.y+1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
for(const theme of ['light','dark'])test(`native listening controls and speaking dock fit all viewports in ${theme}`,async({page},info)=>{
 test.setTimeout(90000);await page.emulateMedia({colorScheme:theme as 'light'|'dark'});await open(page);await photoColors(page,'.native-hint');await speech(page);
 await page.evaluate(()=>{(window as any).SpeechRecognition=class{start(){}abort(){}};});
 for(const [width,height] of [[390,844],[320,568],[844,390],[1440,1000]]){
  await page.setViewportSize({width,height});await listen(page);await geometry(page);
  await expect(page.getByText('每张照片只听一句',{exact:true})).toHaveCount(0);await expect(page.getByLabel('循环方式')).toHaveValue('once');
  const summary=page.locator('.sentence-ambience summary');await summary.scrollIntoViewIfNeeded();await summary.click();await expect(page.getByRole('button',{name:'咖啡厅',exact:true})).toBeVisible();await page.getByLabel('背景声音量').selectOption('0.15');await page.getByRole('button',{name:'轻柔钢琴',exact:true}).click();await summary.click();await page.getByRole('button',{name:'关闭',exact:true}).click();
  await photoColors(page,'.sentence-toolbar');if(theme==='light')await expect(page.locator('.listening-transport button').first()).not.toHaveCSS('box-shadow','none');
  await page.screenshot({path:info.outputPath(`listening-${theme}-${width}x${height}.png`)});
  await page.getByRole('tab',{name:'练口语',exact:true}).click();await expect(page.locator('.native-hint')).toHaveCount(0);
  const next=page.locator('.reading-next');await next.scrollIntoViewIfNeeded();const rect=(await next.boundingBox())!,nav=(await page.getByRole('navigation',{name:'底部导航'}).boundingBox())!;expect(rect.y+rect.height).toBeLessThanOrEqual(nav.y+1);
  await page.getByRole('button',{name:'开始跟读',exact:true}).click();await expect(page.locator('.reading-state')).toContainText('正在收音');await page.getByRole('button',{name:'听示范',exact:true}).click();await expect(page.locator('.reading-state')).toContainText('麦克风已关闭');
  await page.screenshot({path:info.outputPath(`speaking-${theme}-${width}x${height}.png`)});
 }
});
test('single-card preference lives in personalization, preserves choice on reload and filters both directions',async({page})=>{
 await open(page);await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('button',{name:'个性化设置',exact:true}).click();const single=page.getByRole('switch',{name:'单卡单句模式'});await expect(single).not.toBeChecked();await single.check();await page.reload();await expect(single).toBeChecked();
 await page.getByRole('button',{name:'学习',exact:true}).click();await speech(page);await listen(page);await expect(page.getByLabel('播放列表位置')).toHaveText('1/1');const sentence=await page.locator('.listening-sentence').innerText();
 await page.getByRole('button',{name:'下一句',exact:true}).click();await expect(page.locator('.listening-sentence')).toHaveText(sentence);await page.getByRole('button',{name:'上一句',exact:true}).click();await expect(page.getByLabel('播放列表位置')).toHaveText('1/1');
 await page.getByRole('button',{name:'当前卡组，学习设置',exact:true}).click();await expect(page.getByRole('switch')).toHaveCount(0);await expect(page.getByRole('group',{name:'切换卡组'})).toBeVisible();await page.getByRole('button',{name:'关闭',exact:true}).click();await page.getByRole('button',{name:'选择照片',exact:true}).click();await expect(page.locator('.native-photo-grid')).toBeVisible();
});
test('listening loops at end, retains position through a sheet and handles failures and fixed-rate repeat',async({page})=>{
 await open(page);await speech(page);await listen(page);await page.getByRole('button',{name:'上一句',exact:true}).click();const last=await page.getByLabel('播放列表位置').innerText();expect(last.split('/')[0]).toBe(last.split('/')[1]);
 await page.getByRole('button',{name:'播放',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__utterances.length)).toBe(1);await end(page);await expect(page.getByLabel('播放列表位置')).toHaveText(/^1\//);
 await expect.poll(()=>page.evaluate(()=>(window as any).__utterances.length)).toBe(2);await page.evaluate(()=>{const u=(window as any).__utterances.at(-1);u.onstart?.();u.onboundary?.({charIndex:10});});
 await page.getByRole('button',{name:'当前卡组，学习设置',exact:true}).click();await page.getByRole('button',{name:'关闭',exact:true}).click();await expect(page.getByRole('button',{name:'播放',exact:true})).toBeVisible();expect(Number(await page.getByRole('slider',{name:'句子播放位置'}).inputValue())).toBeGreaterThan(0);
 await page.getByLabel('循环方式').selectOption('fastThreeSlowTwo');await expect(page.getByLabel('播放速度',{exact:true})).toBeDisabled();await expect(page.getByLabel('播放速度',{exact:true})).toHaveValue('1');
 await page.getByRole('button',{name:'播放',exact:true}).click();await page.evaluate(()=>{(window as any).__utterances.at(-1).onerror?.({error:'network'});});await expect(page.getByRole('button',{name:'重新准备',exact:true})).toBeVisible();await page.getByRole('button',{name:'重新准备',exact:true}).click();await expect(page.getByRole('button',{name:'准备中…',exact:true})).toBeVisible();
});
test('native ambience loops, ducks during speech, persists and stops at panels, hidden page and module changes',async({page})=>{
 await observeAmbienceMix(page);
 await page.addInitScript(()=>{const w=window as any,Original=window.Audio;w.__ambiences=[];w.Audio=class extends Original{constructor(src?:string){super(src);if(src?.includes('/ambience/'))w.__ambiences.push(this);this.muted=true;}};});
 await open(page);await speech(page);await listen(page);await page.locator('.sentence-ambience summary').click();await page.getByRole('button',{name:'咖啡厅',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__ambiences.at(-1)?.paused)).toBe(false);expect(await page.evaluate(()=>(window as any).__ambiences.at(-1).loop)).toBe(true);
 await page.getByRole('button',{name:'播放',exact:true}).click();await page.evaluate(()=>{(window as any).__utterances.at(-1).onstart?.();});await expect.poll(()=>ambienceGain(page)).toBeCloseTo(.28*.22*.22,3);
 await page.getByRole('button',{name:'当前卡组，学习设置',exact:true}).click();expect(await page.evaluate(()=>(window as any).__ambiences.every((a:HTMLAudioElement)=>a.paused))).toBe(true);await page.getByRole('button',{name:'关闭',exact:true}).click();expect(await page.evaluate(()=>(window as any).__ambiences.every((a:HTMLAudioElement)=>a.paused))).toBe(true);
 await page.locator('.sentence-ambience summary').click();await page.getByRole('button',{name:'咖啡厅',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__ambiences.at(-1).paused)).toBe(false);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));expect(await page.evaluate(()=>(window as any).__ambiences.every((a:HTMLAudioElement)=>a.paused))).toBe(true);await page.getByRole('tab',{name:'练口语',exact:true}).click();expect(await page.evaluate(()=>(window as any).__ambiences.every((a:HTMLAudioElement)=>a.paused&&!a.getAttribute('src')))).toBe(true);
 await page.reload();await listen(page);await expect(page.locator('.sentence-ambience summary')).toHaveAttribute('aria-label','背景声：咖啡厅');
});
test('theme navigation and editor match native compact hierarchy and preserve separate day/night selections',async({page},info)=>{
 await page.goto('/piclex-web/#/settings/appearance');await page.getByLabel('外观模式',{exact:true}).selectOption('light');await page.getByRole('button',{name:/内置主题/}).click();await expect(page).toHaveURL(/settings\/themes$/);await expect(page.getByRole('dialog')).toHaveCount(0);
 for(const [width,height] of [[320,568],[390,844],[844,390],[1440,1000]]){
  await page.setViewportSize({width,height});const rows=page.locator('.theme-swatch');await expect(rows).toHaveCount(16);const a=(await rows.nth(0).boundingBox())!,b=(await rows.nth(1).boundingBox())!;expect(a.x).toBe(b.x);expect(b.y).toBeGreaterThanOrEqual(a.y+a.height);expect(a.height).toBeLessThanOrEqual(76);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Catppuccin',exact:true}).click();await page.screenshot({path:info.outputPath('themes-native-list.png')});await page.getByRole('button',{name:'返回外观与主题',exact:true}).click();
 await page.getByRole('button',{name:'创建自定义主题',exact:true}).click();await expect(page.locator('.theme-preview')).toHaveCount(0);await page.getByRole('textbox',{name:'主题名称'}).fill('浅色自定义');await page.getByRole('button',{name:'保存主题',exact:true}).click();await page.getByLabel('外观模式',{exact:true}).selectOption('dark');await expect(page.locator('html')).toHaveAttribute('data-palette','chatgpt');await page.getByLabel('外观模式',{exact:true}).selectOption('light');await expect(page.locator('.custom-theme-row button.settings-row')).toHaveAttribute('aria-pressed','true');
});
test('dragging a listening seek bar commits once instead of restarting on every movement',async({page})=>{
 await open(page);await speech(page);await listen(page);await page.getByRole('button',{name:'播放',exact:true}).click();await page.evaluate(()=>(window as any).__utterances.at(-1).onstart?.());
 const slider=page.getByRole('slider',{name:'句子播放位置'}),b=(await slider.boundingBox())!;
 await page.mouse.move(b.x+b.width*.2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width*.8,b.y+b.height/2,{steps:8});expect(await page.evaluate(()=>(window as any).__utterances.length)).toBe(1);await page.mouse.up();await expect.poll(()=>page.evaluate(()=>(window as any).__utterances.length)).toBe(2);
});
