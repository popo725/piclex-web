import test from 'node:test';
import assert from 'node:assert/strict';
import { singleRowLayout, sharedRowLayout, shortGap, tileFontSize, SHORT_MAX, LONG_TILE, LONG_GAP } from '../packages/laboratory/src/adaptive-tiles.mjs';

test('rows up to 20 cells fit the measured width without scrolling', () => {
  // A realistic landscape board inner width and the short-word gaps.
  const width = 468;
  for (let count = 1; count <= SHORT_MAX; count++) {
    const row = singleRowLayout({ width, count });
    assert.equal(row.scroll, false, `${count} cells must fit one row`);
    assert.ok(row.content <= width, `${count} cells: ${row.content} <= ${width}`);
    assert.ok(row.size >= 1);
    assert.ok(row.size <= 60);
  }
});

test('the 20/21 boundary switches from shrink-to-fit to horizontal scroll', () => {
  const width = 400;
  const twenty = singleRowLayout({ width, count: 20 });
  assert.equal(twenty.scroll, false);
  assert.equal(twenty.gap, 3);
  assert.ok(twenty.content <= width);

  const twentyOne = singleRowLayout({ width, count: 21 });
  assert.equal(twentyOne.scroll, true);
  assert.equal(twentyOne.size, LONG_TILE);
  assert.equal(twentyOne.gap, LONG_GAP);
  assert.ok(twentyOne.content > width);
});

test('short rows keep large tiles where they fit and shrink as the word grows', () => {
  const width = 468;
  const eight = singleRowLayout({ width, count: 8 });
  assert.ok(eight.size >= 44, `8 letters should stay comfortable, got ${eight.size}`);
  const twelve = singleRowLayout({ width, count: 12 });
  assert.ok(twelve.size < eight.size);
  const twenty = singleRowLayout({ width, count: 20 });
  assert.ok(twenty.size <= twelve.size);
  assert.ok(twenty.size < 44, '20 letters are allowed below 44px to stay on one row');
});

test('a short row never scrolls, even when the width is very tight', () => {
  // Even a cramped portrait board keeps all 20 cells on one row by shrinking the
  // blocks rather than clipping or scrolling.
  const row = singleRowLayout({ width: 192, count: 20 });
  assert.equal(row.scroll, false);
  assert.ok(row.content <= 192);
  assert.ok(row.size >= 1);
});

test('the gap tightens as the row grows and never grows again for long words', () => {
  assert.equal(shortGap(1), 6);
  assert.equal(shortGap(8), 6);
  assert.equal(shortGap(12), 5);
  assert.equal(shortGap(16), 4);
  assert.equal(shortGap(20), 3);
  assert.equal(shortGap(21), 3);
  assert.ok(shortGap(20) < shortGap(1));
});

test('both rows share the tighter tile and gap without wrapping', () => {
  const answer = singleRowLayout({ width: 300, count: 20 });
  const bank = singleRowLayout({ width: 468, count: 20 });
  const shared = sharedRowLayout(answer, bank);
  assert.equal(shared.size, Math.min(answer.size, bank.size));
  assert.equal(shared.gap, Math.min(answer.gap, bank.gap));
  assert.equal(shared.scroll, false);
  // Long rows always report scrolling so the containers can pan.
  assert.equal(sharedRowLayout(singleRowLayout({ width: 400, count: 21 }), singleRowLayout({ width: 400, count: 21 })).scroll, true);
});

test('fixed separators count toward the row width so nothing overflows', () => {
  const width = 300;
  const withSeparators = singleRowLayout({ width, count: 10 });
  const without = singleRowLayout({ width, count: 8 });
  assert.ok(withSeparators.size <= without.size);
  assert.equal(withSeparators.scroll, false);
});

test('the chosen size never grows when width shrinks, and stays usable when empty', () => {
  const wide = singleRowLayout({ width: 600, count: 20 });
  const narrow = singleRowLayout({ width: 200, count: 20 });
  assert.ok(wide.size >= narrow.size);
  const empty = singleRowLayout({ width: 400, count: 0 });
  assert.equal(empty.size, 60);
  assert.equal(empty.content, 0);
  assert.equal(empty.scroll, false);
});

test('tileFontSize scales with the cell and stays legible', () => {
  assert.equal(tileFontSize(56), 26);
  assert.equal(tileFontSize(17), 10);
  assert.equal(tileFontSize(4), 10);
  assert.equal(tileFontSize(200), 28);
});
