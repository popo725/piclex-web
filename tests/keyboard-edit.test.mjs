import test from 'node:test';
import assert from 'node:assert/strict';
import {editKeyboardText} from '../packages/learning-ui/src/keyboard-edit.mjs';
test('virtual input replaces the active selection and reports the native caret',()=>{
 assert.deepEqual(editKeyboardText('clack',2,3,'o'),{value:'clock',cursor:3});assert.deepEqual(editKeyboardText('word',4,4,' '),{value:'word ',cursor:5});
});
test('backspace and delete remove whole Unicode characters without damaging adjacent text',()=>{
 assert.deepEqual(editKeyboardText('a😀b',3,3,'Backspace'),{value:'ab',cursor:1});assert.deepEqual(editKeyboardText('a😀b',1,1,'Delete'),{value:'ab',cursor:1});assert.deepEqual(editKeyboardText('',0,0,'Backspace'),{value:'',cursor:0});assert.deepEqual(editKeyboardText('clock',1,4,'Backspace'),{value:'ck',cursor:1});
});
test('navigation and shortcuts cannot become literal answer text',()=>{
 for(const key of ['Enter','Escape','Shift','ArrowLeft','Tab'])assert.equal(editKeyboardText('a',1,1,key),null);
});
