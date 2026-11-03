import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterRippleLedger, rippleFrame } from '../packages/learning-ui/src/character-ripples.mjs';

const snapshot = (entered = '', extra = {}) => ({ scope: 'deck:a0', expected: 'apple', entered, active: true, revealed: false, ...extra });
test('each newly correct letter fires once, including pasted and final letters; errors and retyping cannot replay', () => {
  const ledger = new CharacterRippleLedger();
  assert.deepEqual(ledger.update(snapshot()), []);
  assert.deepEqual(ledger.update(snapshot('a')), [0]);
  assert.deepEqual(ledger.update(snapshot('ax')), []);
  assert.deepEqual(ledger.update(snapshot('')), []);
  assert.deepEqual(ledger.update(snapshot('a')), []);
  assert.deepEqual(ledger.update(snapshot('appl')), [1, 2, 3]);
  assert.deepEqual(ledger.update(snapshot('apple')), [4]);
  assert.deepEqual(ledger.update(snapshot('apple')), []);
});
test('quick spelling maps repeated letters to requested original slots; supplied letters and separators earn no wave', () => {
  const ledger = new CharacterRippleLedger();
  const quick = { expected: 'off-shoulder', quickIndices: [1, 2, 7] };
  assert.deepEqual(ledger.update(snapshot('', quick)), []);
  assert.deepEqual(ledger.update(snapshot('f', quick)), [1]);
  assert.deepEqual(ledger.update(snapshot('ffu', quick)), [2, 7]);
  const normal = new CharacterRippleLedger();
  normal.update(snapshot('', { expected: '3D-printer' }));
  assert.deepEqual(normal.update(snapshot('3D-p', { expected: '3D-printer' })), [1, 3]);
});
test('restoration, a new scope, reveal and input while inactive do not manufacture or defer waves', () => {
  const ledger = new CharacterRippleLedger();
  assert.deepEqual(ledger.update(snapshot('ap')), []);
  assert.deepEqual(ledger.update(snapshot('apple', { revealed: true })), []);
  assert.deepEqual(ledger.update(snapshot('app', { active: false })), []);
  assert.deepEqual(ledger.update(snapshot('app')), []);
  assert.deepEqual(ledger.update(snapshot('appl')), [3]);
  assert.deepEqual(ledger.update(snapshot('apple', { scope: 'other:a0' })), []);
});
test('the impact stays local, has no initial flash, and expires at 700ms', () => {
  assert.equal(rippleFrame(-1), null);
  assert.equal(rippleFrame(0).opacity, 0);
  const middle = rippleFrame(100);
  assert.ok(middle.radius > 4 && middle.radius < 26.5);
  assert.ok(middle.opacity > 0 && middle.opacity <= .48);
  assert.notEqual(rippleFrame(400), null);
  assert.notEqual(rippleFrame(600), null);
  assert.equal(rippleFrame(700), null);
  assert.equal(rippleFrame(720), null);
});
