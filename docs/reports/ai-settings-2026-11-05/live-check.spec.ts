import {test,expect} from '@playwright/test';
import path from 'node:path';
test('production official quota responds without mocks',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const pending=page.waitForResponse(r=>r.url()==='https://piclex.v2fy.com/v1/web/quota',{timeout:45000});
 await page.goto('/piclex-web/#/settings/ai');const response=await pending;expect(response.ok()).toBe(true);const body=await response.json();expect(body.quota.remaining).toBeGreaterThanOrEqual(0);await expect(page.getByText(`${body.quota.remaining} / ${body.quota.daily_limit}`,{exact:true})).toBeVisible();expect(errors).toEqual([]);
 await page.screenshot({path:test.info().outputPath('official-live.png'),fullPage:true});
});
test('production official recognition saves a public fixture photo',async({page},info)=>{
 test.skip(info.project.name!=='desktop','One real request is sufficient');test.setTimeout(120000);
 await page.addInitScript(()=>localStorage.setItem('piclex-web.import-animation','false'));
 await page.goto('/piclex-web/#/capture');await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();
 const pending=page.waitForResponse(r=>r.url()==='https://piclex.v2fy.com/v1/web/analyze',{timeout:75000});
 await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(path.resolve('tests/fixtures/demo/images/cafe.jpg'));
 const response=await pending;const data=await response.json();expect(response.status(),JSON.stringify(data.error||{})).toBe(200);expect(data.labels.length).toBeGreaterThan(0);
 await expect(page.locator('.capture-photo-label').first()).toBeVisible({timeout:15000});
 const cancel=page.getByRole('button',{name:/秒后进入拼写，点击取消/});await expect(cancel).toBeVisible({timeout:15000});await cancel.click();await expect(page.getByRole('button',{name:'开练',exact:true})).toBeVisible();
 await page.screenshot({path:test.info().outputPath('official-recognition-live.png'),fullPage:true});
 await expect.poll(()=>page.evaluate(()=>new Promise<number>((resolve,reject)=>{const r=indexedDB.open('piclex-web-v1');r.onsuccess=()=>{const db=r.result,t=db.transaction('decks','readonly'),q=t.objectStore('decks').count();t.oncomplete=()=>{resolve(q.result);db.close();};};r.onerror=reject;}))).toBeGreaterThan(0);
});
