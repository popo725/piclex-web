import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const card=JSON.parse(fs.readFileSync('apps/public/public/library/catalog.json','utf8'))[0];
test('native camera paper and practice metrics keep complete content at wide, narrow and short sizes',async({page},info)=>{
 test.setTimeout(90000);
 for(const size of [{width:1440,height:1000},{width:390,height:844},{width:1280,height:720},{width:320,height:568}]){
  await page.setViewportSize(size);await page.goto('/piclex-web/#/capture');
  await expect(page.locator('.site-header')).toBeHidden();
  const aperture=(await page.locator('.camera-aperture').boundingBox())!,paper=(await page.locator('.camera-paper').boundingBox())!;
  expect(aperture.width/aperture.height).toBeCloseTo(.75,2);
  expect(Math.abs(aperture.x-paper.x-14.5)).toBeLessThanOrEqual(.51);expect(Math.abs(paper.y+paper.height-aperture.y-aperture.height-52.5)).toBeLessThanOrEqual(.51);
  await expect(page.getByText('首次使用会请求相机权限',{exact:true})).toHaveCount(0);await expect(page.getByText('点击开启相机',{exact:true})).toBeVisible();
  await page.goto('/piclex-web/#/deck/'+card.id);await page.getByRole('tab',{name:'拼单词',exact:true}).click();
  await expect(page.locator('.focus-image')).toBeVisible();
  const photo=(await page.locator('.photo-browse').boundingBox())!,hint=(await page.locator('.native-hint').boundingBox())!,example=(await page.locator('.native-example').boundingBox())!,answer=(await page.locator('.native-answer').boundingBox())!;
  expect(photo.height).toBeGreaterThanOrEqual(info.project.name==='mobile'?140:220);expect(photo.height).toBeLessThanOrEqual(330);
  expect(hint.height).toBe(48);expect(example.height).toBe(44);expect(answer.height).toBe(50);
  expect(hint.y).toBeGreaterThanOrEqual(photo.y+photo.height-.5);expect(example.y).toBeGreaterThanOrEqual(hint.y+hint.height-.5);const body=(await page.locator('.native-body').boundingBox())!;expect(answer.y).toBeGreaterThanOrEqual(body.y+body.height-.5);
  await page.locator('.native-example').scrollIntoViewIfNeeded();const visibleExample=(await page.locator('.native-example').boundingBox())!;expect(visibleExample.y+visibleExample.height).toBeLessThanOrEqual(answer.y+.5);
  await expect.poll(()=>page.locator('.native-practice').evaluate(e=>e.style.getPropertyValue('--photo-background'))).not.toBe('');
  await page.getByRole('button',{name:'不认识',exact:true}).scrollIntoViewIfNeeded();
  const action=(await page.getByRole('button',{name:'不认识',exact:true}).boundingBox())!,tabs=(await page.getByRole('navigation',{name:'底部导航'}).boundingBox())!;
  expect(action.y+action.height).toBeLessThanOrEqual(tabs.y+1);
  {
   const keyboard=page.getByRole('region',{name:'虚拟键盘'});await keyboard.scrollIntoViewIfNeeded();const k=(await keyboard.boundingBox())!;expect(k.y+k.height).toBeLessThanOrEqual(tabs.y+1);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
