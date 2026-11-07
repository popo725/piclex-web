import {expect,type Page} from '@playwright/test';
export async function evidenceScreenshot(page:Page,name:string){
 if(!process.env.PARITY_EVIDENCE)return;
 const notice=page.getByRole('button',{name:'关闭提示',exact:true});if(await page.getByRole('dialog').count())await expect(notice).toBeHidden({timeout:8000});else if(await notice.isVisible())await notice.click();
 // Evidence must show the loaded page, including photo and avatar assets.
 await expect(page.locator('.photo-loading:visible,.image-error:visible')).toHaveCount(0,{timeout:30000});
 await page.waitForFunction(()=>[...document.images].filter(img=>{const r=img.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth&&getComputedStyle(img).visibility!=='hidden';}).every(img=>img.complete&&img.naturalWidth>0),undefined,{timeout:30000});
 await page.evaluate(async()=>{
  await document.fonts.ready;
  const urls=[...new Set([...document.querySelectorAll('.native-icon')].filter(n=>n.getBoundingClientRect().width>0).flatMap(n=>[...getComputedStyle(n).maskImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1])))];
  await Promise.all(urls.map(src=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>img.decode().then(()=>resolve(),reject);img.onerror=()=>reject(Error('Evidence icon unavailable'));img.src=src;})));
 });
 // Preserve effects; capture only after the existing reward animation settles.
 await page.waitForTimeout(2400);
 await page.screenshot({path:process.env.PARITY_EVIDENCE+name,fullPage:!(await page.getByRole('dialog').count()),scale:'css'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
