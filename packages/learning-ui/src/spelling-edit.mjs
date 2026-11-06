import {editKeyboardText} from './keyboard-edit.mjs';
import {fixed,resolve} from './spelling.mjs';
/** Map the proposed caret through automatic spaces/punctuation in spelling. */
export function editSpellingText(expected,value,start,end,key){
 const edited=editKeyboardText(value,start,end,key);if(!edited)return null;
 const accepted=resolve(expected,value,edited.value);
 if(accepted===value)return {value,cursor:start??value.length,end:end??start??value.length};
 const letters=[...edited.value.slice(0,edited.cursor)].filter(c=>!fixed(c)).length;
 let cursor=0,count=0;
 for(const c of accepted){if(!fixed(c)&&count===letters)break;cursor+=c.length;if(!fixed(c))count++;}
 return {value:accepted,cursor,end:cursor};
}
