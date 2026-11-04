import {useEffect,useState} from 'react';
import {levelProgress,rewards} from '../../../packages/practice/src/experience.mjs';
import {experienceReport,subscribeExperience} from '../../../packages/practice/src/experience-store.mjs';
export function useExperience(){const [value,setValue]=useState<any>(()=>({...levelProgress(0),statistics:{},milestones:[]}));const [error,setError]=useState('');useEffect(()=>{experienceReport().then(setValue).catch(e=>setError(e.message));return subscribeExperience(setValue);},[]);return {...value,error};}
export function ExperienceMeter({open}:{open?:()=>void}){const xp=useExperience();return <button className="experience-meter" onClick={open} aria-label={`等级 LV${xp.level}，${xp.total} 经验`}><strong>LV{xp.level}</strong><span className="learning-experience" role="progressbar" aria-label="等级经验" aria-valuenow={Math.round(xp.fraction*100)} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${xp.fraction*100}%`}}/></span><small>{xp.earned} / {xp.required}</small></button>;}
export function PracticeProgress({deckTitle,position,count,openLevel,openDeck}:{deckTitle:string;position:number;count:number;openLevel:()=>void;openDeck:()=>void}){
 const xp=useExperience();return <div className="practice-progress-battery">
  <button className="practice-level-target" onClick={openLevel} aria-label={`等级 LV${xp.level}，${xp.total} 经验`}>
   <span className="practice-player-avatar"><img src={`${import.meta.env.BASE_URL}lab/assets/hero.png`} alt=""/><strong>LV{xp.level}</strong></span>
  </button>
  <button className="practice-deck-target" onClick={openDeck} aria-label="当前卡组，学习设置">
   <span className="practice-experience-target">
   <span className="learning-experience" role="progressbar" aria-label="等级经验" aria-valuenow={Math.round(xp.fraction*100)} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${xp.fraction*100}%`}}/><b>{(xp.fraction*100).toFixed(2)}%</b></span>
   </span>
   <span className="practice-deck-lane"><span>{deckTitle}</span><i aria-hidden="true">▾</i></span>
  </button>
  <span className="sr-only" role="progressbar" aria-label="本轮练习进度" aria-valuenow={position} aria-valuemin={0} aria-valuemax={count}/>
 </div>;
}
export function LevelPage({embedded=false}:{embedded?:boolean}={}){const xp=useExperience();return <section className="level-page">{!embedded&&<h1>我的等级</h1>}<ExperienceMeter/><p>共 {xp.total} 经验 · 距离 LV{xp.level+1} 还需 {xp.remaining} 经验</p><p className="muted">拼对单词 +1；拼句和听写 +3–6；跟读按匹配进度计分。薯薯求生与学习共用经验。</p>{xp.error&&<p role="alert">{xp.error}</p>}<div className="experience-totals">{[['spelling','拼写'],['dictation','拼句与听写'],['reading','跟读'],['gameEarned','游戏获得'],['gameSpent','游戏消耗']].map(([k,title])=><div key={k}><span>{title}</span><strong>{k==='gameSpent'?'−':'+'}{xp.statistics[k]||0}</strong></div>)}</div><h2>等级奖励</h2>{rewards.map(r=><div className="level-reward" key={r.level}><b>LV{r.level}</b><span>{r.title}<small>{r.web?'':'App 中使用'}</small></span><span>{xp.total>=r.level*(r.level+1)?'已解锁':`还需 ${r.level*(r.level+1)-xp.total} 经验`}</span></div>)}<p className="muted small">规则与 App 一致；当前浏览器独立保存，不与手机或另一个域名自动同步。</p></section>;}
