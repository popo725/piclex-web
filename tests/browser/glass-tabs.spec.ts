import {test,expect} from '@playwright/test';

test('floating glass tabs preserve native order, selection, scrub cancellation and keyboard activation',async({page},info)=>{
 await page.setViewportSize({width:393,height:852});await page.goto('/piclex-web/#/capture');
 const nav=page.getByRole('navigation',{name:'底部导航'}),glass=nav.locator('.app-tabs-glass'),lens=nav.locator('.app-tab-lens');
 const capture=nav.getByRole('button',{name:'拍摄',exact:true}),settings=nav.getByRole('button',{name:'设置',exact:true});
 await expect(nav.getByRole('button')).toHaveText(['拍摄','学习','设置']);await expect(capture).toHaveAttribute('aria-current','page');
 const material=await glass.evaluate(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {blur:s.backdropFilter||s.getPropertyValue('-webkit-backdrop-filter'),radius:parseFloat(s.borderRadius),x:r.x,right:r.right,bottom:r.bottom,height:r.height};});
 expect(material.blur).toContain('blur');expect(material.radius).toBeGreaterThan(30);expect(material.x).toBeGreaterThan(0);expect(material.right).toBeLessThan(393);expect(material.bottom).toBeLessThan(852);expect(material.height).toBeGreaterThanOrEqual(54);
 await page.screenshot({path:info.outputPath('glass-capture-light.png')});
 const start=(await capture.boundingBox())!,end=(await settings.boundingBox())!;
 await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();await page.mouse.move(end.x+end.width/2,end.y+end.height/2,{steps:10});await page.mouse.up();
 await expect(settings).toHaveAttribute('aria-current','page');await expect(page).toHaveURL(/#\/settings$/);
 await expect.poll(async()=>Math.abs((await lens.boundingBox())!.x-(await settings.boundingBox())!.x)).toBeLessThan(1);
 // Release outside the group cancels the scrub and does not swallow keyboard activation.
 await page.mouse.move(end.x+end.width/2,end.y+end.height/2);await page.mouse.down();await page.mouse.move(start.x+start.width/2,start.y+start.height/2,{steps:8});await page.mouse.move(start.x+start.width/2,start.y-100);await page.mouse.up();
 await expect(settings).toHaveAttribute('aria-current','page');await capture.focus();await page.keyboard.press('Enter');await expect(capture).toHaveAttribute('aria-current','page');
 await settings.click();await page.getByRole('button',{name:'外观与主题',exact:true}).click();await page.getByLabel('外观模式',{exact:true}).selectOption('dark');await capture.click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.screenshot({path:info.outputPath('glass-capture-dark.png')});
 await page.emulateMedia({reducedMotion:'reduce'});expect(await lens.evaluate(n=>getComputedStyle(n).transitionDuration)).toBe('0s');
 for(const size of [{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);await expect.poll(()=>page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-vwidth')))).toBe(size.width);const r=(await nav.boundingBox())!;expect(r.x).toBeGreaterThan(0);expect(r.x+r.width).toBeLessThan(size.width);expect(r.y+r.height).toBeLessThan(size.height);expect(await nav.getByRole('button').evaluateAll(buttons=>buttons.every(b=>{const r=b.getBoundingClientRect();return r.height>=44&&b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}))).toBe(true);
 }
});
