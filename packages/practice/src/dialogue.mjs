import {tokens} from './sentence.mjs';
// Match the App's deliberately conservative two-speaker grammar.
export function readingDialogue(text){
 const normalized=text.replace(/\\n/g,'\n');
 const matches=[...normalized.matchAll(/(?:^|[\r\n]|(?<=\s))([AB])\s*[:：]\s*|(?:^|[\r\n])\s*([\p{L}][\p{L} .'-]{0,23})\s*[:：]\s*/gu)];
 if(matches.length<2||normalized.slice(0,matches[0].index).trim())return null;
 const roles=new Map([['A','learner'],['Speaker A','learner'],['Person A','learner'],['甲','learner'],['B','machine'],['Speaker B','machine'],['Person B','machine'],['乙','machine']]);
 const turns=[];
 for(let i=0;i<matches.length;i++){
  const match=matches[i],role=roles.get((match[1]||match[2]).trim());if(!role)return null;
  let value=normalized.slice(match.index+match[0].length,matches[i+1]?.index??normalized.length).trim();
  for(const [a,b] of [['"','"'],['“','”'],['‘','’']])if(value.startsWith(a)&&value.endsWith(b)&&value.length>=2){value=value.slice(1,-1).trim();break;}
  if(!tokens(value).length)return null;
  if(turns.at(-1)?.role===role)turns.at(-1).text+='\n'+value;else turns.push({role,text:value});
 }
 return new Set(turns.map(t=>t.role)).size===2?turns:null;
}
export function readingScore(matched,total,complete=true){return total>0?Math.min(complete&&matched>=total?100:99,Math.round(100*Math.min(total,Math.max(0,matched))/total)):0;}
