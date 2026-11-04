import {expect,type Locator,type Page} from '@playwright/test';

// Exercise the input contract on both devices. A touch spelling field is
// intentionally read-only to the OS; hardware keys use the same controlled path.
export async function fillSpelling(page:Page,value:string){
 const input=page.getByRole('textbox',{name:'输入英文',exact:true});
 await expect(input).toBeVisible();
 if(await input.getAttribute('inputmode')==='none'){
  await input.press('ControlOrMeta+a');await input.press('Backspace');
  await expect(input).toHaveValue('');await input.pressSequentially(value);
 }else await input.fill(value);
}

export async function fillEnglish(input:Locator,value:string){
 await expect(input).toHaveAttribute('readonly','');
 if(await input.inputValue()){await input.press('ControlOrMeta+a');await input.press('Backspace');}
 await input.pressSequentially(value);
}
