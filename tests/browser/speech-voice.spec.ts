import {test,expect} from '@playwright/test';
test('automatic speech avoids Albert, manual choice persists, and normal pitch is retained',async({page})=>{
 await page.addInitScript(()=>{
  const w=window as any;w.__spoken=[];
  const voices=['Albert','Google US English','Samantha'].map(name=>({name,lang:'en-US',voiceURI:name,default:name==='Albert',localService:name!=='Google US English'}));
  w.SpeechSynthesisUtterance=class{pitch=1;rate=1;volume=1;voice=null;text:string;constructor(text:string){this.text=text;}};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>voices,cancel(){},addEventListener(){},removeEventListener(){},speak(u:any){w.__spoken.push({voice:u.voice?.name,pitch:u.pitch,rate:u.rate});queueMicrotask(()=>u.onend?.());}}});
 });
 await page.goto('/piclex-web/#/settings/speech');
 const preview=page.getByRole('button',{name:'试听当前声音'}),select=page.getByLabel('朗读声音',{exact:true});
 await preview.click();await expect.poll(()=>page.evaluate(()=>(window as any).__spoken.at(-1))).toEqual({voice:'Google US English',pitch:1,rate:1});
 await select.selectOption('Albert');await preview.click();await expect.poll(()=>page.evaluate(()=>(window as any).__spoken.at(-1).voice)).toBe('Albert');
 await page.reload();await expect(select).toHaveValue('Albert');await preview.click();await expect.poll(()=>page.evaluate(()=>(window as any).__spoken.at(-1).voice)).toBe('Albert');
 await select.selectOption('');await page.getByRole('button',{name:'学习',exact:true}).click();await expect(page.locator('.native-hint .sentence-ambience summary')).toBeVisible();
 await page.getByRole('button',{name:'播放句子和单词',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__spoken.at(-1)?.voice)).toBe('Google US English');
});
