import {test,expect,type Page,type Locator} from '@playwright/test';
import path from 'node:path';
async function press(locator:Locator,touch:boolean){if(touch)await locator.tap();else await locator.click();}
async function mockSpeech(page:Page){
 await page.evaluate(()=>{
  const w=window as any;w.__utterances=[];
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak:(utterance:any)=>{w.__utterances.push(utterance);},cancel:()=>{},getVoices:()=>[]}});
 });
}
async function emit(page:Page,event:string,index=-1,detail:any={}){
 await page.evaluate(({event,index,detail})=>{const u=(window as any).__utterances.at(index);if(!u)throw new Error('Expected a queued utterance');u['on'+event]?.(detail);},{event,index,detail});
}
async function open(page:Page){
 await page.goto('/piclex-web/#/decks');
 await expect(page.getByRole('button',{name:'导入自己的卡组',exact:true})).toBeEnabled();
 await page.getByLabel('选择照片卡组文件').setInputFiles(path.resolve('tests/fixtures/demo/decks/cafe.piclexdeck'));
 await expect(page.getByRole('heading',{name:'牛角包',exact:true})).toBeVisible();
}
test('App replay button keeps its geometry and fills in place across sentence, word, replay and rate change',async({page},info)=>{
 await open(page);await mockSpeech(page);const touch=!!info.project.use.hasTouch;
 const button=page.locator('.playback-button'),bar=page.getByRole('progressbar',{name:'播放进度'}),row=page.locator('.native-playback');
 await expect(button).toHaveText('播放句子和单词');const before=await row.boundingBox(),buttonBefore=await button.boundingBox();
 await press(button,touch);await expect(button).toHaveText('准备音频…');await expect(bar).toHaveCount(0);
 await emit(page,'start');await expect(button).toHaveText('重新播放');await expect(bar).toBeVisible();
 await expect(page.getByRole('button',{name:'停止播放'})).toHaveCount(0);await expect(row.getByRole('button')).toHaveCount(1);
 await emit(page,'boundary',-1,{charIndex:10});await expect.poll(async()=>Number(await bar.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
 expect(await row.boundingBox()).toEqual(before);expect(await button.boundingBox()).toEqual(buttonBefore);
 await press(page.getByRole('region',{name:'虚拟键盘'}).getByRole('button',{name:'按键 C',exact:true}),touch);
 await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toHaveValue('c');
 await page.screenshot({path:info.outputPath('playback-progress.png')});
 await press(button,touch);await expect(button).toHaveText('准备音频…');await emit(page,'boundary',0,{charIndex:40});await emit(page,'end',0);
 await expect.poll(()=>page.evaluate(()=>(window as any).__utterances.length)).toBe(2);await expect(bar).toHaveCount(0);
 await emit(page,'start');await emit(page,'boundary',-1,{charIndex:12});
 await page.getByLabel('播放速度',{exact:true}).selectOption('0.75');
 await expect.poll(()=>page.evaluate(()=>(window as any).__utterances.at(-1).rate)).toBe(.75);await expect(button).toHaveText('准备音频…');
 await emit(page,'start');await emit(page,'end');
 await expect.poll(()=>page.evaluate(()=>(window as any).__utterances.at(-1).text)).toBe('croissant');
 const halfway=Number(await bar.getAttribute('aria-valuenow'));expect(halfway).toBeGreaterThan(0);expect(halfway).toBeLessThan(100);
 await emit(page,'start');await emit(page,'boundary',-1,{charIndex:4});expect(Number(await bar.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(halfway);
 await emit(page,'end');await expect(button).toHaveText('播放句子和单词');await expect(bar).toHaveCount(0);
 await emit(page,'start');await emit(page,'end');await expect(button).toHaveText('播放句子和单词');
 await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toHaveValue('c');
});
test('errors, mode changes and leaving the page clear progress and reject old callbacks',async({page},info)=>{
 await open(page);await mockSpeech(page);const touch=!!info.project.use.hasTouch,button=page.locator('.playback-button');
 await press(button,touch);await emit(page,'start');await emit(page,'boundary',-1,{charIndex:8});await emit(page,'error',-1,{error:'network'});
 await expect(button).toHaveText('播放句子和单词');await expect(page.getByRole('progressbar',{name:'播放进度'})).toHaveCount(0);
 await emit(page,'start');await expect(button).toHaveText('播放句子和单词');
 await press(button,touch);await emit(page,'start');await press(page.getByRole('tab',{name:'练听力',exact:true}),touch);
 await expect(button).toHaveText('播放句子');await emit(page,'boundary',-1,{charIndex:20});await emit(page,'end');await expect(button).toHaveText('播放句子');
 await press(button,touch);await emit(page,'start');await emit(page,'boundary',-1,{charIndex:8});
 await expect(page.getByRole('progressbar',{name:'播放进度'})).toBeVisible();await expect(page.locator('.native-playback').getByRole('button')).toHaveCount(1);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await expect(button).toHaveText('播放句子');
 await emit(page,'start');await emit(page,'end');await expect(page.getByRole('progressbar',{name:'播放进度'})).toHaveCount(0);
});
test('speech without boundary events holds confirmed progress without a looping animation',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);await mockSpeech(page);
 const button=page.locator('.playback-button');await press(button,!!info.project.use.hasTouch);await emit(page,'start');
 const bar=page.getByRole('progressbar',{name:'播放进度'});await expect(bar).toHaveAttribute('aria-valuetext','正在播放');expect(await bar.getAttribute('aria-valuenow')).toBeNull();
 await expect(page.locator('.playback-activity')).toHaveCount(0);await expect(page.locator('.playback-fill')).toHaveCSS('transform','matrix(0, 0, 0, 1, 0, 0)');await expect(page.locator('.playback-fill')).toHaveCSS('transition-duration','0s');await emit(page,'end');
 await expect.poll(()=>page.evaluate(()=>(window as any).__utterances.at(-1).text)).toBe('croissant');const confirmed=await page.locator('.playback-fill').evaluate(e=>getComputedStyle(e).transform);await emit(page,'start');await expect(page.locator('.playback-fill')).toHaveCSS('transform',confirmed);await emit(page,'end');await expect(bar).toHaveCount(0);
});

test('original audio fills the button from its clock even without timeupdate and stops advancing while paused',async({page},info)=>{
 const fs=await import('node:fs');const catalog=JSON.parse(fs.readFileSync('apps/public/public/library/catalog.json','utf8'));const song=catalog.find((c:any)=>c.id==='0a1ff2e2-3db0-4bb1-889a-b27b62798cbe');
 await page.addInitScript(()=>{const w=window as any,Original=window.Audio;w.__clockAudio=[];w.Audio=class extends Original{constructor(src?:string){super(src);this.muted=true;if(src?.includes('/library/')&&src.endsWith('.mp3')){w.__clockAudio.push(this);Object.defineProperty(this,'ontimeupdate',{get:()=>null,set:()=>{}});}}};});
 await page.goto('/piclex-web/#/deck/'+song.id);const button=page.locator('.playback-button'),bar=page.getByRole('progressbar',{name:'播放进度'});await expect(button).toBeVisible();await page.getByLabel('播放速度',{exact:true}).selectOption('0.75');
 await expect.poll(async()=>Number(await bar.getAttribute('aria-valuenow'))).toBeGreaterThan(3);
 const geometry=await button.boundingBox();await expect(page.locator('.playback-fill')).toHaveCSS('opacity','0.28');await expect(page.locator('.playback-activity')).toHaveCount(0);
 await page.evaluate(()=>(window as any).__clockAudio.at(-1).pause());
 // Give the sampler one turn to observe the final media time, then require no drift.
 await page.waitForTimeout(70);const paused=await bar.getAttribute('aria-valuenow');await page.waitForTimeout(160);expect(await bar.getAttribute('aria-valuenow')).toBe(paused);
 await page.screenshot({path:info.outputPath('original-audio-progress.png')});
 await press(button,!!info.project.use.hasTouch);await expect.poll(()=>page.evaluate(()=>(window as any).__clockAudio.length)).toBe(2);await expect.poll(()=>page.evaluate(()=>(window as any).__clockAudio.at(-1).currentTime)).toBeGreaterThan(0);expect(await button.boundingBox()).toEqual(geometry);
 await page.getByRole('tab',{name:'练听力',exact:true}).click();await expect(bar).toHaveCount(0);expect(await page.evaluate(()=>(window as any).__clockAudio.every((a:HTMLAudioElement)=>a.paused))).toBe(true);
});
