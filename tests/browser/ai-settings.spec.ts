import {test,expect} from '@playwright/test';
import path from 'node:path';
const quota={daily_limit:10,used:1,remaining:9,resets_at:2000000000};
test.beforeEach(async({page})=>{await page.route('https://piclex.v2fy.com/v1/web/quota',r=>r.fulfill({json:{quota}}));await page.addInitScript(()=>localStorage.setItem('piclex-web.import-animation','false'));});
test('provider fields persist independently, key visibility resets, home label matches and narrow screens fit',async({page})=>{
 await page.goto('/piclex-web/#/settings/ai');await expect(page.getByText('9 / 10',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'自定义模型',exact:true}).click();await expect(page.getByLabel('Base URL',{exact:true})).toHaveValue('https://api.deepseek.com');await page.getByLabel('API Key',{exact:true}).fill('synthetic-deepseek');
 await page.getByRole('button',{name:'显示 API Key'}).click();await expect(page.getByLabel('API Key',{exact:true})).toHaveAttribute('type','text');
 await page.getByLabel('大模型厂商').selectOption('custom');await expect(page.getByLabel('API Key',{exact:true})).toHaveValue('');await expect(page.getByLabel('API Key',{exact:true})).toHaveAttribute('type','password');
 await page.getByLabel('Base URL',{exact:true}).fill('https://vision.example.test/v1');await page.getByLabel('模型名称',{exact:true}).fill('vision-test');await page.getByLabel('API Key',{exact:true}).fill('synthetic-custom');await page.reload();
 await expect(page.getByLabel('API Key',{exact:true})).toHaveValue('synthetic-custom');await page.getByLabel('大模型厂商').selectOption('deepSeek');await expect(page.getByLabel('API Key',{exact:true})).toHaveValue('synthetic-deepseek');
 await page.getByRole('button',{name:'返回设置',exact:true}).click();await expect(page.getByRole('button',{name:/AI配置 DeepSeek/})).toBeVisible();
 await page.goto('/piclex-web/#/settings/ai');await page.setViewportSize({width:320,height:568});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:test.info().outputPath('ai-settings.png'),fullPage:true});
 await page.getByRole('button',{name:'官方模型',exact:true}).click();await expect(page.getByText('9 / 10',{exact:true})).toBeVisible();await expect(page.getByLabel('API Key',{exact:true})).toHaveCount(0);
});
test('custom recognition uses configured provider, preserves bounding boxes and never falls back to official',async({page})=>{
 let official=0,custom=0;await page.route('https://piclex.v2fy.com/v1/web/analyze',r=>{official++;return r.abort();});
 await page.route('https://vision.example.test/v1/chat/completions',async r=>{custom++;expect(r.request().headers().authorization).toBe('Bearer synthetic-custom');const body=r.request().postDataJSON();expect(body.model).toBe('vision-test');expect(body.messages[1].content[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/);await r.fulfill({json:{choices:[{message:{content:JSON.stringify({labels:[{english:'cup',chinese:'杯子',example:'A cup is on the table.',exampleChinese:'桌上有一个杯子。',bbox:[.1,.2,.3,.4]}]})}}]}});});
 await page.goto('/piclex-web/#/settings/ai');await page.getByRole('button',{name:'自定义模型',exact:true}).click();await page.getByLabel('大模型厂商').selectOption('custom');await page.getByLabel('Base URL',{exact:true}).fill('https://vision.example.test/v1');await page.getByLabel('模型名称',{exact:true}).fill('vision-test');await page.getByLabel('API Key',{exact:true}).fill('synthetic-custom');
 await page.getByRole('button',{name:'拍摄',exact:true}).click();await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(path.resolve('tests/fixtures/demo/images/cafe.jpg'));
 await expect(page.locator('.capture-photo-label')).toHaveCount(1);await expect(page.locator('.capture-connector')).toHaveCount(1);expect(custom).toBe(1);expect(official).toBe(0);
});
test('invalid settings and provider errors keep the photo without official fallback or key disclosure',async({page})=>{
 let official=0;await page.route('https://piclex.v2fy.com/v1/web/analyze',r=>{official++;return r.abort();});
 await page.goto('/piclex-web/#/settings/ai');await page.getByRole('button',{name:'自定义模型',exact:true}).click();await page.getByRole('button',{name:'拍摄',exact:true}).click();await expect(page.getByRole('button',{name:'导入照片',exact:true})).toBeEnabled();await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(path.resolve('tests/fixtures/demo/images/cafe.jpg'));
 await expect(page.getByText(/请填写 API Key。 请前往设置/)).toBeVisible();expect(official).toBe(0);await expect(page.getByRole('button',{name:'重试识别'})).toBeVisible();
 await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('button',{name:/AI配置/}).click();await page.getByLabel('API Key',{exact:true}).fill('synthetic-private');
 await page.route('https://api.deepseek.com/chat/completions',r=>r.fulfill({status:401,json:{error:{message:'synthetic-private'}}}));await page.getByRole('button',{name:'拍摄',exact:true}).click();await page.getByRole('button',{name:'重试识别'}).click();await expect(page.getByText('模型授权失败，请检查 API Key 和账户权限。',{exact:true})).toBeVisible();await expect(page.getByText('synthetic-private',{exact:true})).toHaveCount(0);expect(official).toBe(0);
});
test('failed storage write leaves the last saved model selected',async({page})=>{
 await page.goto('/piclex-web/#/settings/ai');await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='piclex-web.ai-settings.v1')throw new DOMException('full','QuotaExceededError');return original.call(this,key,value);};});
 await page.getByRole('button',{name:'自定义模型',exact:true}).click();await expect(page.getByRole('alert')).toContainText('配置保存失败');await expect(page.getByRole('button',{name:'官方模型',exact:true})).toHaveAttribute('aria-pressed','true');
});
