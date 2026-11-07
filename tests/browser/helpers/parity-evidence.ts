import {expect,type Page} from '@playwright/test';
export async function evidenceScreenshot(page:Page,name:string){
 if(!process.env.PARITY_EVIDENCE)return;
 const notice=page.getByRole('button',{name:'关闭提示',exact:true});if(await page.getByRole('dialog').count())await expect(notice).toBeHidden({timeout:8000});else if(await notice.isVisible())await notice.click();
 // Preserve effects; capture only after the existing reward animation settles.
 await page.waitForTimeout(2400);
 await page.screenshot({path:process.env.PARITY_EVIDENCE+name,fullPage:!(await page.getByRole('dialog').count()),scale:'css'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
