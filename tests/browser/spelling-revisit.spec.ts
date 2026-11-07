import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {fillSpelling} from './helpers/spelling';
const catalog=JSON.parse(fs.readFileSync('apps/public/public/library/catalog.json','utf8')),card=catalog[0],deck=JSON.parse(fs.readFileSync('apps/public/public/'+card.payload,'utf8'));
const words=deck.words.slice(0,6),fingerprint=deck.learningFingerprint||deck.fingerprint,storageKey=`piclex-web.study.v2.${fingerprint}`;
// Five answered cards plus one deliberately unfinished draft (curtain -> "cur").
const seed={version:2,fingerprint,index:0,round:0,presentation:0,module:'spelling',mode:'chunks',rate:1,difficulty:'hard',quick:false,hiddenChinese:false,history:{},sentences:{},sentenceIndex:0,sentenceFinished:false,pending:null,
 words:Object.fromEntries(words.map((word:any,index:number)=>[word.id,index<5?{input:word.english,result:'correct',hadMistake:false,quickIndices:null}:{input:word.english.slice(0,3),result:null,hadMistake:false,quickIndices:null}]))};
test('a spelling link revisit keeps reopening the completed words that follow',async({page})=>{
 await page.addInitScript(({key,state})=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{}},{key:storageKey,state:seed});
 const [,second,third,fourth,fifth,sixth]=words,input=page.getByRole('textbox',{name:'输入英文',exact:true});
 await page.goto(`/piclex-web/#/deck/${card.id}?module=spelling&photo=${second.imageIndex+1}&word=${encodeURIComponent(second.id)}`);
 await expect(page.getByRole('heading',{name:second.chinese,exact:true})).toBeVisible();
 await expect(input).toHaveValue('');
 // Verify the active saved study was loaded, so empty defaults cannot make this regression pass.
 await expect.poll(()=>page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)||'{}').words?.[id]?.result,{key:storageKey,id:third.id})).toBe('correct');
 await expect.poll(()=>page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)||'{}').words?.[id]?.input,{key:storageKey,id:sixth.id})).toBe(sixth.english.slice(0,3));
 await fillSpelling(page,second.english);
 await expect(page.getByRole('heading',{name:third.chinese,exact:true})).toBeVisible();
 await expect(input).toHaveValue('');await expect(page.getByRole('button',{name:'不认识'})).toBeEnabled();
 await fillSpelling(page,third.english);
 await expect(page.getByRole('heading',{name:fourth.chinese,exact:true})).toBeVisible();
 await expect(input).toHaveValue('');
 // Revealed answers have no auto-advance; the manual next must open the next completed card empty too.
 await page.getByRole('button',{name:'不认识'}).click();
 await page.getByRole('button',{name:'下一个',exact:true}).click();
 await expect(page.getByRole('heading',{name:fifth.chinese,exact:true})).toBeVisible();
 await expect(input).toHaveValue('');
 await fillSpelling(page,fifth.english);
 // An unfinished draft is not an answer, so auto-advance must preserve it.
 await expect(page.getByRole('heading',{name:sixth.chinese,exact:true})).toBeVisible();
 await expect(input).toHaveValue(sixth.english.slice(0,3));
 await fillSpelling(page,sixth.english.slice(0,4));
 await expect(input).toHaveValue(sixth.english.slice(0,4));
});
