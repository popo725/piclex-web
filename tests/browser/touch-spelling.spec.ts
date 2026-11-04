import {test,expect} from '@playwright/test';
import path from 'node:path';

test('touch spelling keeps the OS keyboard disabled through taps, next word and navigation',async({page},info)=>{
 test.skip(info.project.name!=='mobile','Touch input contract');
 await page.goto('/piclex-web/#/decks');await expect(page.getByRole('button',{name:'导入自己的卡组'})).toBeEnabled();
 await page.getByLabel('选择照片卡组文件').setInputFiles(path.resolve('tests/fixtures/demo/decks/cafe.piclexdeck'));
 const input=page.getByRole('textbox',{name:'输入英文',exact:true}),keyboard=page.getByRole('region',{name:'虚拟键盘'});
 const protectedInput=async()=>{await expect(input).toHaveAttribute('readonly','');await expect(input).toHaveAttribute('inputmode','none');await expect(keyboard).toBeVisible();await expect(keyboard.getByRole('button')).toHaveCount(26);await expect(keyboard.locator('.virtual-key-row')).toHaveCount(3);};
 await protectedInput();const viewport=await page.evaluate(()=>visualViewport!.height);
 await input.tap();await protectedInput();
 await keyboard.getByRole('button',{name:'按键 C',exact:true}).tap();await expect(input).toHaveValue('c');
 await keyboard.getByRole('button',{name:'按键 R',exact:true}).tap();await expect(input).toHaveValue('cr');
 await page.locator('.native-answer').getByRole('button',{name:'退格',exact:true}).tap();await expect(input).toHaveValue('c');
 const tabs=page.getByRole('navigation',{name:'底部导航'});await tabs.getByRole('button',{name:'设置',exact:true}).tap();await tabs.getByRole('button',{name:'学习',exact:true}).tap();await protectedInput();await expect(input).toHaveValue('c');
 await page.getByRole('button',{name:'当前卡组，学习设置',exact:true}).tap();await page.getByRole('button',{name:'关闭',exact:true}).tap();await protectedInput();
 for(const letter of 'roissant')await keyboard.getByRole('button',{name:`按键 ${letter.toUpperCase()}`,exact:true}).tap();
 await expect(page.getByRole('heading',{name:'勺子',exact:true})).toBeVisible();await protectedInput();await expect(input).toHaveValue('');
 expect(await page.evaluate(()=>visualViewport!.height)).toBe(viewport);
 const k=(await keyboard.boundingBox())!,bar=(await tabs.boundingBox())!;expect(k.y+k.height).toBeLessThanOrEqual(bar.y+1);
 expect(await page.locator('.native-practice').evaluate(n=>n.scrollHeight-n.clientHeight)).toBeLessThanOrEqual(1);
 await page.screenshot({path:info.outputPath('touch-spelling-keyboard.png')});
 await page.reload();await protectedInput();await expect(page.getByRole('heading',{name:'勺子',exact:true})).toBeVisible();
 // The protected field must still reject an attached hardware IME key.
 await input.dispatchEvent('keydown',{key:'你'});await expect(page.getByText('请切换到英语输入法',{exact:true})).toBeVisible();await expect(input).toHaveValue('');
});
