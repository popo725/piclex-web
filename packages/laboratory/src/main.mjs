import { browserSaveKey } from './export-materials.mjs';
import { runSave } from './run-save.mjs';
import { readRun, restoreRun } from './run-state.mjs';
import { mountLandscapePrompt } from './orientation.mjs';
import {spellingPhoto} from './photo.mjs';
import { browserProgress, achievements, achievementValue, achievementGroups, achievementList } from './progress.mjs';
import { SurvivalGame, catalog, MAX_WAVES } from './engine.mjs';
import { starterWords, eligibleWords } from './words.mjs';
import { artwork, loadArtwork, itemArt, coinArt, upgradeArt, drawItem,drawProp } from './art.mjs';
import { playerHalo, playerSprite, enemyHalo, enemySprite } from './visibility.mjs';
import { LabSound } from './sound.mjs';
import { AchievementNotices } from './achievement-notices.mjs';
import { characters, weapon, weaponInstance, tierNames, tierColors, describeEffects } from './content.mjs';
import { xpRequired, recyclePrice, canCombine } from './rules.mjs';
import { weaponPose } from './weapon-pose.mjs';
import { overrides } from './data/prototype-overrides.mjs';
import { arenaViewport } from './arena.mjs';
import { drawPulse, drawExplosion, drawDamageNumber } from './combat-fx.mjs';
import { maskExample, fixed } from '../spelling.mjs';
import { editableLetters, createTileBank, tileById, useTile, returnTile, moveSlot, createSlots, proposedFrom, isFull } from './letter-tiles.mjs';
import { CompactPanels } from './compact-panels.mjs';
import { singleRowLayout, sharedRowLayout, tileFontSize } from './adaptive-tiles.mjs';
import { experienceBridge,skipExperienceCost } from './experience.mjs';

const $=id=>document.getElementById(id), canvas=$('arena'),ctx=canvas.getContext('2d');
const screen=$('screen'),dialog=$('spelling'),stage=$('stage');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const savedProgress=browserProgress(),progression=savedProgress.progress;
const characterDetails={well_rounded:'生命 +5 · 移速 +5% · 收获 +8',brawler:'拳套攻速 +50% · 闪避 +15% · 射程 −50',ranger:'射程 +50 · 远程伤害成长 +50% · 生命成长 −25%',multitasker:'可持有12把武器 · 伤害 +20% · 每把武器降低5%伤害',mage:'元素属性增益 +25% · 自带蛇和恐惧香肠 · 近战与远程属性增益为0 · 工程增益 −50%',doctor:'医疗武器攻速 +200% · 全部武器攻速 −100% · 再生 +5 · 再生增益翻倍且每次恢复2生命 · 收获 +5 · 护甲增益减半',engineer:'工程 +10 · 工程增益 +25% · 自带扳手 · 扳手随工程成长 · 伤害增益减半'};
let selectedCharacter='well_rounded',unlockNotices=0,saveNotice=false;
let words=eligibleWords(window.PICLEX_LAB_EXPORT?.words ?? window.PICLEX_LAB_WORDS),game=new SurvivalGame({words:words.length?words:starterWords,character:selectedCharacter,progression});
let phase='',last=0,hudClock=0,toastTimer,noticeTimer,wordLoadPending=false;
const keys=new Set(),stick={x:0,y:0},pointer={id:null,x:0,y:0};
const coarse=matchMedia('(pointer:coarse)').matches;
const sound=new LabSound();let stepSide=false;
const achievementBanner=document.createElement('div');achievementBanner.id='achievement-notice';achievementBanner.className='achievement-notice';achievementBanner.setAttribute('role','status');achievementBanner.setAttribute('aria-live','polite');document.body.append(achievementBanner);
const achievementNotices=new AchievementNotices(a=>{
  if(achievementBanner.dataset.achievement!==a.id){achievementBanner.dataset.achievement=a.id;achievementBanner.innerHTML=`${itemArt(a.reward?.id||'trophy')}<div><small>成就达成</small><strong>${escape(a.title)}</strong><span>${escape(a.reward?.kind==='character'?a.reward.name+'角色成就已完成':a.reward?'解锁 '+a.reward.name:a.description)}</span></div>`;}
  achievementBanner.hidden=false;
},()=>{achievementBanner.hidden=true;},name=>sound.play(name));
const savedRun=runSave({onFailure:()=>toast('本轮存档未保存，请先不要退出。')});
const experience=experienceBridge({onChange:renderUserLevel});
let pendingRun=savedRun.snapshot,saveClock=0;
let experienceBusy=false;
function renderUserLevel(snapshot=experience.snapshot){
  $('user-level-label').textContent=`LV${snapshot.level}`;
  $('user-level-fill').style.width=`${Math.max(0,Math.min(1,snapshot.fraction))*100}%`;
  $('user-level-detail').textContent=`${snapshot.earned} / ${snapshot.required} · ${snapshot.total} 经验`;
  refreshExperienceSkip();
}
function pendingSpend(){return game.pendingExperience.some(event=>event.action==='spend');}
// While a skip-experience spend is in flight the draft must not be edited or
// auto-judged, otherwise a second settlement could charge the same offer again.
function interactionsLocked(){return experienceBusy||pendingSpend();}
function syncTileLock(){
  const locked=interactionsLocked();
  $('letter-bank').classList.toggle('locked',locked);
  $('answer-board').classList.toggle('locked',locked);
  for(const button of $('letter-bank').querySelectorAll('button.tile')){
    const used=button.classList.contains('used');
    button.disabled=locked||used;button.setAttribute('aria-disabled',String(locked||used));
  }
}
function refreshExperienceSkip(){
  const button=$('skip-spelling'),offer=currentOffer();if(!button)return;
  const cost=skipExperienceCost(offer?.tier||1),retrying=pendingSpend();
  button.textContent=cost?(retrying?`重试结算 ${cost} 经验`:experience.canSpend(cost)?`消耗 ${cost} 经验跳过`:`经验不足 · 需要 ${cost}`):'暂时无法跳过';
  // Only the in-flight request disables retry; a failed spend stays retryable with its own id.
  button.disabled=!cost||!experience.canSpend(cost)||experienceBusy;
  $('spell-cancel').disabled=interactionsLocked();
  syncTileLock();
}
async function syncExperience(){
  if(experienceBusy)return;
  const event=game.pendingExperience[0];if(!event)return;
  experienceBusy=true;refreshExperienceSkip();
  let response;
  try{
    if(!savedRun.save(game)||!await savedRun.flush()){toast('经验结算前未能保存本轮进度，请稍后重试。');return;}
    response=await experience.transact(event);
    const result=game.settleExperience(event.id,response.status);
    if(result.status==='purchased'){
      delete result.offer.labTiles;closeSpelling();renderShop();updateHUD();sound.play('purchase');
      toast(`已消耗 ${event.cost} 经验，${result.offer.name} 已放入口袋。`);
    }else if(result.status==='earned'&&event.action==='wave')toast(`第 ${event.tier} 波完成，等级经验 +${event.amount}。`);
    else if(result.status==='insufficient'){$('spell-feedback').textContent=`经验不足，需要 ${event.cost} 点。`;$('spell-feedback').className='spell-feedback error';}
    else if(result.status==='invalid')toast('这笔经验结算无效，已安全取消，请重新操作。');
    else if(response.status==='failed')toast('经验暂时无法结算，已保留进度供稍后重试。');
    savedRun.save(game);
  }finally{
    experienceBusy=false;refreshExperienceSkip();
    if(response&&response.status!=='failed'&&game.pendingExperience.length)queueMicrotask(syncExperience);
    // A draft completed while the spend was waiting settles as soon as it clears.
    maybeAutoJudge();
  }
}
function checkpoint(){savedRun.save(game);void syncExperience();}
function continueRun(){
  if(wordLoadPending)return;
  const restored=restoreRun(pendingRun,{progression,words});
  if(!restored){toast('存档暂时无法读取，请开始新冒险。');return;}
  game=restored;unlockNotices=game.newUnlocks.length;achievementNotices.reset();selectedCharacter=game.character.id;pendingRun=null;
  game.resume();resetInput();fit();phase='';renderPhase();
  if(game.challenge)openSpelling();checkpoint();last=performance.now();
}
// The game is designed around one landscape surface. Reuse the same compact
// panels on desktop browsers so a taller window does not fall back to the old
// scrolling shop, while portrait browsers keep the existing stacked layout.
const compactViewport=matchMedia('(orientation:landscape)');
const compactPanels=new CompactPanels(screen,{game:()=>game,progression,itemArt,coinArt,renderPhase,start,restart,retry,openSpelling,updateHUD,exit:()=>$('exit').click(),play:name=>sound.play(name)});
$('controls-tip').textContent=coarse?'拖动战场移动 · 自动攻击':'方向键 / WASD 移动 · 自动攻击';

function toast(text){$('notification').textContent=text;$('notification').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notification').hidden=true,2800);}
function waveToast(text){$('wave-toast').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('wave-toast').textContent='',1800);}
function resetInput(){keys.clear();stick.x=stick.y=0;pointer.id=null;$('joystick').classList.remove('active');$('stick').style.transform='';}
function pause(){savedProgress.flush();stopPronunciation();sound.pause();resetInput();if(game.pause())renderPhase();checkpoint();}
window.PicLexLab={pause,audioReady:()=>sound.recover(),speechFinished:()=>sound.duck(false),runSaved:(id,success)=>savedRun.acknowledge(id,success),experienceResult:(id,status,snapshot)=>experience.acknowledge(id,status,snapshot)};
renderUserLevel();
// A letter entering its slot plays the dedicated short slot effect and reuses the
// native haptic bridge. Only when no native bridge exists do we emit one short
// Web Vibration pulse, so a device with native haptics never double-buzzes.
function letterPlaced(){
  let native=false;
  try{const haptic=window.webkit?.messageHandlers?.labHaptic;if(haptic){haptic.postMessage('letter');native=true;}}catch{}
  sound.play('slot');
  if(!native){try{globalThis.navigator?.vibrate?.(15);}catch{}}
}

let currentUtterance=null;
function hasNativeSpeech(){return !!(window.webkit?.messageHandlers?.labSpeech);}
function preferredEnglishVoice(){
  if(!('speechSynthesis' in window))return null;
  let voices=[];try{voices=speechSynthesis.getVoices()||[];}catch{return null;}
  let saved='';try{saved=localStorage.getItem('piclex.browserVoice')||'';}catch{}
  return (saved&&voices.find(voice=>voice.voiceURI===saved&&/^en([-_]|$)/i.test(voice.lang||'')))
    ||voices.find(voice=>voice.lang==='en-US')
    ||voices.find(voice=>/^en([-_]|$)/i.test(voice.lang||''))
    ||null;
}
function stopPronunciation(){
  currentUtterance=null;
  sound.duck(false);
  if(hasNativeSpeech()){
    try{window.webkit.messageHandlers.labSpeech.postMessage({action:'stop'});}catch{}
    return;
  }
  if(!('speechSynthesis' in window))return;
  try{speechSynthesis.cancel();}catch{}
}
function pronounceCurrentWord(){
  const challenge=game.challenge,target=challenge&&challenge.word&&challenge.word.english;
  if(!target)return;
  if(hasNativeSpeech()){
    stopPronunciation();
    sound.duck(true);
    try{window.webkit.messageHandlers.labSpeech.postMessage({action:'speak',text:target});}
    catch{toast('暂时无法朗读，请再试一次。');}
    return;
  }
  if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){toast('暂时无法朗读，请再试一次。');return;}
  stopPronunciation();
  let utterance;try{utterance=new SpeechSynthesisUtterance(target);}catch{toast('暂时无法朗读，请再试一次。');return;}
  const voice=preferredEnglishVoice();
  if(voice){utterance.voice=voice;utterance.lang=voice.lang||'en-US';}else{utterance.lang='en-US';}
  utterance.rate=.85;
  utterance.onend=()=>{if(currentUtterance===utterance){currentUtterance=null;sound.duck(false);}};
  utterance.onerror=event=>{if(currentUtterance!==utterance)return;currentUtterance=null;sound.duck(false);const reason=event&&event.error;if(reason==='interrupted'||reason==='canceled')return;toast('暂时无法朗读，请再试一次。');};
  currentUtterance=utterance;
  sound.duck(true);
  try{speechSynthesis.speak(utterance);}catch{if(currentUtterance===utterance)currentUtterance=null;sound.duck(false);toast('暂时无法朗读，请再试一次。');}
}

function fit(){const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),view=arenaViewport(r.width,r.height);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr*view.scale,0,0,dpr*view.scale,0,0);game.resize(view.width,view.height);draw();}
new ResizeObserver(fit).observe(stage);
function start(){if(wordLoadPending)return;if(game.startWave()){pendingRun=null;checkpoint();resetInput();renderPhase();waveToast(`第 ${game.wave} 波 · 坚持 ${game.duration} 秒`);}}
function retry(){if(game.retryWave()){pendingRun=null;resetInput();last=performance.now();checkpoint();fit();renderPhase();updateHUD();waveToast(`第 ${game.wave} 波 · 坚持 ${game.duration} 秒`);}}
function restart(){if(['lost','won'].includes(game.phase)){savedRun.clear();pendingRun=null;}savedProgress.flush();unlockNotices=0;achievementNotices.reset();game=new SurvivalGame({words:words.length?words:starterWords,character:selectedCharacter,progression});fit();phase='';renderPhase();}
function renderPhase(){
  phase=game.phase;sound.setMusicPhase(phase);$('pause').hidden=!['battle','paused'].includes(phase);$('pause').textContent=phase==='paused'?'继续':'暂停';
  screen.className=`screen ${phase}-screen`;
  if(phase==='battle'||phase==='dying'){screen.innerHTML='';return;}
  if(phase==='ready'){
    screen.innerHTML=`<div class="cover ready-cover"><div class="ready-intro"><div class="potato-art" aria-hidden="true"></div><h1>薯薯求生</h1><small>${coarse?'拖动战场即可移动':'方向键 / WASD 移动'} · 武器自动攻击</small></div><div class="ready-actions"><label class="character-picker">角色 <select id="character-select">${characters.map(c=>`<option value="${c.id}" ${selectedCharacter===c.id?'selected':''}>${c.name}</option>`).join('')}</select></label><p class="character-detail">${escape(characterDetails[selectedCharacter])}</p>${pendingRun?`<button class="primary" id="continue-run" ${wordLoadPending?'disabled':''}>继续冒险 · 第 ${readRun(pendingRun).wave} 波</button>`:''}<button class="${pendingRun?'secondary':'primary'}" id="start-game" ${wordLoadPending?'disabled':''}>${wordLoadPending?'准备词库…':pendingRun?'放弃存档，开始新冒险':'开始冒险'}</button><button id="show-achievements" class="secondary achievements-link">${itemArt('trophy')}成就与解锁 · ${achievements.filter(a=>progression.has(a.id)).length} / ${achievements.length}</button></div></div>`;
    $('show-achievements').onclick=renderAchievements;
    $('start-game').onclick=start;
    if(pendingRun)$('continue-run').onclick=continueRun;
    $('character-select').onchange=event=>{selectedCharacter=event.target.value;restart();};
  }else if(phase==='paused'){
    screen.innerHTML='<div class="cover"><div class="eyebrow">喘口气，再出发</div><h1>已暂停</h1><p>准备好了，就继续这次冒险。</p><button id="resume-game" class="primary">继续冒险</button></div>';
    $('resume-game').onclick=()=>{game.resume();resetInput();renderPhase();};
  }else if(phase==='shop')renderShop();
  else if(phase==='upgrade')renderUpgrades();
  else if(phase==='loot')renderLoot();
  else if(phase==='won'||phase==='lost'){
    if(compactViewport.matches){compactPanels.renderResult();updateHUD();return;}
    const won=phase==='won',unknown=game.review.filter(w=>w.result==='unknown');
    screen.innerHTML=`<div class="cover"><div class="eyebrow">${won?'花园，守住了！':'小土豆，还会再回来。'}</div><h1>${won?'冒险成功':'再接再厉'}</h1><div class="result-stats"><div><b>${game.wave}</b><span>到达波次</span></div><div><b>${game.kills}</b><span>击败怪物</span></div><div><b>${game.correct}</b><span>拼对单词</span></div></div>${unknown.length?`<div class="review-list"><div class="side-label">下次试试这些词</div>${unknown.map(w=>`<p><b>${escape(w.english)}</b> · ${escape(w.chinese)}</p>`).join('')}</div>`:''}${game.newUnlocks.length?`<div class="unlocked-rewards"><b>本局解锁</b>${game.newUnlocks.map(a=>`<p>${itemArt(a.reward?.id||'trophy')}${escape(a.title)}${a.reward?' · '+escape(a.reward.name):''}</p>`).join('')}</div>`:''}<div class="result-actions">${game.canRetryWave?'<button id="retry-wave" class="primary">重试当前波次</button>':''}<button id="restart-game" class="${game.canRetryWave?'secondary':'primary'}">再来一局</button></div><small>每次出发，都比上一次多认识一点。</small></div>`;
    $('restart-game').onclick=restart;
    if(game.canRetryWave)$('retry-wave').onclick=retry;
    try{const best=Number(localStorage.getItem(browserSaveKey('piclex.lab.survival.best.v1'))||0);if(game.wave>best)localStorage.setItem(browserSaveKey('piclex.lab.survival.best.v1'),String(game.wave));}catch{}
  }
  updateHUD();
}
let achievementGroup='起步';
function renderAchievements(){
  if(compactViewport.matches){savedProgress.flush();compactPanels.renderAchievements();return;}
  savedProgress.flush();screen.classList.add('achievements-screen');
  screen.innerHTML=`<div class="shop"><div class="shop-header"><div><span>已解锁 ${achievements.filter(a=>progression.has(a.id)).length} / ${achievements.length}</span><h2>成就与解锁</h2></div><select id="achievement-group" aria-label="成就分类">${achievementGroups.map(g=>`<option ${g===achievementGroup?'selected':''}>${g}</option>`).join('')}</select><button id="close-achievements" class="secondary">返回</button></div><div class="achievement-list">${achievementList(progression.state,achievementGroup).map(a=>{
    const unlocked=progression.has(a.id),value=achievementValue(progression.state,a);
    return `<article class="achievement ${unlocked?'unlocked':''}" data-achievement="${a.id}"><span class="achievement-art">${itemArt(a.reward?.id||'trophy')}</span><div><strong>${escape(a.title)}</strong><p>${escape(a.description)}</p><small>${unlocked?'已达成 ✓':a.reward?.kind==='character'?'角色已开放':a.reward?'奖励':'勋章'}${a.reward?' · '+escape(a.reward.name):''}</small><progress max="${a.target}" value="${Math.min(value,a.target)}" aria-label="${escape(a.description)}"></progress><small>${Math.min(value,a.target)} / ${a.target}${a.type==='win'?' 波':''}</small></div></article>`;
  }).join('')}</div></div>`;
  $('close-achievements').onclick=renderPhase;
  $('achievement-group').onchange=event=>{achievementGroup=event.target.value;renderAchievements();};
}
function renderShop(){
  if(compactViewport.matches){compactPanels.renderShop();return;}
  screen.innerHTML=`<div class="shop"><div class="shop-header"><div><span>第 ${game.wave} 波完成 · 生命已恢复</span><h2>路边小店</h2></div><button id="refresh-shop" class="shop-refresh" ${game.coins<game.refreshPrice?'disabled':''}>换一批 · ${coinArt} ${game.refreshPrice}</button></div><div class="shop-grid">${game.offers.map((o,i)=>{
    const full=o.kind==='weapon'&&game.weapons.length>=game.maxWeapons&&!game.canBuy({...o,price:0}),disabled=!game.canBuy(o);
    const insufficient=o.status==='available'&&!full&&game.coins<o.price;
    const state=o.status==='purchased'?'已带走 ✓':o.status==='failed'?'购买失败':full?'武器已满':`${coinArt} ${o.price}`;
    return `<div class="offer-slot"><button class="offer ${o.status}" data-offer="${i}" ${disabled?'disabled':''} style="--rarity:${tierColors[o.tier||1]}"><div class="offer-top"><span class="offer-icon" aria-hidden="true">${itemArt(o.id)}</span><span class="offer-price${insufficient?' insufficient-funds':''}"${insufficient?` role="img" aria-label="价格 ${o.price} 金币，金币不足"`:''}>${state}</span></div><strong>${escape(o.name)} <span class="tier">${tierNames[o.tier||1]}</span></strong><small>${escape(o.detail)}</small></button><button class="offer-lock ${o.locked?'locked':''}" data-lock="${i}" aria-pressed="${!!o.locked}" ${o.status!=='available'?'disabled':''}>${o.locked?'已锁定 · 保留到下一波':'锁定'}</button></div>`;
  }).join('')}</div><div class="shop-footer"><p>手里的金币：${coinArt} ${game.coins}<br>检查拼写后扣除金币。</p><button id="next-wave" class="primary">下一波 →</button></div><details class="loadout" open><summary>随身武器 ${game.weapons.length} / ${game.maxWeapons}</summary><div class="loadout-list">${game.weapons.map((instance,i)=>{
    const w=weapon(instance),can=game.weapons.some((other,j)=>i!==j&&canCombine(weaponInstance(instance),weaponInstance(other)));
    return `<div class="loadout-row"><span class="loadout-icon">${itemArt(w.id)}</span><span><b>${w.name} <em style="color:${tierColors[w.tier]}">${tierNames[w.tier]}</em></b><small>伤害 ${game.damageFor(instance)} · ${w.sets.map(id=>({gun:'枪械',primitive:'原始',precise:'精准',medieval:'中世纪',unarmed:'徒手',blade:'刀刃',medical:'医疗',elemental:'元素',explosive:'爆炸',ethereal:'幽魂',heavy:'重型'}[id]||id)).join(' / ')}</small></span><div><button data-combine="${i}" ${can?'':'disabled'}>合成</button><button data-recycle="${i}">回收 +${recyclePrice(w.basePrice,game.wave,game.stats.items_price||0)}</button></div></div>`;
  }).join('')}</div></details><details class="run-stats"><summary>属性与套装</summary><p>${describeEffects(Object.entries(game.stats).filter(([key,value])=>value&&key!=='stat_max_hp').map(([key,value])=>({key,value:Math.round(value*100)/100})))||'暂时没有额外属性'}</p><p>生命上限 ${game.player.maxHP} · 基础伤害加成 ${game.player.damage}${Object.entries(game.setCounts).filter(([,n])=>n>=2).map(([id,n])=>` · ${id==='gun'?'枪械':id==='primitive'?'原始':id==='precise'?'精准':id==='medieval'?'中世纪':'徒手'}套装 ${n} 件`).join('')}</p></details><p class="shop-note">检查后扣除商品价格，拼对获得装备，拼错结束购买。</p></div>`;
  screen.querySelectorAll('[data-offer]').forEach(button=>button.onclick=()=>{if(game.beginPurchase(Number(button.dataset.offer)))openSpelling();});
  screen.querySelectorAll('[data-lock]').forEach(button=>button.onclick=()=>{if(game.toggleLock(Number(button.dataset.lock)))renderShop();});
  screen.querySelectorAll('[data-combine]').forEach(button=>button.onclick=()=>{if(game.combineWeapon(Number(button.dataset.combine))){sound.play('purchase');renderShop();updateHUD();}});
  screen.querySelectorAll('[data-recycle]').forEach(button=>button.onclick=()=>{if(game.recycleWeapon(Number(button.dataset.recycle))){sound.play('pickup');renderShop();updateHUD();}});
  $('refresh-shop').onclick=()=>{if(game.refreshShop()){renderShop();updateHUD();}};
  $('next-wave').onclick=start;
}
function renderUpgrades(){
  screen.classList.add('settlement-screen');
  screen.innerHTML=`<div class="shop"><div class="shop-header"><div><span>等级 ${game.pendingUpgrades[0]} · 选择一个提升</span><h2>升级</h2></div><button id="reroll-upgrade" class="shop-refresh" ${game.coins<game.refreshPrice?'disabled':''}>换一批 · ${game.refreshPrice}</button></div><div class="shop-grid">${game.upgradeOffers.map((u,i)=>`<button data-upgrade="${i}" class="offer offer-upgrade" style="--rarity:${tierColors[u.tier]}"><span class="upgrade-icon">${upgradeArt(u.effects[0].key)}</span><strong>${escape(u.detail)}</strong><small>${tierNames[u.tier]}</small></button>`).join('')}</div></div>`;
  screen.querySelectorAll('[data-upgrade]').forEach(button=>button.onclick=()=>{if(game.chooseUpgrade(Number(button.dataset.upgrade))){sound.play('level');renderPhase();}});
  $('reroll-upgrade').onclick=()=>{if(game.rerollUpgrades()){renderUpgrades();updateHUD();}};
}
function renderLoot(){
  const item=game.lootOffer;screen.innerHTML=`<div class="cover"><div class="eyebrow">战利品</div><h1>${item.name}</h1><p>${escape(item.detail)}</p><p>${tierNames[item.tier]}</p><div class="back-actions"><button id="take-loot" class="primary">收下</button><button id="recycle-loot" class="secondary">回收 +${recyclePrice(item.basePrice,game.wave,game.stats.items_price||0)}</button></div></div>`;
  $('take-loot').onclick=()=>{if(game.takeLoot()){sound.play('purchase');renderPhase();}};
  $('recycle-loot').onclick=()=>{if(game.takeLoot(true)){sound.play('pickup');renderPhase();}};
}
function updateHUD(){
  const p=game.player;$('health-fill').style.width=`${Math.max(0,p.hp/p.maxHP*100)}%`;$('health-value').textContent=`${Math.ceil(p.hp)} / ${p.maxHP}`;
  $('wave').textContent=`第 ${Math.max(1,game.wave)} / ${MAX_WAVES} 波`;
  $('time').textContent=game.phase==='battle'?`${Math.max(0,Math.ceil(game.duration-game.elapsed))} 秒`:{ready:'准备出发',paused:'休息一下',shop:'休整时间',upgrade:'选择升级',loot:'战利品',dying:'冒险结束',won:'守住花园',lost:'冒险结束'}[game.phase]||'';
  $('coins').textContent=game.coins;$('damage').textContent=game.weapons[0]?game.damageFor(game.weapons[0]):0;$('armor').textContent=p.armor;$('kills').textContent=game.kills;$('correct').textContent=game.correct;
  $('level').textContent=`LV ${game.level}`;$('xp-fill').style.width=`${game.xp/xpRequired(game.level)*100}%`;
  $('weapon-count').textContent=`${game.weapons.length} / ${game.maxWeapons}`;
  $('weapons').innerHTML=game.weapons.map(instance=>{const o=weapon(instance);return `<span class="gear" title="${o.name} · ${tierNames[o.tier]}" aria-label="${o.name} · ${tierNames[o.tier]}" style="border-color:${tierColors[o.tier]}">${itemArt(o.id)}</span>`;}).join('');
  $('items').innerHTML=game.inventory.filter(o=>o.kind==='item').map(o=>`<span class="gear" title="${o.name}：${o.detail}" aria-label="${o.name}" style="color:${o.color}">${itemArt(o.id)}</span>`).join('')||'<span class="empty">出发后到商店挑选</span>';
}
// Draw the editable answer as raised letter blocks and recessed empty slots.
// Every slot is rendered at once in reading order and layoutTiles() chooses one
// single-row size, so a long word pans horizontally instead of paging or
// wrapping. Fixed separators (spaces, hyphens, apostrophes) render as labels.
function renderBoard(word,state,{judged=false}={}){
  if(!word)return;
  const expected=[...word.english];
  const firstEmpty=state.slots.indexOf(null);
  let wrongIndex=-1;
  if(judged){
    let slot=0;
    for(let i=0;i<expected.length;i++){
      if(fixed(expected[i]))continue;
      const id=state.slots[slot++],letter=id==null?'':(tileById(state.bank,id)?.letter||'');
      if(letter&&letter!==expected[i].toLowerCase()){wrongIndex=i;break;}
    }
  }
  let cursor=0,html='';
  for(let i=0;i<expected.length;i++){
    const char=expected[i];
    if(fixed(char)){html+=`<span class="fixed-letter" data-letter="${i}" aria-hidden="true">${escape(char)}</span>`;continue;}
    const index=cursor++;
    const id=state.slots[index],letter=id==null?'':(tileById(state.bank,id)?.letter||'');
    if(letter)html+=`<button type="button" class="answer-slot occupied${i===wrongIndex?' bad-letter':''}" data-slot="${index}" data-letter="${i}" aria-label="移除字母 ${escape(letter.toUpperCase())}">${escape(letter)}</button>`;
    else html+=`<button type="button" class="answer-slot empty${index===firstEmpty?' next-slot':''}${i===wrongIndex?' bad-letter':''}" data-slot="${index}" aria-label="空位 ${index+1}"></button>`;
  }
  $('letter-board').innerHTML=html;
  $('answer-board').classList.toggle('wrong',wrongIndex>=0);
  $('answer-board').setAttribute('aria-invalid',String(wrongIndex>=0));
}
function spellingState(offer){
  const word=offer.word.english;
  if(!offer.labTiles||offer.labTiles.word!==word)offer.labTiles={word,bank:createTileBank(word),slots:createSlots(word),judged:false};
  return offer.labTiles;
}
function currentOffer(){const c=game.challenge;return c?game.offers[c.index]:null;}
function renderTileBank(bank){
  $('letter-bank').innerHTML=bank.map(tile=>`<button type="button" class="tile" data-tile="${escape(tile.id)}" data-letter="${escape(tile.letter)}">${escape(tile.letter)}</button>`).join('');
}
function refreshSpelling(offer,state){
  const word=offer.word,count=editableLetters(word.english).length;
  renderBoard(word,state,{judged:state.judged});
  const locked=interactionsLocked();
  for(const button of $('letter-bank').querySelectorAll('button.tile')){
    const used=state.slots.includes(button.dataset.tile);
    button.disabled=used||locked;button.classList.toggle('used',used);button.setAttribute('aria-disabled',String(used||locked));
  }
  const filled=state.slots.filter(Boolean).length;
  $('answer-board').setAttribute('aria-label',`拼写答案：共 ${count} 个字母，已选择 ${filled} 个`);
  layoutTiles(offer);
}
// Pick one single-row geometry for the answer and the bank from their own real
// inner widths. Every rendered answer cell (fixed separators included) counts,
// and the gap tightens with the row so short words never wrap. Words over 20
// cells keep a clear tappable tile and scroll horizontally instead. Only CSS
// custom properties and the .tile-scroll class change here; the answer DOM is
// never rebuilt on resize, so an in-progress pointer drag keeps its capture.
let tileScrollMode=false;
function layoutTiles(offer){
  const work=document.querySelector('.spell-work');
  if(!offer||!work||!work.getClientRects().length)return;
  const bank=$('letter-bank'),board=$('letter-board'),word=offer.word;
  const bankWidth=bank.clientWidth,boardWidth=board.clientWidth;
  if(!bankWidth||!boardWidth)return;
  const answerCount=[...word.english].length,bankCount=editableLetters(word.english).length;
  const answer=singleRowLayout({width:boardWidth,count:answerCount});
  const letters=singleRowLayout({width:bankWidth,count:bankCount});
  const shared=sharedRowLayout(answer,letters);
  tileScrollMode=shared.scroll;
  work.classList.toggle('tile-scroll',shared.scroll);
  // Set on the dialog so the .tile-ghost top-layer child inherits the geometry too.
  dialog.style.setProperty('--tile-size',`${shared.size}px`);
  dialog.style.setProperty('--tile-gap',`${shared.gap}px`);
  dialog.style.setProperty('--tile-font',`${tileFontSize(shared.size)}px`);
}
function refreshClue(){
  const c=game.challenge;if(!c)return;
  const english=maskExample(c.word.example,c.word.english),chinese=maskExample(c.word.exampleChinese,c.word.english),meaning=c.word.chinese,phonetic=c.word.pronunciation||'';
  $('meaning').textContent=meaning;$('phonetic').textContent=phonetic;
  $('example').textContent=english;$('example-zh').textContent=chinese;
}
// Observe only the fixed-size work column. Relayout sets CSS variables and never
// rebuilds the answer slots, so a drag in progress keeps its pointer capture.
const tileResize=new ResizeObserver(()=>{const o=currentOffer();if(o?.labTiles&&dialog.open)layoutTiles(o);});
tileResize.observe(document.querySelector('.spell-work'));
compactViewport.addEventListener('change',()=>{const wasAchievements=screen.classList.contains('achievements-screen');if(wasAchievements)renderAchievements();else renderPhase();const o=currentOffer();if(o&&dialog.open){layoutTiles(o);redrawSpellPhoto?.();}});
let redrawSpellPhoto;
new ResizeObserver(()=>redrawSpellPhoto?.()).observe($('spell-photo'));
function openSpelling(){
  stopPronunciation();
  const c=game.challenge,o=game.offers[c.index],state=spellingState(o);
  state.judged=false;
  $('spell-title').textContent=o.name;$('purchase-icon').innerHTML=itemArt(o.id);$('purchase-icon').style.color=o.color;$('purchase-price').textContent=`${o.price} 金币`;
  refreshClue();
  renderTileBank(state.bank);$('spell-feedback').textContent='';$('spell-feedback').className='spell-feedback';refreshSpelling(o,state);
  document.querySelector('.meaning-copy').scrollLeft=0;document.querySelector('.learning-examples').scrollLeft=0;
  resetInput();dialog.showModal();refreshSpelling(o,state);redrawSpellPhoto=spellingPhoto($('spell-photo'),$('spell-photo-image'),$('spell-photo-focus'),c.word);
  refreshExperienceSkip();
  requestAnimationFrame(()=>layoutTiles(o));
  // A restored full draft (continue or reopen) settles without another tap.
  maybeAutoJudge();
}
function closeSpelling(){cancelAnswerDrag();tileScrollMode=false;redrawSpellPhoto=null;$('spell-photo-image').removeAttribute('src');stopPronunciation();dialog.close();}
const gemLayer=$('spell-particles');
const hasPopover=typeof gemLayer.showPopover==='function';
let particleCount=0;
function animateReward(element,frames,duration){
  if(particleCount>=120)return;
  gemLayer.append(element);particleCount++;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const animation=element.animate(reduced?[{opacity:1},{opacity:0}]:frames,{duration:reduced?180:duration,easing:'cubic-bezier(.25,.6,.6,1)',fill:'forwards'});
  const remove=()=>{element.remove();particleCount--;if(!particleCount){if(hasPopover&&gemLayer.matches(':popover-open'))gemLayer.hidePopover();else gemLayer.classList.remove('fallback-open');}};
  animation.onfinish=remove;animation.oncancel=remove;
}
function dropSpellingGems(indices,earned){
  if(!indices?.length)return;
  // A transparent top-layer overlay lets the final letter's gems finish after purchase closes the prompt.
  if(hasPopover){if(!gemLayer.matches(':popover-open'))gemLayer.showPopover();}
  else {if(dialog.open&&gemLayer.parentNode!==dialog)dialog.append(gemLayer);gemLayer.classList.add('fallback-open');}
  const found=indices.map(i=>$('letter-board').querySelector(`[data-letter="${i}"]`)?.getBoundingClientRect()).filter(rect=>rect&&rect.width>0);
  // A wrapped long word may push a settled slot out of the measured box; if no
  // matching slot reports a box, still send the gems up from the board.
  const origins=found.length?found:[$('answer-board').getBoundingClientRect()].filter(rect=>rect.width>0);
  for(const rect of origins)for(let j=0;j<3;j++){
    const gem=document.createElement('i');gem.className='spelling-gem';gem.style.left=`${rect.x+rect.width/2-6}px`;gem.style.top=`${rect.y+rect.height/2-6}px`;
    const drift=(Math.random()-.5)*80,fall=Math.min(170,Math.max(60,innerHeight-rect.bottom-20));
    animateReward(gem,[{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:`translate(${drift/3}px,-16px) rotate(45deg)`,opacity:1,offset:.2},{transform:`translate(${drift}px,${fall}px) rotate(180deg)`,opacity:0}],650+Math.random()*200);
  }
  if(earned&&origins.length){
    const rect=origins[origins.length-1],label=document.createElement('span');label.className='coin-reward';label.textContent=`+${earned} 金币`;
    label.style.left=`${Math.max(8,Math.min(innerWidth-90,rect.x-20))}px`;label.style.top=`${rect.y-24}px`;
    animateReward(label,[{transform:'translateY(0)',opacity:1},{transform:'translateY(-35px)',opacity:0}],1000);
  }
}
function beginSpellEdit(offer,state,placed=false){
  state.judged=false;
  $('spell-feedback').textContent='';$('spell-feedback').className='spell-feedback';
  refreshSpelling(offer,state);
  if(placed)letterPlaced();
  maybeAutoJudge();
}
// A complete draft settles by itself: the freshly placed last tile refreshes the
// board and plays its slot feedback first, then judging runs immediately with no
// separate confirmation step or countdown.
function maybeAutoJudge(){
  if(interactionsLocked())return;
  const offer=currentOffer();
  if(!offer||!dialog.open)return;
  const state=spellingState(offer);
  if(!isFull(state.bank,state.slots,offer.word.english))return;
  judgeSpelling(offer,state);
}
function judgeSpelling(offer,state){
  if(state.judged||interactionsLocked())return;
  const current=game.challenge;
  if(!current||game.offers[current.index]!==offer||!isFull(state.bank,state.slots,offer.word.english))return;
  state.judged=true;
  const result=game.submitSpelling(proposedFrom(state.bank,state.slots));
  if(result.status==='incomplete'){state.judged=false;refreshSpelling(offer,state);return;}
  if(result.status==='purchased'){
    dropSpellingGems(result.letters,result.earned);if(result.letters?.length)sound.play('spell');sound.play('purchase');
    const name=result.offer.name,rebate=result.rebate;delete offer.labTiles;closeSpelling();renderShop();updateHUD();toast(`拼对了！${name} 已放入口袋，经验 +1，累计返还 ${rebate} 金币。`);checkpoint();return;
  }
  if(result.status==='unavailable'){delete offer.labTiles;closeSpelling();renderShop();updateHUD();toast('材料不足，请重新选择。');checkpoint();return;}
  // A complete wrong draft settles as a failed purchase: keep the proportional
  // rebate, show the answer once and return to the shop.
  if(result.letters?.length){dropSpellingGems(result.letters,result.earned);sound.play('spell');}else sound.play('wrong');
  const word=result.offer.word;delete offer.labTiles;closeSpelling();renderShop();updateHUD();
  toast(`购买失败。正确拼写：${word.english}（${word.chinese}）。`);
  checkpoint();
}
// Pointer dragging of an occupied answer block stably inserts it at the drop
// position: the source is removed and only the entries between source and target
// shift one place, keeping their mutual order (gaps shift as entries too).
// Tapping still returns the tile to the bank; a completed drag suppresses the
// follow-up click so the moved tile is not also removed.
const dragState={pointerId:null,fromIndex:-1,startX:0,startY:0,active:false,suppressUntil:0};
let dragGhost=null;
function clearDragVisuals(){
  document.querySelectorAll('#letter-board .answer-slot.dragging,#letter-board .answer-slot.drop-target').forEach(node=>node.classList.remove('dragging','drop-target'));
  if(dragGhost){dragGhost.remove();dragGhost=null;}
}
function cancelAnswerDrag(){
  dragState.pointerId=null;dragState.fromIndex=-1;dragState.active=false;
  clearDragVisuals();
}
function answerSlotFromPoint(x,y){
  const node=document.elementFromPoint(x,y);
  return node?.closest?.('button.answer-slot')||null;
}
function finishAnswerDrag(commit,event){
  const offer=currentOffer();
  if(dragState.active&&offer&&!interactionsLocked()){
    dragState.suppressUntil=performance.now()+400;
    if(commit&&event){
      const target=answerSlotFromPoint(event.clientX,event.clientY),index=target?Number(target.dataset.slot):-1;
      if(index>=0&&index!==dragState.fromIndex){const state=spellingState(offer),next=moveSlot(state.slots,dragState.fromIndex,index);if(next!==state.slots){state.slots=next;cancelAnswerDrag();beginSpellEdit(offer,state,true);return;}}
    }
  }
  cancelAnswerDrag();
}
$('letter-board').addEventListener('pointerdown',event=>{
  if(interactionsLocked()||dragState.pointerId!==null||(event.button!==undefined&&event.button!==0))return;
  // A long row scrolls horizontally under the finger instead of reordering.
  // Mouse users keep drag-to-reorder on every word; touch reorder stays for
  // short words, where there is no horizontal scroll to protect.
  if(tileScrollMode&&event.pointerType!=='mouse')return;
  const button=event.target.closest?.('button.answer-slot.occupied');if(!button)return;
  dragState.pointerId=event.pointerId;dragState.fromIndex=Number(button.dataset.slot);
  dragState.startX=event.clientX;dragState.startY=event.clientY;dragState.active=false;dragState.suppressUntil=0;
  try{button.setPointerCapture(event.pointerId);}catch{}
});
$('letter-board').addEventListener('pointermove',event=>{
  if(event.pointerId!==dragState.pointerId)return;
  const dx=event.clientX-dragState.startX,dy=event.clientY-dragState.startY;
  if(!dragState.active&&Math.hypot(dx,dy)<6)return;
  if(!dragState.active){
    dragState.active=true;
    const source=$('letter-board').querySelector(`button.answer-slot[data-slot="${dragState.fromIndex}"]`);
    source?.classList.add('dragging');
    // The showModal() dialog lives in the top layer, so the ghost must be its
    // child to stay visible above the dialog while following the pointer.
    if(source){dragGhost=document.createElement('span');dragGhost.className='tile-ghost';dragGhost.textContent=source.textContent;dragGhost.setAttribute('aria-hidden','true');const size=parseFloat(getComputedStyle(source).width)||44;dragGhost.style.width=`${size}px`;dragGhost.style.height=`${size}px`;dialog.append(dragGhost);}
  }
  if(event.cancelable)event.preventDefault();
  if(dragGhost){dragGhost.style.left=`${event.clientX}px`;dragGhost.style.top=`${event.clientY}px`;}
  const target=answerSlotFromPoint(event.clientX,event.clientY),index=target?Number(target.dataset.slot):-1;
  document.querySelectorAll('#letter-board .answer-slot.drop-target').forEach(node=>node.classList.remove('drop-target'));
  if(index>=0&&index!==dragState.fromIndex)target.classList.add('drop-target');
});
$('letter-board').addEventListener('pointerup',event=>{if(event.pointerId!==dragState.pointerId)return;finishAnswerDrag(true,event);});
$('letter-board').addEventListener('pointercancel',event=>{if(event.pointerId!==dragState.pointerId)return;finishAnswerDrag(false,null);});
$('letter-board').addEventListener('lostpointercapture',event=>{if(event.pointerId!==dragState.pointerId)return;if(dragState.active)finishAnswerDrag(false,null);else cancelAnswerDrag();});
$('letter-board').addEventListener('click',event=>{
  if(performance.now()<dragState.suppressUntil){dragState.suppressUntil=0;event.preventDefault();event.stopPropagation();return;}
  if(interactionsLocked())return;
  const button=event.target.closest?.('button.answer-slot.occupied');if(!button)return;
  const offer=currentOffer();if(!offer)return;const state=spellingState(offer);
  state.slots=returnTile(state.slots,Number(button.dataset.slot));
  beginSpellEdit(offer,state);
});
$('letter-bank').addEventListener('click',event=>{
  if(interactionsLocked())return;
  const button=event.target.closest?.('button.tile');if(!button||button.disabled)return;
  const offer=currentOffer();if(!offer)return;const state=spellingState(offer);
  const next=useTile(state.bank,state.slots,button.dataset.tile);
  const placed=next!==state.slots;
  if(placed)state.slots=next;
  beginSpellEdit(offer,state,placed);
});
$('skip-spelling').onclick=()=>{
  const event=game.requestExperienceSkip();
  if(!event){refreshExperienceSkip();return;}
  $('spell-feedback').textContent='正在结算经验…';$('spell-feedback').className='spell-feedback';checkpoint();
};
$('hear-word').addEventListener('pointerdown',event=>event.preventDefault());
$('hear-word').onclick=()=>pronounceCurrentWord();
document.addEventListener('pointerdown',()=>sound.unlock(),{capture:true});
document.addEventListener('keydown',()=>sound.unlock(),{capture:true});
if(window.webkit?.messageHandlers?.labAudio)sound.unlock();
// Letter-bank tiles already play their own slot effect on a successful placement,
// so the generic click stays off them; returning an answer block keeps its click.
document.addEventListener('click',event=>{const button=event.target.closest?.('button');if(button&&!button.disabled&&button.id!=='hear-word'&&!button.closest('#letter-bank'))sound.play('click');},{capture:true});
$('spell-cancel').onclick=()=>{if(interactionsLocked())return;game.cancelPurchase();closeSpelling();renderShop();updateHUD();};
dialog.addEventListener('cancel',event=>{if(interactionsLocked()){event.preventDefault();return;}stopPronunciation();game.cancelPurchase();renderShop();updateHUD();});
$('pause').onclick=()=>{if(game.phase==='paused'){game.resume();renderPhase();}else pause();};
$('exit').onclick=async()=>{
  pause();
  if(!await savedRun.flush())return;
  if(window.PICLEX_PUBLIC_WEB){if(parent===window)location.href='../#/settings';else parent.postMessage({type:'piclex-lab-exit'},location.origin);return;}
  if(window.webkit?.messageHandlers?.labClose){window.webkit.messageHandlers.labClose.postMessage('close');return;}
  if(location.pathname.startsWith('/lab/')){location.href='../#settings';return;}
  screen.innerHTML='<div class="cover"><h1>实验室</h1><p>第一款小游戏 · 薯薯求生</p><button id="return-game" class="primary">返回游戏</button></div>';$('return-game').onclick=renderPhase;
};
const moving=new Set(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d']);
window.addEventListener('keydown',e=>{
  if(dialog.open||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
  const key=e.key.toLowerCase();if(moving.has(key)&&game.phase==='battle'){e.preventDefault();keys.add(key);}
  if(e.key==='Escape'){e.preventDefault();if(game.phase==='paused'){game.resume();renderPhase();}else pause();}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',pause);
window.addEventListener('blur',cancelAnswerDrag);
window.addEventListener('resize',()=>{cancelAnswerDrag();const o=currentOffer();if(o?.labTiles&&dialog.open)layoutTiles(o);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnswerDrag();pause();}last=0;});
// Safari can ignore viewport scaling restrictions; cancel only zoom gestures,
// Panels use explicit pages in landscape; gameplay gestures never select text.
const preventZoom=event=>{if(event.touches?.length>1||event.type.startsWith('gesture'))event.preventDefault();};
document.addEventListener('touchstart',preventZoom,{passive:false});
document.addEventListener('touchmove',preventZoom,{passive:false});
document.addEventListener('gesturestart',preventZoom,{passive:false});
document.addEventListener('gesturechange',preventZoom,{passive:false});
window.addEventListener('pagehide',pause);
document.addEventListener('click',checkpoint);
document.addEventListener('pointerup',()=>queueMicrotask(checkpoint));
function movePointer(e){
  if(e.pointerId!==pointer.id)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y,len=Math.max(35,Math.hypot(dx,dy));
  stick.x=dx/len;stick.y=dy/len;$('stick').style.transform=`translate(${stick.x*27}px,${stick.y*27}px)`;
}
stage.addEventListener('pointerdown',e=>{
  if(game.phase!=='battle'||pointer.id!==null)return;e.preventDefault();pointer.id=e.pointerId;pointer.x=e.clientX;pointer.y=e.clientY;stage.setPointerCapture(e.pointerId);
  const r=stage.getBoundingClientRect();$('joystick').style.left=`${Math.max(0,Math.min(r.width-96,e.clientX-r.left-48))}px`;$('joystick').style.top=`${Math.max(0,Math.min(r.height-96,e.clientY-r.top-48))}px`;$('joystick').classList.add('active');
});
stage.addEventListener('pointermove',movePointer);
for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,e=>{if(e.pointerId===pointer.id)resetInput();});

function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function material(g){
  const attracted=Number.isFinite(g.attractTime),d=Math.hypot(g.x-game.player.x,g.y-game.player.y);
  const progress=attracted?1-Math.min(1,d/Math.max(1,game.player.magnet)):0;
  const size=24*(1-.45*progress);
  ctx.save();
  if(attracted&&Number.isFinite(g.trailX)&&Number.isFinite(g.trailY)){
    ctx.strokeStyle=`rgba(232,198,116,${.25+.5*progress})`;ctx.lineWidth=2+2*progress;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(g.trailX,g.trailY);ctx.lineTo(g.x,g.y);ctx.stroke();
  }
  ctx.globalAlpha=1-.3*progress;ellipse(g.x,g.y+5*(1-progress),7*(1-progress*.45),3*(1-progress*.45),'#0007');drawProp(ctx,'material',g.x,g.y,size);ctx.restore();
}
function potato(x,y,time=0){
  const p=game.player;
  ctx.save();ctx.translate(x,y);
  if(p.invulnerable>0&&Math.floor(p.invulnerable*14)%2)ctx.globalAlpha=.85;
  if(!playerSprite(ctx,0,0,p)){ellipse(0,0,p.r,p.r*1.3,'#82633c');ellipse(-3,-2,1.5,2,'#d6ac55');ellipse(3,-2,1.5,2,'#d6ac55');}
  ctx.restore();
}
function draw(){
  const w=game.width,h=game.height,t=game.elapsed;ctx.clearRect(0,0,w,h);ctx.fillStyle='#5b5953';ctx.fillRect(0,0,w,h);
  const shade=ctx.createRadialGradient(w*.5,h*.5,Math.min(w,h)*.12,w*.5,h*.5,Math.max(w,h)*.7);shade.addColorStop(0,'#0000');shade.addColorStop(1,'#18171426');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#9c77353d';ctx.lineWidth=3;ctx.strokeRect(3,3,w-6,h-6);
  for(const g of game.gems)if(!Number.isFinite(g.attractTime))material(g);
  for(const corpse of game.corpses){ctx.globalAlpha=Math.min(1,(overrides.corpseSeconds-corpse.animationTime)/.3);enemySprite(ctx,corpse);ctx.globalAlpha=1;}
  for(const e of game.enemies){ellipse(e.x,e.y+e.r*.8,e.r,e.r*.32,'#0008');enemyHalo(ctx,e);if(e.burn)ellipse(e.x,e.y,e.r*1.2,e.r*1.2,'#e7833238');}
  ellipse(game.player.x,game.player.y+16,16,5,'#0009');
  playerHalo(ctx,game.player.x,game.player.y,game.player.r);
  for(const h of game.heals){ellipse(h.x,h.y+10,12,4,'#0007');drawProp(ctx,h.kind,h.x,h.y,h.kind==='fruit'?34:40);}
  for(const e of game.enemies){
    if(e.warning>0){
      const size=e.boss?18:11;
      ctx.lineCap='round';ctx.beginPath();ctx.moveTo(e.x-size,e.y-size);ctx.lineTo(e.x+size,e.y+size);ctx.moveTo(e.x+size,e.y-size);ctx.lineTo(e.x-size,e.y+size);
      ctx.strokeStyle='#171310';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle=e.boss?'#ff776f':'#e3b96e';ctx.lineWidth=4;ctx.stroke();ctx.lineCap='butt';continue;
    }
    if(e.neutral){drawProp(ctx,'tree',e.x,e.y-12,64);continue;}
    if(e.chargeWarmup>0){ctx.strokeStyle='#ffcf79';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+8,0,Math.PI*2);ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+e.aim.x*34,e.y+e.aim.y*34);ctx.stroke();}
    if(!enemySprite(ctx,e)){ellipse(e.x,e.y,e.r,e.r,'#746658');ellipse(e.x-4,e.y-2,2,2,'#d09c49');ellipse(e.x+4,e.y-2,2,2,'#d09c49');}
  }
  for(const b of game.enemyBullets){ellipse(b.x,b.y,7,7,'#912b29');ellipse(b.x,b.y,4,4,'#ffc79f');}
  for(const b of game.bullets){
    if(drawPulse(ctx,b))continue;
    if(b.lightning){ctx.strokeStyle='#b8f7ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x-b.dx*.012,b.y-b.dy*.012);ctx.lineTo(b.x-b.dy*.003,b.y+b.dx*.003);ctx.lineTo(b.x,b.y);ctx.stroke();}
    else {ellipse(b.x,b.y,5,5,'#a66d294d');ellipse(b.x,b.y,3,3,'#f3ce83');}
  }
  for(const e of game.explosions)drawExplosion(ctx,e);
  const p=game.player;
  potato(p.x,p.y,t);
  // Attracted materials pass over the player sprite as they shrink into its
  // centre, making the collection path readable even during a close pass.
  for(const g of game.gems)if(Number.isFinite(g.attractTime))material(g);
  if(game.phase!=='dying')game.weapons.forEach((instance,i)=>{
    const id=weaponInstance(instance).id,w=weapon(instance),pose=game.weaponPoses[i]||weaponPose(p,i,game.weapons.length,null,id);
    const kick=(game.weaponKicks[i]||0)/overrides.weaponRecoilSeconds,melee=w.type==='melee';
    const motion=melee?Math.sin(kick*Math.PI)*12:-kick*overrides.weaponRecoilDistance;
    const swing=melee&&w.stats.attack_type===1?Math.sin(kick*Math.PI)*Math.PI*.6:0;
    ctx.save();ctx.translate(pose.x+Math.cos(pose.angle)*motion,pose.y+Math.sin(pose.angle)*motion);ctx.rotate(pose.rotation+swing);
    drawItem(ctx,id,0,0,28);
    ctx.restore();
    if(game.weaponKicks[i]>0&&weapon(instance).type==='ranged'){ellipse(pose.muzzle.x,pose.muzzle.y,4,4,'#f4c55c99');ellipse(pose.muzzle.x,pose.muzzle.y,2,2,'#fff5c8');}
  });
  for(const s of game.particles){ctx.globalAlpha=Math.min(1,s.life*3);ctx.fillStyle=s.color;ctx.fillRect(s.x,s.y,3,3);}ctx.globalAlpha=1;
  for(const number of game.damageNumbers)drawDamageNumber(ctx,number);
}
void loadArtwork(draw);
function tick(time){
  const dt=last?(time-last)/1000:0;last=time;
  if(!document.hidden){
    const x=stick.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
    const y=stick.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    const active=game.phase==='battle'||game.phase==='dying';
    if(active){
      const previous={coins:game.coins,level:game.level,heals:game.healPickups,x:game.player.x,y:game.player.y};
      game.update(dt,{x,y});
      for(const name of game.audioEvents.splice(0))sound.play(name);
      if(savedProgress.saveFailed()&&!saveNotice){saveNotice=true;toast('进度保存失败，请检查浏览器存储权限。');}
      if(game.phase==='battle'&&(game.coins>previous.coins||game.healPickups>previous.heals))sound.play('pickup');
      if(game.level>previous.level)sound.play('level');
      if(Math.hypot(game.player.x-previous.x,game.player.y-previous.y)>.05&&sound.play(stepSide?'step-a':'step-b'))stepSide=!stepSide;
      draw();hudClock+=dt;
    }
    if(game.newUnlocks.length>unlockNotices){achievementNotices.enqueue(game.newUnlocks.slice(unlockNotices));unlockNotices=game.newUnlocks.length;}
    achievementNotices.update(dt,game.phase==='paused'||sound.blocked||dialog.open||screen.classList.contains('achievements-screen'));
    if(game.phase!==phase){resetInput();renderPhase();checkpoint();}
    saveClock+=dt;if(saveClock>=1){saveClock=0;checkpoint();}
    if(active&&hudClock>.1){updateHUD();hudClock=0;}
  }
  requestAnimationFrame(tick);
}
async function loadWords(){
  // Native injects text only. The existing phone LAN route remains paired.
  if(window.PICLEX_LAB_EXPORT||Array.isArray(window.PICLEX_LAB_WORDS)||!location.pathname.startsWith('/lab/'))return;
  wordLoadPending=true;renderPhase();
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),4000);
  try{const response=await fetch('/api/lab/words',{signal:controller.signal,credentials:'same-origin'});if(response.ok){const data=await response.json();words=eligibleWords(data.words);}}
  catch{}finally{clearTimeout(timeout);wordLoadPending=false;if(game.phase==='ready')restart();}
}
renderPhase();fit();mountLandscapePrompt({prompt:$('rotate-device'),pause});$('rotation-exit').onclick=()=>$('exit').click();requestAnimationFrame(tick);void loadWords();

// Finish the existing checkpoint before the enclosing App tab unmounts the game.
window.addEventListener('message',async event=>{if(!window.PICLEX_PUBLIC_WEB||event.origin!==location.origin||event.source!==parent||event.data?.type!=='piclex-lab-leave')return;pause();if(await savedRun.flush())parent.postMessage({type:'piclex-lab-exit'},location.origin);else toast('本轮存档未保存，请稍后再返回。');});
