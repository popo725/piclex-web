import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('apps/public/public/library/catalog.json','utf8')),card=catalog[0];
const deck=JSON.parse(fs.readFileSync('apps/public/public/'+card.payload,'utf8'));
const paths=deck.photos.map((p:{path:string})=>'/piclex-web/'+p.path);
const decoded=()=>Object.keys((window as any).__decoded||{}).length;
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{
  (window as any).__decoded={};(window as any).__revoked=[];
  const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=async function(){await decode.call(this);if(this.src.startsWith('blob:'))(window as any).__decoded[this.src]=true;};
  const revoke=URL.revokeObjectURL;URL.revokeObjectURL=function(url){(window as any).__revoked.push(url);revoke.call(URL,url);};
 });
});
test('preloads exactly five distinct upcoming photos and reuses them while advancing',async({page})=>{
 const requests:number[]=[];
 await page.route('**/library/**',async route=>{const i=paths.indexOf(new URL(route.request().url()).pathname);if(i>=0&&route.request().resourceType()==='fetch')requests.push(i);await route.continue();});
 await page.goto('/piclex-web/#/deck/'+card.id);
 await expect.poll(()=>page.evaluate(decoded)).toBe(6);
 expect([...requests].sort((a,b)=>a-b)).toEqual([0,1,2,3,4,5]);
 await page.evaluate(id=>{location.hash=`/deck/${id}?photo=2`;},card.id);
 await expect(page.locator('.focus-image')).toBeVisible();
 await expect.poll(()=>page.evaluate(decoded)).toBe(7);
 expect([...requests].sort((a,b)=>a-b)).toEqual([0,1,2,3,4,5,6]);
 // Route interception disables HTTP cache: a single request proves shared cache reuse.
 expect(requests.filter(i=>i===1)).toHaveLength(1);
 await page.goto('/piclex-web/#/settings');
 await expect.poll(()=>page.evaluate(()=>new Set((window as any).__revoked).size)).toBe(7);
});
test('tail stays bounded and failed speculation retries when selected',async({page})=>{
 let attempts=0;
 await page.route('**/'+deck.photos[1].path,async route=>{if(route.request().resourceType()==='fetch'&&++attempts===1)await route.abort();else await route.continue();});
 await page.goto('/piclex-web/#/deck/'+card.id);
 await expect.poll(()=>page.evaluate(decoded)).toBe(5);
 await expect(page.locator('.focus-image')).toBeVisible();
 await page.evaluate(id=>{location.hash=`/deck/${id}?photo=2`;},card.id);
 await expect.poll(()=>attempts).toBe(2);await expect(page.locator('.focus-image')).toBeVisible();
 await expect(page.getByText('图片加载失败，点击重试',{exact:true})).toHaveCount(0);
 const loaded:number[]=[];page.on('request',req=>{const i=paths.indexOf(new URL(req.url()).pathname);if(i>=0&&req.resourceType()==='fetch')loaded.push(i);});
 await page.evaluate(({id,count})=>{location.hash=`/deck/${id}?photo=${count-1}`;},{id:card.id,count:deck.photos.length});
 await expect.poll(()=>loaded.includes(deck.photos.length-1)).toBe(true);
 await expect(page.locator('.focus-image')).toBeVisible();
 expect(loaded.filter(i=>i>=deck.photos.length-2).sort((a,b)=>a-b)).toEqual([deck.photos.length-2,deck.photos.length-1]);
});
