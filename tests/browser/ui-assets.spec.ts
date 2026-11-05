import {test,expect} from '@playwright/test';

test('necessary icons warm in background and are reused on navigation',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/piclex-web/#/capture');
 await page.waitForFunction(()=>new Set(performance.getEntriesByType('resource').filter(e=>e.name.includes('/icons/')).map(e=>e.name)).size===25);
 const count=()=>page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/icons/')).length);
 // Allow final image decoding and first-paint mask reuse to settle.
 let previous=-1,stable=0;
 await expect.poll(async()=>{const current=await count();stable=current===previous?stable+1:0;previous=current;return stable;},{intervals:[100],timeout:5000}).toBeGreaterThanOrEqual(3);
 const before=await count();
 const nav=page.getByRole('navigation',{name:'底部导航'});
 await nav.getByRole('button',{name:'设置',exact:true}).click();
 await page.getByRole('button',{name:'外观与主题',exact:true}).click();
 await page.getByLabel('外观模式',{exact:true}).selectOption('dark');
 await nav.getByRole('button',{name:'学习',exact:true}).click();
 await expect(nav.getByRole('button',{name:'学习',exact:true})).toHaveAttribute('aria-current','page');
 expect(await count()).toBe(before);expect(errors).toEqual([]);
});
