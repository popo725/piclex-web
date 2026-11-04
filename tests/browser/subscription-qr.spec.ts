import {test,expect} from '@playwright/test';
test('plain URL QR generator accepts third-party domains without a network request',async({page})=>{
 let contacted=false;await page.route('https://author.example/**',route=>{contacted=true;return route.abort();});
 await page.goto('/piclex-web/subscribe/');
 await page.getByLabel('订阅清单地址').fill('https://author.example/english/feed.json?a=1&b=2');
 await page.getByRole('button',{name:'生成二维码',exact:true}).click();
 await expect(page.locator('#qr')).toHaveAttribute('src',/^data:image\/png;base64,/);
 await expect(page.locator('#source-display')).toHaveText('https://author.example/english/feed.json?a=1&b=2');
 expect(contacted).toBe(false);await expect(page.locator('a[href^="piclex:"]')).toHaveCount(0);
 await page.getByRole('button',{name:'新概念英语第二册',exact:true}).click();
 await expect(page.locator('#source-display')).toHaveText('https://piclex.v2fy.com/public/subscriptions/nce2/feed.json');
 await page.getByRole('button',{name:'经典英语歌曲',exact:true}).click();
 await expect(page.locator('#source-display')).toHaveText('https://piclex.v2fy.com/public/subscriptions/classic-english-songs/feed.json');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('unsafe URL does not produce a downloadable QR',async({page})=>{
 await page.goto('/piclex-web/subscribe/');await page.getByLabel('订阅清单地址').fill('http://author.example/feed.json');
 await page.getByRole('button',{name:'生成二维码',exact:true}).click();await expect(page.getByRole('alert')).toContainText('HTTPS');await expect(page.locator('#result')).toBeHidden();
});
