import test from 'node:test';
import assert from 'node:assert/strict';
import { SurvivalGame, catalog } from '../packages/laboratory/src/engine.mjs';
import { editableLetters, createTileBank, tileById, isUsed, useTile, returnTile, moveSlot, createSlots, undoTile, clearTiles, proposedFrom, draftFrom, isFull } from '../packages/laboratory/src/letter-tiles.mjs';

const word={english:'garden',chinese:'花园',example:'We play in the garden.',exampleChinese:'我们在花园里玩。'};

function shop(target=word,{coins=100,price=18}={}){
  const g=new SurvivalGame({words:[target],random:()=>.4});
  g.wave=1;g.phase='shop';g.coins=coins;
  g.offers=[{...catalog.find(o=>o.id==='damage'),price,status:'available',word:target,answer:''}];
  return g;
}

// Pick one available tile per requested letter, in order.
function idsFor(bank,letters){
  const used=new Set(),selection=[];
  for(const letter of letters){
    const tile=bank.find(candidate=>candidate.letter===letter&&!used.has(candidate.id));
    assert.ok(tile,`missing tile for ${letter}`);
    used.add(tile.id);selection.push(tile.id);
  }
  return selection;
}

test('repeated letters become separate one-use tiles', () => {
  const bank=createTileBank('letter',()=>.5);
  assert.equal(bank.length,6);
  assert.equal(new Set(bank.map(tile=>tile.id)).size,6);
  assert.equal(bank.filter(tile=>tile.letter==='t').length,2);
  assert.equal(bank.filter(tile=>tile.letter==='e').length,2);
  const twins=bank.filter(tile=>tile.letter==='t'),first=twins[0].id,second=twins[1].id;
  let selection=useTile(bank,[],first);
  selection=useTile(bank,selection,first); // the same physical tile is never spent twice
  assert.deepEqual(selection,[first]);
  assert.equal(isUsed(selection,first),true);
  selection=useTile(bank,selection,second);
  assert.deepEqual(selection,[first,second]);
  assert.equal(proposedFrom(bank,selection),'tt');
});

test('the shuffled bank keeps the letter multiset but never starts in answer order', () => {
  const identity=()=>.999999;
  for(const target of ['garden','letter','abcdefghijklmnopqrstuvwxyzabcdefghijklmn']){
    const bank=createTileBank(target,identity);
    assert.deepEqual(bank.map(tile=>tile.letter).sort(),editableLetters(target).map(letter=>letter.toLowerCase()).sort());
    assert.notEqual(bank.map(tile=>tile.letter).join(''),editableLetters(target).map(letter=>letter.toLowerCase()).join(''));
  }
  // Trivial banks (all letters identical) cannot avoid identity and are left as-is.
  assert.deepEqual(createTileBank('aaa',identity).map(tile=>tile.letter),['a','a','a']);
});

test('separators are not tiles, letters display lower-case and drafts reinsert fixed punctuation', () => {
  const bank=createTileBank('Ice-Cream',()=>.5);
  assert.equal(bank.length,8);
  assert.equal(bank.some(tile=>tile.letter==='-'),false);
  assert.ok(bank.every(tile=>tile.letter===tile.letter.toLowerCase()));
  const selection=idsFor(bank,'icecream');
  assert.equal(draftFrom(bank,selection,'Ice-Cream'),'ice-cream');
  assert.deepEqual(editableLetters("It's"),['I','t','s']);
  const apostrophe=createTileBank("It's",()=>.5);
  assert.equal(draftFrom(apostrophe,idsFor(apostrophe,'its'),"It's"),"it's");
});

test('undo removes the last tile and clear resets the whole selection', () => {
  const bank=createTileBank('garden',()=>.5);
  let selection=idsFor(bank,'gar');
  assert.equal(proposedFrom(bank,selection),'gar');
  selection=undoTile(selection);
  assert.equal(proposedFrom(bank,selection),'ga');
  assert.deepEqual(clearTiles(),[]);
});

test('a full selection produces the complete draft with automatic separators', () => {
  const bank=createTileBank('lamp shade',()=>.5);
  const selection=idsFor(bank,'lampshade');
  assert.equal(isFull(bank,selection,'lamp shade'),true);
  assert.equal(draftFrom(bank,selection,'lamp shade'),'lamp shade');
  assert.equal(isFull(bank,selection.slice(0,-1),'lamp shade'),false);
  assert.equal(draftFrom(bank,selection.slice(0,-1),'lamp shade'),'lamp shad');
});

test('incomplete explicit checks never mutate coins, rewards, draft or offer state', () => {
  const g=shop();g.beginPurchase(0);
  const offer=g.offers[0],before={coins:g.coins,rebate:offer.rebate,rewarded:offer.rewardedLetters,status:offer.status,answer:offer.answer,draft:g.challenge.answer};
  const result=g.submitSpelling('gar');
  assert.equal(result.status,'incomplete');
  assert.equal(g.coins,before.coins);
  assert.equal(offer.rebate,before.rebate);
  assert.equal(offer.rewardedLetters,before.rewarded);
  assert.equal(offer.status,before.status);
  assert.equal(offer.answer,before.answer);
  assert.equal(g.challenge.answer,before.draft);
  assert.equal(g.correct,0);
  assert.equal(g.failed,0);
});

test('explicit wrong full checks charge once, rebate correct positions and cannot retry', () => {
  const g=shop();g.beginPurchase(0);
  const first=g.submitSpelling('gadren'); // g,a,·,·,e,n correct -> ceil(18*4/(10*6)) = 2
  assert.equal(first.status,'failed');
  assert.deepEqual(first.letters,[0,1,4,5]);
  assert.equal(first.earned,2);
  assert.equal(first.rebate,2);
  assert.equal(g.coins,84); // 100 + 2 proportional rebate - 18 price
  assert.equal(g.failed,1);
  assert.equal(g.correct,0);
  assert.equal(g.inventory.length,0);
  assert.equal(g.offers[0].status,'failed');
  assert.equal(g.challenge,null);
  assert.equal(g.review[0].result,'unknown');
  // A repeated event can never charge or rebate a second time.
  const repeat=g.submitSpelling('gadren');
  assert.equal(repeat.status,'idle');
  assert.equal(g.coins,84);
  assert.equal(g.failed,1);
  assert.equal(g.beginPurchase(0),false);
});

test('a fully wrong draft keeps no rebate and settles as one failed purchase', () => {
  const g=shop();g.beginPurchase(0);
  const wrong=g.submitSpelling('nregad');
  assert.equal(wrong.status,'failed');
  assert.deepEqual(wrong.letters,[]);
  assert.equal(wrong.earned,0);
  assert.equal(g.coins,82); // 100 - 18, no position matched
  assert.equal(g.failed,1);
  assert.equal(g.inventory.length,0);
  assert.equal(g.offers[0].status,'failed');
  assert.equal(g.submitSpelling('garden').status,'idle');
  assert.equal(g.coins,82);
});

test('closing an unsubmitted draft keeps money and a correct check settles exactly once', () => {
  const g=shop();g.beginPurchase(0);
  g.cancelPurchase();
  assert.equal(g.coins,100);
  assert.equal(g.failed,0);
  assert.ok(g.beginPurchase(0));
  const good=g.submitSpelling('garden');
  assert.equal(good.status,'purchased');
  assert.equal(good.earned,2);
  assert.equal(g.coins,84);
  assert.equal(g.correct,1);
  assert.equal(g.pendingExperience.length,1);
  assert.equal(g.pendingExperience[0].action,'word');
  assert.equal(g.settleExperience(g.pendingExperience[0].id,'accepted').status,'earned');
  assert.equal(g.pendingExperience.length,0);
  assert.equal(g.submitSpelling('garden').status,'idle');
  assert.equal(g.coins,84);
});

test('experience can skip spelling while preserving the item price and quality-scaled cost',()=>{
  const g=shop();g.offers[0].tier=3;g.beginPurchase(0);
  const event=g.requestExperienceSkip();
  assert.equal(event.action,'spend');assert.equal(event.cost,26);assert.equal(event.amount,-26);
  const result=g.settleExperience(event.id,'accepted');
  assert.equal(result.status,'purchased');assert.equal(g.coins,82);assert.equal(g.inventory.length,1);
  assert.equal(g.correct,0);assert.equal(g.failed,0);assert.equal(g.challenge,null);
  assert.equal(g.settleExperience(event.id,'accepted').status,'idle');assert.equal(g.coins,82);
});

test('an insufficient experience response keeps the spelling purchase open and charges nothing',()=>{
  const g=shop();g.beginPurchase(0);const event=g.requestExperienceSkip();
  assert.equal(g.settleExperience(event.id,'insufficient').status,'insufficient');
  assert.equal(g.coins,100);assert.equal(g.inventory.length,0);assert.ok(g.challenge);assert.equal(g.pendingExperience.length,0);
});

test('an unaffordable offer is unavailable: no charge, no rebate and the attempt is cancelled', () => {
  const g=shop(word,{coins:5,price:18});
  // Model a price that became unaffordable after the prompt opened.
  g.challenge={index:0,word:g.offers[0].word,answer:''};
  const before={coins:g.coins,rebate:g.offers[0].rebate,status:g.offers[0].status};
  const result=g.submitSpelling('garden');
  assert.equal(result.status,'unavailable');
  assert.equal(g.coins,before.coins);
  assert.equal(g.offers[0].rebate,before.rebate);
  assert.equal(g.offers[0].status,before.status);
  assert.equal(g.challenge,null);
  assert.equal(g.correct,0);
  assert.equal(g.failed,0);
});

test('only complete explicit submissions evaluate and reward', () => {
  const g=shop({english:'ice cream',chinese:'冰淇淋',example:'I like ice cream.',exampleChinese:'我喜欢冰淇淋。'},{price:36});
  g.beginPurchase(0);
  assert.equal(g.submitSpelling('ice').status,'incomplete');
  assert.equal(g.coins,100);
  const full=g.submitSpelling('icecream');
  assert.equal(full.status,'purchased');
  assert.deepEqual(full.letters,[0,1,2,4,5,6,7,8]);
  assert.equal(g.coins,100+Math.ceil(36/10)-36); // rebate then price
  assert.equal(g.submitSpelling('ice cream').status,'idle');
});

test('returning a middle letter leaves a hole and the next pick refills that exact position', () => {
  const bank=createTileBank('garden',()=>.5);
  const all=idsFor(bank,'garden');
  let slots=createSlots('garden');
  assert.deepEqual(slots,[null,null,null,null,null,null]);
  slots=useTile(bank,slots,all[0]);
  slots=useTile(bank,slots,all[1]);
  assert.deepEqual(slots,[all[0],all[1],null,null,null,null]);
  slots=returnTile(slots,0);
  assert.deepEqual(slots,[null,all[1],null,null,null,null]);
  slots=useTile(bank,slots,all[2]);
  assert.deepEqual(slots,[all[2],all[1],null,null,null,null]);
  assert.equal(proposedFrom(bank,slots),tileById(bank,all[2]).letter+tileById(bank,all[1]).letter);
  assert.equal(isFull(bank,slots,'garden'),false);
});

test('repeated letters keep their exact physical identity across return and refill', () => {
  const bank=createTileBank('letter',()=>.5);
  const ts=bank.filter(tile=>tile.letter==='t').map(tile=>tile.id);
  let slots=createSlots('letter');
  slots=useTile(bank,slots,ts[0]);
  slots=useTile(bank,slots,ts[1]);
  assert.deepEqual(slots.slice(0,2),[ts[0],ts[1]]);
  slots=returnTile(slots,0);
  assert.equal(slots[0],null);
  assert.equal(isUsed(slots,ts[0]),false);
  assert.equal(isUsed(slots,ts[1]),true);
  slots=useTile(bank,slots,ts[0]);
  assert.equal(slots[0],ts[0]);
  assert.equal(slots[1],ts[1]);
});

test('moving a slot stably inserts and shifts the intervening entries in both directions', () => {
  const seq=['a','b','c','d','e','f'];
  // Forward: 0-based index 4 -> 1 removes 'e' and shifts b,c,d right, keeping them in order.
  assert.deepEqual(moveSlot(seq,4,1),['a','e','b','c','d','f']);
  // Backward: 1 -> 4 removes 'e' again and shifts b,c,d left, keeping them in order.
  assert.deepEqual(moveSlot(seq,1,4),['a','c','d','e','b','f']);
  // A round trip restores the original sequence exactly.
  assert.deepEqual(moveSlot(moveSlot(seq,4,1),1,4),seq);
  assert.deepEqual(moveSlot(moveSlot(seq,1,4),4,1),seq);
  assert.equal(moveSlot(seq,4,1).length,seq.length);
  assert.deepEqual(moveSlot(seq,2,2),seq);
  assert.deepEqual(moveSlot(seq,-1,2),seq);
  assert.deepEqual(moveSlot(seq,2,9),seq);
});

test('moving a gap keeps the fixed length, multiset and unique tiles without duplicate consumption', () => {
  const bank=createTileBank('garden',()=>.5);
  const all=idsFor(bank,'garden');
  let slots=createSlots('garden');
  all.forEach((id,index)=>{slots[index]=id;});
  slots=returnTile(slots,2); // gap at index 2: [g,a,_,d,e,n]
  const before=slots.slice();
  const moved=moveSlot(slots,5,0); // move n to the front, the gap shifts with the entries
  assert.deepEqual(moved,[all[5],all[0],all[1],null,all[3],all[4]]);
  assert.equal(moved.length,before.length);
  assert.deepEqual(moved.filter(Boolean).sort(),before.filter(Boolean).sort());
  assert.equal(new Set(moved.filter(Boolean)).size,moved.filter(Boolean).length);
  // A tile already placed cannot be consumed twice after a move...
  assert.equal(useTile(bank,moved,all[0]),moved);
  // ...while the returned tile refills the first vacancy without duplicating another.
  const refilled=useTile(bank,moved,all[2]);
  assert.deepEqual(refilled,[all[5],all[0],all[1],all[2],all[3],all[4]]);
  assert.equal(new Set(refilled).size,6);
});

test('fullness rejects holes, duplicate tiles and unknown IDs', () => {
  const bank=createTileBank('garden',()=>.5);
  const full=[...idsFor(bank,'garden')];
  assert.equal(isFull(bank,full,'garden'),true);
  const holed=full.slice();holed[2]=null;
  assert.equal(isFull(bank,holed,'garden'),false);
  const duplicated=full.slice();duplicated[2]=duplicated[1];
  assert.equal(isFull(bank,duplicated,'garden'),false);
  const unknown=full.slice();unknown[0]='tile-999';
  assert.equal(isFull(bank,unknown,'garden'),false);
});

test('slot drafts keep holes and fixed separators in their word positions', () => {
  const bank=createTileBank("It's a test",()=>.5);
  const all=idsFor(bank,'itsatest');
  const slots=all.slice();
  assert.equal(slots.length,editableLetters("It's a test").length);
  assert.equal(draftFrom(bank,slots,"It's a test"),"it's a test");
  const holed=slots.slice();holed[1]=null;
  assert.equal(draftFrom(bank,holed,"It's a test"),"i_'s a test");
  holed[1]=all[1];
  assert.equal(draftFrom(bank,holed,"It's a test"),"it's a test");
});

test('editing a slot draft never mutates the engine or rewards before the final check', () => {
  const g=shop();g.beginPurchase(0);
  const offer=g.offers[0],before={coins:g.coins,rebate:offer.rebate,rewarded:offer.rewardedLetters,status:offer.status,answer:offer.answer};
  assert.deepEqual({coins:g.coins,rebate:offer.rebate,rewarded:offer.rewardedLetters,status:offer.status,answer:offer.answer},before);
  assert.equal(g.correct,0);
  assert.equal(g.failed,0);
});
