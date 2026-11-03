import { test, expect } from '@playwright/test';
import path from 'node:path';
const words=['croissant','spoon','fork','plate','lemon','table'];
test('a visitor can complete a scene, resume after refresh, and restart without a phone',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const phoneRequests:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))phoneRequests.push(r.url())});
 await page.goto('/');await expect(page.getByRole('heading',{name:'今天，想走进哪个场景？'})).toBeVisible();
 await page.screenshot({path:`test-results/home-${testInfo.project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'开始一分钟练习'}).click();
 await expect(page.getByRole('heading',{name:'牛角包',exact:true})).toBeVisible();
 const input=page.getByRole('textbox',{name:'输入英文'});
 await input.fill('crx');await expect(page.getByRole('status')).toContainText('退格');await input.fill('cr');
 await page.reload();await expect(input).toHaveValue('cr');
 await page.screenshot({path:`test-results/practice-${testInfo.project.name}.png`,fullPage:true});
 for(const [i,word] of words.entries()){
   await input.fill(word);await expect(page.getByRole('status')).toContainText('拼对了');
   await page.getByRole('button',{name:i===5?'完成这一组':'下一词',exact:true}).click();
 }
 await expect(page.getByRole('heading',{name:'又记住了一点生活。'})).toBeVisible();
 await expect(page.getByText('完成 6 个词，5 个一次拼对，1 个经过复习。')).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:'又记住了一点生活。'})).toBeVisible();
 await page.getByRole('button',{name:'再练一遍'}).click();await expect(input).toHaveValue('');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(phoneRequests).toEqual([]);expect(errors).toEqual([]);
});
test('local archives survive refresh; duplicate and invalid imports preserve previous progress',async({page})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'导入自己的卡组'})).toBeEnabled();
 const chooser=page.getByLabel('选择照片卡组文件');
 await chooser.setInputFiles(path.resolve('apps/public/public/decks/travel.piclexdeck'));
 await expect(page.getByRole('heading',{name:'护照',exact:true})).toBeVisible();
 await page.getByRole('textbox',{name:'输入英文'}).fill('pass');await page.reload();
 await expect(page.getByRole('textbox',{name:'输入英文'})).toHaveValue('pass');
 await page.getByRole('button',{name:'全部卡组'}).click();
 await chooser.setInputFiles({name:'bad.piclexdeck',mimeType:'application/zip',buffer:Buffer.from('bad')});
 await expect(page.getByRole('status')).toContainText('损坏');
 await chooser.setInputFiles(path.resolve('apps/public/public/decks/travel.piclexdeck'));
 await expect(page.getByRole('textbox',{name:'输入英文'})).toHaveValue('pass');
 await page.getByRole('button',{name:'全部卡组'}).click();
 await expect(page.locator('.deck-card')).toHaveCount(4);
});
test('direct links, reveal, dark theme and unknown decks have usable states',async({page})=>{
 await page.goto('/#/deck/home');await expect(page.getByRole('heading',{name:'台灯',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'切换深色外观'}).click();await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.getByRole('button',{name:'看答案'}).click();await expect(page.getByRole('textbox',{name:'输入英文'})).toHaveValue('lamp');
 await page.getByRole('button',{name:'下一词',exact:true}).click();await expect(page.getByRole('heading',{name:'植物',exact:true})).toBeVisible();
 await page.goto('/#/deck/missing');await expect(page.getByRole('heading',{name:'暂时无法打开'})).toBeVisible();
 await page.getByRole('button',{name:'返回全部卡组'}).click();await expect(page.getByRole('heading',{name:'今天，想走进哪个场景？'})).toBeVisible();
});
