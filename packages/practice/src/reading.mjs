import {checkSentence,tokens} from './sentence.mjs';
// Retain target positions, not a bag of words: repeating one occurrence cannot
// turn two identical target words green. Browser confidence is not a pronunciation score.
export function accumulateReading(sentence,transcript,previous=[]){
 const target=tokens(sentence),matched=new Set(previous.filter(i=>Number.isInteger(i)&&i>=0&&i<target.length));
 let index=0;for(const edit of checkSentence(sentence,transcript).edits){if(edit.expected!==null){if(edit.kind==='match')matched.add(index);index++;}}
 return {matched:[...matched].sort((a,b)=>a-b),passed:target.length>0&&matched.size===target.length};
}
