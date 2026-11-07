import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
function phraseDeck(english='glass partition'){
 const files=unzipSync(readFileSync('tests/fixtures/demo/decks/cafe.piclexdeck'));
 const manifest=JSON.parse(strFromU8(files['manifest.json'])),entry=manifest.photos[0],photo=JSON.parse(strFromU8(files[entry.jsonPath]));
 photo.labels[0].english=english;photo.labels[0].learning.example=`The ${english} is beside the table.`;
 files[entry.jsonPath]=strToU8(JSON.stringify(photo));entry.jsonSHA256=createHash('sha256').update(files[entry.jsonPath]).digest('hex');files['manifest.json']=strToU8(JSON.stringify(manifest));
 return {name:'input-regression.piclexdeck',mimeType:'application/zip',buffer:Buffer.from(zipSync(files))};
}
async function open(page:Page,word='glass partition'){
 await page.goto('/piclex-web/#/decks');await expect(page.getByRole('button',{name:'导入自己的卡组'})).toBeEnabled();
 await page.getByLabel('选择照片卡组文件').setInputFiles(phraseDeck(word));await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toBeVisible();
}
test('phrase separators keep touch and hardware insertion after the last entered letter',async({page},info)=>{
 await open(page);const input=page.getByRole('textbox',{name:'输入英文',exact:true});
 for(const [i,letter] of [...'glasspa'].entries()){
  const key=page.locator(`.virtual-key[data-key="${letter}"]`);if(info.project.use.hasTouch)await key.tap();else await key.click();
  const expected=i<5?'glass'.slice(0,i+1):'glass pa'.slice(0,i+2);
  await expect(input).toHaveValue(expected);expect(await input.evaluate((n:HTMLInputElement)=>n.selectionStart)).toBe(expected.length);
 }
 await input.press('Backspace');await expect(input).toHaveValue('glass p');await input.press('a');await expect(input).toHaveValue('glass pa');
 await input.press('ArrowLeft');await input.press('Delete');await expect(input).toHaveValue('glass p');await input.press('a');await expect(input).toHaveValue('glass pa');
 await page.reload();await expect(input).toHaveValue('glass pa');
});
test('typing avoids whole-study clones and prompt rebuilds while preserving glyph and ripple effects',async({page},info)=>{
 await open(page);await expect(page.locator('.focus-image')).toBeVisible();
 await page.evaluate(()=>{
  const w=window as any;w.__inputWork={clones:0,segments:0,writes:0,glyphs:0,ripples:0,durations:[]};
  const clone=window.structuredClone;window.structuredClone=((...args:any[])=>{w.__inputWork.clones++;return (clone as any)(...args);}) as any;
  const Segmenter=Intl.Segmenter;Intl.Segmenter=class extends Segmenter{constructor(...args:any[]){super(...args as []);w.__inputWork.segments++;}};
  const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('piclex-web.study.v2.'))w.__inputWork.writes++;return set.call(this,k,v);};
  const animate=Element.prototype.animate;Element.prototype.animate=function(...args:any[]){if(this.classList.contains('letter-glyph'))w.__inputWork.glyphs++;return (animate as any).apply(this,args);};
  const arc=CanvasRenderingContext2D.prototype.arc;CanvasRenderingContext2D.prototype.arc=function(...args:any[]){if(this.canvas.classList.contains('character-ripples'))w.__inputWork.ripples++;return (arc as any).apply(this,args);};
 });
 // One uninterrupted burst, followed by a real animation frame. No reduced-motion override.
 await page.evaluate(()=>{for(const letter of 'glassp'){const start=performance.now();document.querySelector<HTMLButtonElement>(`.virtual-key[data-key="${letter}"]`)!.click();(window as any).__inputWork.durations.push(performance.now()-start);}});
 await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toHaveValue('glass p');
 await expect.poll(()=>page.evaluate(()=>(window as any).__inputWork.ripples)).toBeGreaterThan(0);
 const result=await page.evaluate(()=>(window as any).__inputWork);await info.attach('input-work',{body:JSON.stringify(result),contentType:'application/json'});
 expect(result.clones).toBe(0);expect(result.segments).toBe(0);expect(result.glyphs).toBe(6);expect(result.writes).toBeLessThan(6);
 await expect.poll(()=>page.evaluate(()=>(window as any).__inputWork.writes)).toBeGreaterThan(0);
 await page.screenshot({path:info.outputPath('input-effects.png')});
});
test('rapid typing preserves the active particle frame instead of resetting the full-screen canvas',async({page})=>{
 await open(page,'supercalifragilisticexpialidocious');
 const input=page.getByRole('textbox',{name:'输入英文',exact:true});await input.press('s');
 await expect.poll(()=>page.evaluate(()=>{
  const canvas=document.querySelector<HTMLCanvasElement>('.experience-particles');if(!canvas)return false;
  return canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4===3&&v>0);
 })).toBe(true);
 const burst=await page.evaluate(()=>{
  const canvas=document.querySelector<HTMLCanvasElement>('.experience-particles')!;
  let resets=0;for(const key of ['width','height']){
   const descriptor=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,key)!;
   Object.defineProperty(canvas,key,{get(){return descriptor.get!.call(this);},set(value){resets++;descriptor.set!.call(this,value);},configurable:true});
  }
  const context=canvas.getContext('2d')!,pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
  const index=pixels.findIndex((value,i)=>i%4===3&&value>0),pixel=(index-3)/4,x=pixel%canvas.width,y=Math.floor(pixel/canvas.width);
  const before=[...context.getImageData(x,y,1,1).data];
  const input=document.querySelector<HTMLInputElement>('input[aria-label="输入英文"]')!;
  // Real key handlers commit synchronously; no animation frame can repair a
  // cleared backing store between these rapid events and the pixel check.
  for(const key of 'upercalifragili'){
   input.dispatchEvent(new KeyboardEvent('keydown',{key,code:`Key${key.toUpperCase()}`,bubbles:true,cancelable:true}));
   input.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));
  }
  return {resets,before,after:[...context.getImageData(x,y,1,1).data],sameCanvas:canvas===document.querySelector('.experience-particles'),value:input.value};
 });
 expect(burst.value).toBe('supercalifragili');expect(burst.sameCanvas).toBe(true);
 expect(burst.resets).toBe(0);expect(burst.after).toEqual(burst.before);
 await expect(page.locator('.experience-particles')).toHaveCount(0,{timeout:5000});
});
test('an immediate page exit and leaving learning flush the last burst without waiting for autosave',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  for(const letter of 'glassp')document.querySelector<HTMLButtonElement>(`.virtual-key[data-key="${letter}"]`)!.click();
  window.dispatchEvent(new PageTransitionEvent('pagehide'));
 });
 const saved=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('piclex-web.study.v2.')).map(k=>JSON.parse(localStorage[k])));
 expect(saved.some(s=>Object.values(s.words).some((w:any)=>w.input==='glass p'))).toBe(true);
 await page.getByRole('navigation',{name:'底部导航'}).getByRole('button',{name:'设置',exact:true}).click();
 await page.getByRole('navigation',{name:'底部导航'}).getByRole('button',{name:'学习',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toHaveValue('glass p');
});

test('typing preserves restored progress and unrelated stored decks when the page hides',async({page})=>{
 await open(page);const learningURL=page.url();
 // Seed an inactive saved session: leaving learning flushes the old in-memory draft first.
 await page.getByRole('navigation',{name:'底部导航'}).getByRole('button',{name:'设置',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'输入英文',exact:true})).toHaveCount(0);
 const baseline=await page.evaluate(()=>{
  const key=Object.keys(localStorage).find(k=>k.startsWith('piclex-web.study.v2.'))!;
  const saved=JSON.parse(localStorage[key]);
  saved.round=4;
  localStorage.setItem(key,JSON.stringify(saved));
  const untouched=JSON.stringify({version:2,fingerprint:'unrelated-deck',index:12,round:3,words:{kept:{input:'preserved',result:'correct'}},history:{kept:{mastered:true,mistakes:[]}}});
  localStorage.setItem('piclex-web.study.v2.unrelated-deck',untouched);
  return {key,fingerprint:saved.fingerprint,untouched};
 });
 await page.goto(learningURL);const input=page.getByRole('textbox',{name:'输入英文',exact:true});await expect(input).toBeVisible();
 await page.evaluate(()=>{
  for(const letter of 'glassp')document.querySelector<HTMLButtonElement>(`.virtual-key[data-key="${letter}"]`)!.click();
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  document.dispatchEvent(new Event('visibilitychange'));
 });
 const saved=await page.evaluate(key=>JSON.parse(localStorage[key]),baseline.key);
 expect(saved.fingerprint).toBe(baseline.fingerprint);expect(saved.round).toBe(4);
 expect(Object.values(saved.words).some((word:any)=>word.input==='glass p')).toBe(true);
 expect(await page.evaluate(()=>localStorage.getItem('piclex-web.study.v2.unrelated-deck'))).toBe(baseline.untouched);
 await page.reload();await expect(input).toHaveValue('glass p');
});


for(const starvedIdle of [false,true])test(`full Emoji effects reuse prepared glyphs with idle callbacks ${starvedIdle?'deferred':'available'}`,async({page})=>{
 await page.addInitScript(starvedIdle=>{
  if(starvedIdle){window.requestIdleCallback=()=>1;window.cancelIdleCallback=()=>{};}
  const w=window as any;w.__emojiWork={prepared:[],liveText:0,images:0};
  const symbols=new Set(['😀','😎','🥳','🐶','🐱','🐼','🦊','🐸','🍎','🍓','🍉','🍇','🌈','🚀','🎈','⚽']);
  const fill=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(...args:any[]){
   if(symbols.has(args[0])){if(this.canvas.classList.contains('experience-particles'))w.__emojiWork.liveText++;else w.__emojiWork.prepared.push(args[0]);}
   return (fill as any).apply(this,args);
  };
  const draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args:any[]){if(this.canvas.classList.contains('experience-particles'))w.__emojiWork.images++;return (draw as any).apply(this,args);};
 },starvedIdle);
 await open(page,'croissant');
 await expect.poll(()=>page.evaluate(()=>new Set((window as any).__emojiWork.prepared).size)).toBe(16);
 await page.evaluate(()=>{for(const letter of 'croissan')document.querySelector<HTMLButtonElement>(`.virtual-key[data-key="${letter}"]`)!.click();});
 await expect.poll(()=>page.evaluate(()=>(window as any).__emojiWork.images)).toBeGreaterThan(0);
 const before=await page.evaluate(()=>(window as any).__emojiWork.images);
 await page.locator('.virtual-key[data-key="t"]').click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__emojiWork.images)).toBeGreaterThan(before);
 const result=await page.evaluate(()=>(window as any).__emojiWork);
 expect(result.liveText).toBe(0);expect(result.prepared).toHaveLength(16);
 // The cached images must contain visible color, not just empty draw calls.
 await expect.poll(()=>page.evaluate(()=>{
  const canvas=document.querySelector<HTMLCanvasElement>('.experience-particles');if(!canvas)return false;
  return canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data.some((value,index)=>index%4===3&&value>0);
 })).toBe(true);
});
