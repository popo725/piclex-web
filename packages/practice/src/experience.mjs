// Rules ported from native UserLevel.swift, not a second scoring system.
export const rewards=[{level:2,title:'学习目标',web:false},{level:3,title:'键盘声音',web:true},{level:4,title:'快门声音',web:true},{level:5,title:'相机界面',web:false},{level:6,title:'快拼',web:true},{level:7,title:'粒子效果',web:true},{level:8,title:'闭眼记单词',web:false}];
export function levelProgress(value){const total=Math.max(0,Number.isSafeInteger(value)?value:0);let low=0,high=total;while(low<high){const n=low+Math.floor((high-low+1)/2);if(n<=Math.floor(total/(n+1)))low=n;else high=n-1;}const level=low,earned=total-level*(level+1),required=(level+1)*2;return {schemaVersion:1,total,level,earned,required,remaining:required-earned,fraction:earned/required};}
export const sentencePoints=count=>Number.isInteger(count)&&count>0&&count<=2000?3+Math.min(3,Math.floor((count-1)/8)):0;
export const skipCost=tier=>[12,18,26,36][tier-1]??null;
export const waveReward=wave=>Number.isInteger(wave)&&wave>=1&&wave<=20?2+Math.floor((wave-1)/5):null;
export function creditFor(event){
 if(!event||typeof event.id!=='string'||event.id.length<1||event.id.length>600)return null;
 if(event.kind==='spelling')return event.result==='correct'||event.result==='reviewed'?1:null;
 if(event.kind==='dictation')return ['chunks','free'].includes(event.mode)&&event.correct===true?sentencePoints(event.wordCount)||null:null;
 if(event.kind==='reading')return Number.isInteger(event.matched)&&event.matched>0&&event.matched<=event.wordCount?Math.ceil(sentencePoints(event.wordCount)*event.matched/event.wordCount):null;
 if(event.kind==='laboratory'){
  if(event.action==='word'&&event.tier===0&&event.cost===0&&event.amount===1)return 1;
  if(event.action==='wave'&&event.cost===0&&event.amount===waveReward(event.tier))return event.amount;
  const cost=skipCost(event.tier);if(event.action==='spend'&&cost&&event.cost===cost&&event.amount===-cost)return -cost;
 }return null;
}
export function settleCredit(total,event,previous){
 const credit=creditFor(event);if(!Number.isSafeInteger(total)||total<0||!Number.isSafeInteger(credit)||!Number.isSafeInteger(total+credit))return {status:'invalid',total,delta:0};
 if(previous&&previous.kind!==event.kind)return {status:'invalid',total,delta:0};
 const delta=previous?(event.kind==='reading'?Math.max(0,credit-previous.credit):0):credit;
 if(total+delta<0)return {status:'insufficient',total,delta:0};
 return {status:'accepted',total:total+delta,delta,credit:previous?previous.credit+delta:credit};
}
