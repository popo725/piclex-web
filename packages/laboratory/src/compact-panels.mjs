import { weapon, weaponInstance, tierNames, tierColors, describeEffects } from './content.mjs';
import { canCombine, recyclePrice } from './rules.mjs';
import { achievements, achievementValue, achievementGroups, achievementList } from './progress.mjs';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function pageOf(values,page,size){
  const count=Math.max(1,Math.ceil(values.length/size)),index=Math.max(0,Math.min(count-1,page));
  return {values:values.slice(index*size,(index+1)*size),index,count};
}
// Preserve every character; long descriptions are read with explicit page buttons.
export function textPages(text,size=88){
  const chars=Array.from(String(text)),pages=[];
  while(chars.length)pages.push(chars.splice(0,size).join(''));
  return pages.length?pages:[''];
}
const pager=(id,page)=>`<nav class="page-controls" aria-label="分页"><button id="${id}-prev" class="secondary" ${page.index===0?'disabled':''}>上一页</button><span>${page.index+1} / ${page.count}</span><button id="${id}-next" class="secondary" ${page.index+1===page.count?'disabled':''}>下一页</button></nav>`;

export class CompactPanels {
  constructor(screen,actions){this.screen=screen;this.actions=actions;this.ownedPage=0;this.ownedKind='weapon';this.achievementPage=0;this.achievementGroup='起步';this.resultPage=0;}
  get game(){return this.actions.game();}
  bind(id,fn){this.screen.querySelector('#'+id)?.addEventListener('click',fn);}
  pageButtons(id,page,fn){this.bind(id+'-prev',()=>fn(page.index-1));this.bind(id+'-next',()=>fn(page.index+1));}
  renderShop(){
    const g=this.game,a=this.actions,s=this.screen;
    s.className='screen shop-screen';
    const owned=this.ownedKind==='weapon'?g.weapons.map((w,i)=>({id:weapon(w).id,name:weapon(w).name,index:i})):g.inventory.filter(o=>o.kind==='item').map((o,i)=>({...o,index:i}));
    const ownedPage=pageOf(owned,this.ownedPage,4);this.ownedPage=ownedPage.index;
    s.innerHTML=`<div class="shop compact-shop"><header class="shop-header"><div class="shop-identity"><button id="shop-exit" class="quiet" aria-label="返回实验室">‹</button><div><h2>路边小店</h2><span>${a.coinArt} ${g.coins} · 第 ${g.wave} 波完成</span></div></div><div class="compact-shop-tabs"><button id="owned-kind" class="secondary">${this.ownedKind==='weapon'?`武器 ${g.weapons.length}/${g.maxWeapons}`:`道具 ${owned.length}`} ⇄</button><button id="shop-stats" class="secondary">属性与套装</button></div></header><div class="shop-grid">${g.offers.map((o,i)=>{
      const full=o.kind==='weapon'&&g.weapons.length>=g.maxWeapons&&!g.canBuy({...o,price:0}),insufficient=o.status==='available'&&!full&&g.coins<o.price;
      const status=o.status==='purchased'?'已带走 ✓':o.status==='failed'?'购买失败':full?'武器已满':`${a.coinArt} ${o.price}`;
      return `<article class="offer-slot ${o.status}" aria-label="${escape(o.name)}" style="--rarity:${tierColors[o.tier||1]}"><div class="offer ${o.status}"><div class="offer-top"><span class="offer-icon" aria-hidden="true">${a.itemArt(o.id)}</span><strong>${escape(o.name)} <span class="tier">${tierNames[o.tier||1]}</span></strong></div><small class="offer-detail">${escape(o.detail).split(' · ').map(part=>`<span>${part}</span>`).join('')}</small></div><button class="offer-buy" data-offer="${i}" ${g.canBuy(o)?'':'disabled'} aria-label="${escape(o.name)}，${o.status==='available'?'拼词购买':'购买结果'}，${o.price} 金币"><span class="offer-price${insufficient?' insufficient-funds':''}"${insufficient?` role="img" aria-label="价格 ${o.price} 金币，金币不足"`:''}>${o.status==='available'&&!full?'拼词购买 · ':''}${status}</span></button><div class="offer-tools"><button class="secondary offer-inspect" data-inspect-offer="${i}">详情</button><button class="offer-lock ${o.locked?'locked':''}" data-lock="${i}" aria-pressed="${!!o.locked}" ${o.status==='available'?'':'disabled'}>${o.locked?'已锁定':'锁定'}</button></div></article>`;
    }).join('')}</div><footer class="compact-shop-footer"><div class="owned-strip" aria-label="${this.ownedKind==='weapon'?'随身武器':'随身道具'}"><button id="owned-prev" class="secondary" aria-label="上一页装备" ${ownedPage.index===0?'disabled':''}>‹</button>${ownedPage.values.map(o=>`<button class="owned-icon" data-owned="${o.index}" aria-label="${escape(o.name)}详情">${a.itemArt(o.id)}</button>`).join('')}${!owned.length?'<span class="empty">暂无道具</span>':''}<button id="owned-next" class="secondary" aria-label="下一页装备" ${ownedPage.index+1===ownedPage.count?'disabled':''}>›</button></div><button id="refresh-shop" class="shop-refresh" ${g.coins<g.refreshPrice?'disabled':''}>换一批 · ${g.refreshPrice}</button><button id="next-wave" class="primary">下一波 →</button></footer></div>`;
    s.querySelectorAll('[data-offer]').forEach(b=>b.onclick=()=>{if(g.beginPurchase(Number(b.dataset.offer)))a.openSpelling();});
    s.querySelectorAll('[data-lock]').forEach(b=>b.onclick=()=>{if(g.toggleLock(Number(b.dataset.lock)))this.renderShop();});
    s.querySelectorAll('[data-inspect-offer]').forEach(b=>b.onclick=()=>this.renderInspect('offer',Number(b.dataset.inspectOffer)));
    s.querySelectorAll('[data-owned]').forEach(b=>b.onclick=()=>this.renderInspect(this.ownedKind,Number(b.dataset.owned)));
    this.bind('owned-kind',()=>{this.ownedKind=this.ownedKind==='weapon'?'item':'weapon';this.ownedPage=0;this.renderShop();});
    this.bind('owned-prev',()=>{this.ownedPage--;this.renderShop();});this.bind('owned-next',()=>{this.ownedPage++;this.renderShop();});
    this.bind('shop-stats',()=>this.renderInspect('stats',0));this.bind('shop-exit',a.exit);
    this.bind('refresh-shop',()=>{if(g.refreshShop()){this.renderShop();a.updateHUD();}});this.bind('next-wave',a.start);
  }
  renderInspect(kind,index,page=0){
    const g=this.game,a=this.actions,s=this.screen;
    const item=kind==='weapon'?weapon(g.weapons[index]):kind==='item'?g.inventory.filter(o=>o.kind==='item')[index]:kind==='offer'?g.offers[index]:null;
    if(kind!=='stats'&&!item){this.renderShop();return;}
    const copy=kind==='stats'?[`生命上限 ${g.player.maxHP}`,`护甲 ${g.player.armor}`,`伤害加成 ${g.player.damage}`,...Object.entries(g.stats).filter(([,v])=>v).map(([key,value])=>describeEffects([{key,value:Math.round(value*100)/100}])),...Object.entries(g.setCounts).map(([key,n])=>`${key}套装 ${n} 件`)]:textPages(item.detail||describeEffects(item.effects||[]),42);
    const pages=pageOf(copy,page,kind==='stats'?4:2);
    s.className='screen inspect-screen';s.innerHTML=`<section class="inspect-panel"><header class="shop-header"><h2>${kind==='stats'?'属性与套装':escape(item.name)}</h2><button id="inspect-back" class="secondary">返回商店</button></header><div class="inspect-content"><div class="inspect-identity">${item?a.itemArt(item.id):''}<strong>${item?escape(tierNames[item.tier||1]):`LV ${g.level}`}</strong></div><div class="inspect-copy">${pages.values.map(p=>`<p>${escape(p)}</p>`).join('')}</div></div>${pager('inspect',pages)}<footer class="inspect-actions">${kind==='weapon'?`<button data-combine="${index}" class="primary" ${g.weapons.some((other,j)=>index!==j&&canCombine(weaponInstance(g.weapons[index]),weaponInstance(other)))?'':'disabled'}>合成</button><button data-recycle="${index}" class="secondary">回收 +${recyclePrice(item.basePrice,g.wave,g.stats.items_price||0)}</button>`:kind==='offer'?`<button id="inspect-buy" class="primary" ${g.canBuy(item)?'':'disabled'}>拼词购买 · ${item.price}</button>`:''}</footer></section>`;
    this.bind('inspect-back',()=>this.renderShop());this.pageButtons('inspect',pages,p=>this.renderInspect(kind,index,p));
    this.bind('inspect-buy',()=>{this.renderShop();if(g.beginPurchase(index))a.openSpelling();});
    s.querySelector('[data-combine]')?.addEventListener('click',()=>{if(g.combineWeapon(index)){a.play('purchase');a.updateHUD();this.renderShop();}});
    s.querySelector('[data-recycle]')?.addEventListener('click',()=>{if(g.recycleWeapon(index)){a.play('pickup');a.updateHUD();this.renderShop();}});
  }
  renderAchievements(page=0){
    const {progression:p,itemArt,renderPhase}=this.actions,items=pageOf(achievementList(p.state,this.achievementGroup),page,2);this.achievementPage=items.index;
    this.screen.className='screen achievements-screen';
    this.screen.innerHTML=`<section class="shop achievement-panel"><header class="shop-header"><div><span>已解锁 ${achievements.filter(a=>p.has(a.id)).length} / ${achievements.length}</span><h2>成就与解锁</h2></div><select id="achievement-group" aria-label="成就分类">${achievementGroups.map(g=>`<option ${g===this.achievementGroup?'selected':''}>${g}</option>`).join('')}</select><button id="close-achievements" class="secondary">返回</button></header><div class="achievement-list">${items.values.map(a=>{
      const unlocked=p.has(a.id),value=achievementValue(p.state,a);
      return `<article class="achievement ${unlocked?'unlocked':''}" data-achievement="${a.id}"><span class="achievement-art">${itemArt(a.reward?.id||'trophy')}</span><div><strong>${escape(a.title)}</strong><p>${escape(a.description)}</p><small>${unlocked?'已达成 ✓':a.reward?.kind==='character'?'角色已开放':a.reward?'奖励':'勋章'}${a.reward?' · '+escape(a.reward.name):''}</small><progress max="${a.target}" value="${Math.min(value,a.target)}" aria-label="${escape(a.description)}"></progress><small>${Math.min(value,a.target)} / ${a.target}</small></div></article>`;
    }).join('')}</div>${pager('achievement',items)}</section>`;
    this.screen.querySelector('#achievement-group').onchange=event=>{this.achievementGroup=event.target.value;this.renderAchievements();};
    this.bind('close-achievements',renderPhase);this.pageButtons('achievement',items,p=>this.renderAchievements(p));
  }
  renderResult(page=0){
    const g=this.game,a=this.actions,won=g.phase==='won';
    const rows=[...g.newUnlocks.map(u=>({art:u.reward?.id||'trophy',text:`成就 · ${u.title}${u.reward?.kind==='character'?' · 角色成就':u.reward?' · 解锁'+u.reward.name:''}`})),...g.review.filter(w=>w.result==='unknown').flatMap(w=>textPages(`${w.english} · ${w.chinese}`,72).map(text=>({text})))];
    const items=pageOf(rows,page,2);this.resultPage=items.index;this.screen.className='screen result-screen';
    const canRetry=!!g.canRetryWave;
    this.screen.innerHTML=`<div class="compact-result"><section class="result-summary"><h1>${won?'冒险成功':'再接再厉'}</h1><div class="result-stats"><div><b>${g.wave}</b><span>到达波次</span></div><div><b>${g.kills}</b><span>击败怪物</span></div><div><b>${g.correct}</b><span>拼对单词</span></div></div><div class="result-actions">${canRetry?'<button id="retry-wave" class="primary">重试当前波次</button>':''}<button id="restart-game" class="${canRetry?'secondary':'primary'}">再来一局</button></div></section><section class="result-detail"><h2>解锁与复习</h2><div class="result-rows">${items.values.map(row=>`<p>${row.art?a.itemArt(row.art):''}${escape(row.text)}</p>`).join('')||'<p>每次出发，都比上一次多认识一点。</p>'}</div>${pager('result',items)}</section></div>`;
    this.bind('restart-game',a.restart);this.bind('retry-wave',a.retry);this.pageButtons('result',items,p=>this.renderResult(p));
  }
}
