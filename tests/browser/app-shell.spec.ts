import {fillSpelling} from './helpers/spelling';
import {test,expect} from '@playwright/test';
import path from 'node:path';
const fixture=path.resolve('tests/fixtures/demo/decks/cafe.piclexdeck');
async function importCafe(page:any){await page.goto('/piclex-web/#/decks');await expect(page.getByRole('button',{name:'导入自己的卡组'})).toBeEnabled();await page.getByLabel('选择照片卡组文件').setInputFiles(fixture);await expect(page.getByRole('heading',{name:'牛角包',exact:true})).toBeVisible();}
test('three App tabs keep the current deck and draft; earned experience survives reload without duplication',async({page})=>{
 await page.goto('/piclex-web/');const tabs=page.getByRole('navigation',{name:'底部导航'});await expect(tabs.getByRole('button')).toHaveText(['拍摄','学习','设置']);await expect(page.getByRole('main',{name:'拍摄',exact:true})).toBeVisible();
 await importCafe(page);const input=page.getByRole('textbox',{name:'输入英文'});await fillSpelling(page,'cro');await tabs.getByRole('button',{name:'设置',exact:true}).click();await tabs.getByRole('button',{name:'学习',exact:true}).click();await expect(input).toHaveValue('cro');await fillSpelling(page,'croissant');await expect(page.getByRole('heading',{name:'勺子',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'等级 LV0，1 经验',exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:'等级 LV0，1 经验',exact:true})).toBeVisible();await tabs.getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('button',{name:/我的等级/}).click();await expect(page.getByText('共 1 经验', {exact:false})).toBeVisible();
});
test('capture creates a real local deck and retains an unsaved photo when changing tabs',async({page})=>{
 await page.route('https://piclex.v2fy.com/v1/web/analyze',route=>route.fulfill({status:503,headers:{'Access-Control-Allow-Origin':'*'},json:{error:{message:'识图暂时不可用'}}}));
 await page.goto('/piclex-web/');await page.getByLabel('导入照片制卡',{exact:true}).setInputFiles(path.resolve('tests/fixtures/demo/images/cafe.jpg'));
 await expect(page.getByAltText('拍摄后的照片卡片')).toBeVisible();await page.getByRole('button',{name:'手动填写',exact:true}).click();await page.getByLabel('卡组名称',{exact:true}).fill('浏览器制卡回归');await page.getByLabel('英文',{exact:true}).fill('cup');await page.getByLabel('中文释义',{exact:true}).fill('杯子');
 const tabs=page.getByRole('navigation',{name:'底部导航'});await tabs.getByRole('button',{name:'设置',exact:true}).click();await tabs.getByRole('button',{name:'拍摄',exact:true}).click();await expect(page.getByLabel('英文',{exact:true})).toHaveValue('cup');await expect(page.getByAltText('拍摄后的照片卡片')).toBeVisible();await page.getByRole('button',{name:'保存修改',exact:true}).click();await page.getByRole('button',{name:'开练',exact:true}).click();await expect(page.getByRole('heading',{name:'杯子',exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'杯子',exact:true})).toBeVisible();
});
test('new correct letters render particles, restored answers do not, and reduced motion suppresses them',async({page})=>{
 await importCafe(page);const input=page.getByRole('textbox',{name:'输入英文'});await fillSpelling(page,'c');await expect(page.locator('.experience-particles')).toBeAttached();await expect(page.locator('.letter-glyph').first()).toHaveText('c');await page.reload();await expect(input).toHaveValue('c');await expect(page.locator('.experience-particles')).toHaveCount(0);await page.emulateMedia({reducedMotion:'reduce'});await fillSpelling(page,'cr');await expect(page.locator('.experience-particles')).toHaveCount(0);
});
test('two tabs award a completed word only once and keep low-level rewards locked',async({page,context})=>{
 await importCafe(page);const second=await context.newPage();await second.goto(page.url());await expect(second.getByRole('textbox',{name:'输入英文'})).toBeVisible();await Promise.all([fillSpelling(page,'croissant'),fillSpelling(second,'croissant')]);for(const p of [page,second])await expect(p.getByRole('button',{name:'等级 LV0，1 经验',exact:true})).toBeVisible();await page.getByRole('button',{name:'当前卡组，学习设置'}).click();await expect(page.getByRole('switch',{name:'快拼',exact:true})).toBeDisabled();await expect(page.getByRole('switch',{name:'经典键盘声音',exact:true})).toBeDisabled();await second.close();
});
test('the native game loads local assets, pauses, saves before changing tabs, and resumes',async({page},info)=>{
 await page.setViewportSize({width:844,height:390});const bad:string[]=[];page.on('pageerror',e=>bad.push(e.message));const failed:string[]=[];page.on('response',r=>{if(r.url().includes('/lab/assets/')&&r.status()>=400)failed.push(r.url());});
 await page.goto('/piclex-web/#/settings');await page.getByRole('button',{name:/薯薯求生/}).click();const game=page.frameLocator('iframe');await game.getByRole('button',{name:'开始冒险',exact:true}).click();await game.getByRole('button',{name:'暂停',exact:true}).click();await expect(game.getByRole('heading',{name:'已暂停',exact:true})).toBeVisible();await page.screenshot({path:`test-results/game-paused-${info.project.name}.png`});
 await page.getByRole('navigation',{name:'底部导航'}).getByRole('button',{name:'学习',exact:true}).click();await expect(page.locator('iframe')).toHaveCount(0);await page.getByRole('navigation',{name:'底部导航'}).getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('button',{name:/薯薯求生/}).click();await expect(game.getByRole('button',{name:/继续冒险 · 第 1 波/})).toBeVisible();expect(failed).toEqual([]);expect(bad).toEqual([]);
});

test('one App shell adapts at 320, 390, 768 and 1440px without hiding navigation or controls',async({page},info)=>{
 test.setTimeout(60000);
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:width===320?568:900});
  await page.goto('/piclex-web/#/settings');
  const tabs=page.getByRole('navigation',{name:'底部导航'});await expect(tabs.getByRole('button')).toHaveText(['拍摄','学习','设置']);await expect(page.locator('.app-footer')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'在 App Store 下载摄影学英语',exact:true})).toHaveAttribute('href','https://apps.apple.com/app/id6808490052');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const sections=page.locator('.settings-section');const a=await sections.nth(0).boundingBox(),b=await sections.nth(1).boundingBox();if(width>=960)expect(b!.x-a!.x).toBeGreaterThan(100);else expect(Math.abs(b!.x-a!.x)).toBeLessThan(1);
  await tabs.getByRole('button',{name:'拍摄',exact:true}).click();await expect(page.getByRole('button',{name:'拍摄照片',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/piclex-web/#/decks');await expect(page.locator('.deck-card')).toHaveCount(6);expect(await page.evaluate(()=>getComputedStyle(document.querySelector('.deck-grid')!).gridTemplateColumns.split(' ').length)).toBe(width<=600?1:width<960?2:3);
  await page.getByRole('button',{name:'开始练习',exact:true}).click();await expect(page.getByRole('textbox',{name:'输入英文'})).toBeVisible();
  await page.getByRole('button',{name:/^不认识/}).scrollIntoViewIfNeeded();
  const action=await page.getByRole('button',{name:/^不认识/}).boundingBox(),bar=await tabs.boundingBox();expect(action!.y+action!.height).toBeLessThanOrEqual(bar!.y);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'当前卡组，学习设置'}).click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();const rect=await dialog.boundingBox();expect(rect!.x).toBeGreaterThanOrEqual(0);expect(rect!.x+rect!.width).toBeLessThanOrEqual(width);await page.getByRole('button',{name:'关闭',exact:true}).click();
  if(info.project.name==='desktop')await page.screenshot({path:`test-results/responsive-learning-${width}.png`});
 }
});

test('spelling keyboard mirrors hardware keys on desktop and suppresses the OS keyboard on touch devices',async({page},info)=>{
 await importCafe(page);const input=page.getByRole('textbox',{name:'输入英文'}),keyboard=page.getByRole('region',{name:'虚拟键盘'});
 if(info.project.name==='mobile'){await expect(keyboard).toBeVisible();await expect(input).toHaveAttribute('readonly','');await expect(input).toHaveAttribute('inputmode','none');await expect(input).toBeFocused();}
 await expect(keyboard).toBeVisible();await expect(keyboard.getByRole('button')).toHaveCount(26);await expect(keyboard.locator('.virtual-key-row')).toHaveCount(3);await expect(keyboard.getByRole('button',{name:/^按键 [A-Z]$/})).toHaveCount(26);await expect(page.locator('.site-header')).toBeHidden();await expect(page.locator('.practice-player-avatar img')).toBeVisible();
 await input.press('c');await expect(input).toHaveValue('c');await keyboard.getByRole('button',{name:'按键 R',exact:true}).click();await expect(input).toHaveValue('cr');await page.locator('.native-answer').getByRole('button',{name:'退格',exact:true}).click();await expect(input).toHaveValue('c');await expect(input).toBeFocused();
 await page.keyboard.down('r');await expect(keyboard.locator('[data-key="r"]')).toHaveAttribute('data-pressed','true');await page.keyboard.up('r');await expect(keyboard.locator('[data-key="r"]')).toHaveAttribute('data-pressed','false');await expect(input).toHaveValue('cr');
 await keyboard.getByRole('button',{name:'按键 X',exact:true}).click();await expect(input).toHaveValue('crx');await keyboard.getByRole('button',{name:'按键 O',exact:true}).click();await expect(input).toHaveValue('crx');await page.locator('.native-answer').getByRole('button',{name:'退格',exact:true}).click();await keyboard.getByRole('button',{name:'按键 O',exact:true}).click();await expect(input).toHaveValue('cro');
 await page.getByRole('tab',{name:'练听力',exact:true}).click();await expect(keyboard).toHaveCount(0);if(info.project.name==='mobile')return;await page.getByLabel('句子练习模式').selectOption('free');await page.getByLabel('听写难度').selectOption('easy');await expect(keyboard).toBeVisible();const guided=page.getByRole('textbox',{name:/第 1 个单词/});await guided.focus();await keyboard.getByRole('button',{name:'按键 I',exact:true}).click();await expect(guided).not.toHaveValue('');
 await page.getByRole('navigation',{name:'底部导航'}).getByRole('button',{name:'设置',exact:true}).click();await expect(keyboard).toHaveCount(0);
});


test('dictation keyboard follows App modes, focuses all difficulty inputs and preserves drafts',async({page},info)=>{
 await importCafe(page);const keyboard=page.getByRole('region',{name:'虚拟键盘'});
 await page.getByRole('tab',{name:'练听力',exact:true}).click();await expect(keyboard).toHaveCount(0);
 const mode=page.getByLabel('句子练习模式');await mode.selectOption('free');
 const sentence=page.getByRole('textbox',{name:'听写句子',exact:true});await expect(sentence).toBeFocused();
 if(info.project.name==='desktop'){
  await expect(keyboard).toBeVisible();await keyboard.getByRole('button',{name:'按键 I',exact:true}).click();await expect(sentence).toHaveValue('i');
  await page.keyboard.down('a');await expect(keyboard.locator('[data-key="a"]')).toHaveAttribute('data-pressed','true');await page.keyboard.up('a');
  await keyboard.getByRole('button',{name:'退格',exact:true}).click();await expect(sentence).toHaveValue('i');
 }else{await expect(keyboard).toHaveCount(0);await sentence.fill('i');}
 await page.getByLabel('听写难度').selectOption('easy');
 const first=page.getByRole('textbox',{name:/第 1 个单词/}),second=page.getByRole('textbox',{name:/第 2 个单词/});
 await expect(second).toBeFocused();await expect(first).toHaveValue('i');
 if(info.project.name==='desktop'){await keyboard.getByRole('button',{name:'退格',exact:true}).click();await expect(first).toBeFocused();}
 await page.getByLabel('听写难度').selectOption('medium');await expect(first).toHaveValue('i');
 await page.getByLabel('听写难度').selectOption('hard');await expect(sentence).toBeFocused();await expect(sentence).toHaveValue('i');
 await page.getByRole('button',{name:'当前卡组，学习设置'}).click();await page.getByRole('button',{name:'关闭',exact:true}).click();await expect(sentence).toBeFocused();
 await mode.selectOption('listening');await expect(keyboard).toHaveCount(0);
 await page.getByRole('tab',{name:'练口语',exact:true}).click();await expect(keyboard).toHaveCount(0);
 await page.getByRole('tab',{name:'拼单词',exact:true}).click();await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toBeFocused();
});

test('dictation keeps its keyboard after assistance and Enter continues without losing focus',async({page},info)=>{
 await importCafe(page);await page.getByRole('tab',{name:'练听力',exact:true}).click();await page.getByLabel('句子练习模式').selectOption('free');
 const keyboard=page.getByRole('region',{name:'虚拟键盘'}),sentence=page.getByRole('textbox',{name:'听写句子',exact:true});
 await page.getByRole('button',{name:'听不懂',exact:true}).click();await expect(sentence).toHaveAttribute('readonly','');
 const answer=await sentence.inputValue();
 if(info.project.name==='desktop'){
  await expect(keyboard).toBeVisible();await keyboard.getByRole('button',{name:'按键 X',exact:true}).click();await expect(sentence).toHaveValue(answer);
  await page.screenshot({path:'test-results/dictation-keyboard-desktop.png'});
  await keyboard.getByRole('button',{name:'回车',exact:true}).click();
 }else{await expect(keyboard).toHaveCount(0);await sentence.press('Enter');}
 await expect(sentence).not.toHaveAttribute('readonly','');await expect(sentence).toHaveValue('');await expect(sentence).toBeFocused();
 await page.getByLabel('听写难度').selectOption('easy');const fields=page.getByRole('textbox',{name:/第 \d+ 个单词/});
 await fields.last().fill('wrong');await fields.last().press('Enter');await expect(page.getByRole('status').filter({hasText:'再听一次'})).toBeVisible();
});
