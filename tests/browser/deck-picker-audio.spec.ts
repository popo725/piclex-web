import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {fillSpelling} from './helpers/spelling';
const catalog=JSON.parse(fs.readFileSync('apps/public/public/library/catalog.json','utf8'));
const song=catalog.find((c:any)=>c.id==='0a1ff2e2-3db0-4bb1-889a-b27b62798cbe'),payload=JSON.parse(fs.readFileSync('apps/public/public/'+song.payload,'utf8'));
test('learning settings switches public and personal decks directly and restores each draft',async({page},info)=>{
 await page.goto('/piclex-web/#/decks');await expect(page.getByRole('button',{name:'导入自己的卡组',exact:true})).toBeEnabled();await page.getByLabel('选择照片卡组文件').setInputFiles(path.resolve('tests/fixtures/demo/decks/cafe.piclexdeck'));
 await fillSpelling(page,'cr');const localID=decodeURIComponent(page.url().split('/deck/')[1]);
 await page.getByRole('button',{name:'当前卡组，学习设置',exact:true}).click();const picker=page.getByRole('combobox',{name:'切换卡组',exact:true});await expect(picker).toHaveValue(localID);await expect(picker.locator('option')).toHaveCount(7);await page.screenshot({path:info.outputPath('deck-picker.png')});
 await picker.selectOption(song.id);await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page).toHaveURL(new RegExp('/deck/'+song.id+'$'));await expect(page.getByRole('heading',{name:payload.words[0].chinese,exact:true})).toBeVisible();await expect(page.getByRole('region',{name:'虚拟键盘'}).getByRole('button')).toHaveCount(27);
 const prefix=payload.words[0].english.slice(0,1);await fillSpelling(page,prefix);
 await page.getByRole('button',{name:'当前卡组，学习设置',exact:true}).click();await picker.selectOption(localID);await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toHaveValue('cr');
 await page.getByRole('button',{name:'当前卡组，学习设置',exact:true}).click();await picker.selectOption(song.id);await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toHaveValue(prefix);await page.reload();await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toHaveValue(prefix);
});
test('song clips decode, respect rate, precede word TTS and stop on mode or deck changes',async({page})=>{
 await page.addInitScript(()=>{const w=window as any,OriginalAudio=window.Audio;w.__media=[];w.__played=[];w.__spoken=[];w.Audio=class extends OriginalAudio{constructor(src?:string){super(src);if(src?.endsWith('.mp3')&&src.includes('/library/'))w.__media.push(this);this.addEventListener('playing',()=>w.__played.push({src:this.currentSrc,rate:this.playbackRate}));}};window.speechSynthesis.speak=(utterance:any)=>{w.__spoken.push(utterance.text);queueMicrotask(()=>utterance.onend?.());};});
 await page.goto('/piclex-web/#/deck/'+song.id);await expect(page.getByRole('heading',{name:payload.words[0].chinese,exact:true})).toBeVisible();
 await page.getByLabel('播放速度',{exact:true}).selectOption('0.75');await expect.poll(()=>page.evaluate(()=>(window as any).__played.length)).toBeGreaterThan(0);
 const played=await page.evaluate(()=>(window as any).__played[0]);expect(played.src).toContain(payload.words[0].audio.sha256+'.mp3');expect(played.rate).toBe(.75);
 await expect(page.getByRole('progressbar',{name:'播放进度'})).toBeVisible();await expect(page.getByRole('button',{name:'停止播放'})).toHaveCount(0);await expect.poll(async()=>Number(await page.getByRole('progressbar',{name:'播放进度'}).getAttribute('aria-valuenow'))).toBeGreaterThan(0);
 await expect.poll(()=>page.evaluate(()=>(window as any).__spoken),{timeout:15000}).toEqual([payload.words[0].english]);
 await page.getByLabel('播放速度',{exact:true}).selectOption('1.15');await expect.poll(()=>page.evaluate(()=>(window as any).__played.at(-1)?.rate)).toBe(1.15);
 await page.getByRole('tab',{name:'练听力',exact:true}).click();expect(await page.evaluate(()=>(window as any).__media.every((a:HTMLAudioElement)=>a.paused&&!a.getAttribute('src')))).toBe(true);
 await page.getByLabel('句子练习模式',{exact:true}).selectOption('free');await page.getByRole('button',{name:'播放句子',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__played.length)).toBeGreaterThanOrEqual(3);
 await page.getByRole('button',{name:'当前卡组，学习设置',exact:true}).click();await page.getByRole('combobox',{name:'切换卡组',exact:true}).selectOption(catalog[0].id);await expect(page).toHaveURL(new RegExp('/deck/'+catalog[0].id+'$'));expect(await page.evaluate(()=>(window as any).__media.every((a:HTMLAudioElement)=>a.paused&&!a.getAttribute('src')))).toBe(true);
});

test('original listening audio seeks by time and resumes from its paused position',async({page})=>{
 await page.addInitScript(()=>{const w=window as any,Original=window.Audio;w.__listening=[];w.Audio=class extends Original{constructor(src?:string){super(src);this.muted=true;if(src?.endsWith('.mp3'))w.__listening.push(this);}};});
 await page.goto('/piclex-web/#/deck/'+song.id);await page.getByRole('tab',{name:'练听力',exact:true}).click();await page.getByLabel('句子练习模式',{exact:true}).selectOption('listening');await page.getByRole('button',{name:'播放',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__listening.at(-1)?.currentTime||0)).toBeGreaterThan(.1);
 await page.getByRole('button',{name:'暂停',exact:true}).click();const slider=page.getByRole('slider',{name:'句子播放位置'});await expect(slider).toHaveAttribute('max','1000');const paused=Number(await slider.inputValue());expect(paused).toBeGreaterThan(0);
 await slider.fill('500');await page.getByRole('button',{name:'播放',exact:true}).click();await expect.poll(()=>page.evaluate(()=>{const a=(window as any).__listening.at(-1);return a?.currentTime/a?.duration||0;})).toBeGreaterThanOrEqual(.5);
 await page.getByRole('button',{name:'暂停',exact:true}).click();const before=Number(await slider.inputValue());await page.getByRole('button',{name:'播放',exact:true}).click();await expect.poll(()=>page.evaluate(()=>{const a=(window as any).__listening.at(-1);return a?.currentTime/a?.duration||0;})).toBeGreaterThanOrEqual(before/1000-.01);
});
