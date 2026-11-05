import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {fillSpelling} from './helpers/spelling';
const catalog=JSON.parse(fs.readFileSync('apps/public/public/library/catalog.json','utf8')),card=catalog[0],deck=JSON.parse(fs.readFileSync('apps/public/public/'+card.payload,'utf8'));
const parameters=(url:string)=>new URLSearchParams(url.split('?').at(-1));
async function photoHash(page:Page){await expect(page.locator('.photo-browse img')).toBeVisible();return page.locator('.photo-browse img').evaluate(async(image)=>{const data=await (await fetch((image as HTMLImageElement).src)).arrayBuffer();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(n=>n.toString(16).padStart(2,'0')).join('');});}
test('share restores module, photo and sentence in a fresh browser without sender progress',async({page,browser})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{(window as any).__shared=text;}}}));
 await page.goto('/piclex-web/#/deck/'+card.id);const input=page.getByRole('textbox',{name:'输入英文',exact:true});await expect(input).toBeVisible();
 const draft=deck.words[0].english.slice(0,1);await fillSpelling(page,draft);const spellingURL=page.url();const history=await page.evaluate(()=>window.history.length);
 await page.getByRole('tab',{name:'练听力',exact:true}).click();await page.getByLabel('句子练习模式').selectOption('listening');
 await page.getByRole('button',{name:'选择照片',exact:true}).click();await page.getByRole('button',{name:'照片 2',exact:true}).click();
 await expect.poll(()=>parameters(page.url()).get('photo')).toBe('2');await page.getByRole('button',{name:'下一句',exact:true}).click();
 const shared=page.url(),text=await page.locator('.listening-sentence').innerText(),photo=await photoHash(page);
 expect(parameters(shared).get('module')).toBe('listening');expect(parameters(shared).get('mode')).toBe('listening');expect(parameters(shared).get('word')).toBeTruthy();expect(await page.evaluate(()=>window.history.length)).toBe(history);
 await page.getByRole('button',{name:'选择照片',exact:true}).click();await page.getByRole('button',{name:'分享卡组',exact:true}).click();expect(await page.evaluate(()=>(window as any).__shared)).toBe(shared);await page.getByRole('button',{name:'关闭',exact:true}).click();
 const clean=await browser.newContext();try{const receiver=await clean.newPage();await receiver.goto(shared);await expect(receiver.getByRole('tab',{name:'练听力',exact:true})).toHaveAttribute('aria-selected','true');await expect(receiver.locator('.listening-sentence')).toHaveText(text);expect(await photoHash(receiver)).toBe(photo);await expect(receiver.getByRole('button',{name:'播放',exact:true})).toBeVisible();await receiver.goto(spellingURL);await expect(receiver.getByRole('textbox',{name:'输入英文',exact:true})).toHaveValue('');}finally{await clean.close();}
 await page.reload();await expect(page.locator('.listening-sentence')).toHaveText(text);await page.getByRole('button',{name:'设置',exact:true}).click();await page.goBack();await expect(page.locator('.listening-sentence')).toHaveText(text);
 await page.goto(spellingURL);await expect(input).toHaveValue(draft);
});
test('same-deck links and refresh restore dictation difficulty, legacy links still open, invalid locations recover',async({page})=>{
 await page.goto('/piclex-web/#/deck/'+card.id+'?module=listening&mode=free&difficulty=easy&photo=2');
 await expect(page.getByLabel('听写难度')).toHaveValue('easy');await expect.poll(()=>parameters(page.url()).get('photo')).toBe('2');
 await page.getByLabel('听写难度').selectOption('medium');await expect.poll(()=>parameters(page.url()).get('difficulty')).toBe('medium');await page.reload();await expect(page.getByLabel('听写难度')).toHaveValue('medium');
 await page.evaluate(id=>{location.hash=`/deck/${id}?module=speaking&photo=3`;},card.id);await expect(page.getByRole('tab',{name:'练口语',exact:true})).toHaveAttribute('aria-selected','true');await expect.poll(()=>parameters(page.url()).get('photo')).toBe('3');
 await page.goto('/piclex-web/#/deck/'+card.id);await expect(page.locator('.native-header')).toBeVisible();await expect.poll(()=>parameters(page.url()).get('photo')).toBe('3');
 await page.goto('/piclex-web/#/deck/'+card.id+'?module=invalid&photo=99999999&word=missing&sentence=-1');await expect(page.locator('.native-header')).toBeVisible();await expect.poll(()=>parameters(page.url()).get('photo')).toBe('3');
});
