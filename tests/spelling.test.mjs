import test from 'node:test';
import assert from 'node:assert/strict';
import { align, resolve, board, boardMismatch, maskExample, exampleTokens, tokenForWord } from '../packages/learning-ui/src/spelling.mjs';
test('fixed punctuation and leading digits match the native input contract', () => {
  assert.equal(align('3D-printer', 'Dprinter'), '3D-printer');
  assert.equal(align('ice cream', 'icecream'), 'ice cream');
  assert.equal(align("it's", 'its'), "it's");
});
test('mistakes must be deleted before adding more letters', () => {
  assert.equal(resolve('apple', 'ax', 'axp'), 'ax');
  assert.equal(resolve('apple', 'ax', 'a'), 'a');
  assert.equal(resolve('apple', 'a', 'apple'), 'apple');
});
test('quick blanks retain their original positions including repeated letters', () => {
  assert.equal(board('apple', 'p', [1, 2]), 'ap_le');
  assert.equal(board('ice cream', 'ic', null), 'ic_ _____');
});

test('immediate mismatches map to full spelling and quick-letter positions', () => {
  assert.equal(boardMismatch('apple', 'ax', null), 1);
  assert.equal(boardMismatch('apple', 'a', null), null);
  assert.equal(boardMismatch('apple', 'APP', null), null);
  assert.equal(boardMismatch('off-shoulder', 'off-x', null), 4);
  assert.equal(boardMismatch('pp', 'px', [1, 2]), 2);
  assert.equal(boardMismatch('pp', 'p', [1, 2]), null);
});

test('examples hide complete targets, including case, hyphens, apostrophes and repeated occurrences', () => {
  for (const [target, example, expected] of [
    ['off-shoulder', 'She wore an off-shoulder dress.', 'She wore an ____ dress.'],
    ['off-shoulder', 'OFF‑SHOULDER or off shoulder', '____ or ____'],
    ['cat', 'A cat, a CAT and a cathedral.', 'A ____, a ____ and a cathedral.'],
    ['ice cream', 'Try ice   cream!', 'Try ____!'],
    ["it's", "It’s here; it's there.", '____ here; ____ there.'],
    ['C++', 'Use C++ today.', 'Use ____ today.'],
    ['', 'An unchanged example.', 'An unchanged example.'],
    ['camera', '这台camera拍照。', '这台____拍照。'],
    // Examples inflect the target: the endings must be hidden too.
    ['illuminate', 'The fireworks illuminated the entire harbor.', 'The fireworks ____ the entire harbor.'],
    ['canopy', 'Two canopies cover the path.', 'Two ____ cover the path.'],
    ['study', 'She studies every day.', 'She ____ every day.'],
    ['cat', 'Cats and cathedrals.', '____ and cathedrals.'],
    ['shine', 'The sun shines.', 'The sun ____.'],
  ]) assert.equal(maskExample(example, target), expected);
});

test('display words keep the spoken word order, punctuation attached and blanks collapsed', () => {
  const words = example => exampleTokens(example, 'camera');
  // One token per spoken word; the blank covers exactly the masked words.
  assert.deepEqual(words('I use a camera to take pictures.').map(token => [token.text, token.from, token.to]),
    [['I', 0, 0], ['use', 1, 1], ['a', 2, 2], ['____', 3, 3], ['to', 4, 4], ['take', 5, 5], ['pictures.', 6, 6]]);
  // A two-word target collapses into one blank that every one of its words maps to.
  const phrase = exampleTokens('An apple a day keeps the doctor away.', 'a day');
  assert.equal(phrase.map(token => token.text).join(' '), 'An apple ____ keeps the doctor away.');
  assert.equal(tokenForWord(phrase, 2), 2);
  assert.equal(tokenForWord(phrase, 3), 2);
  assert.equal(tokenForWord(phrase, 4), 3);
  // Repeated words stay separate and advance by position, not by text.
  const repeated = exampleTokens('The cat saw the cat.', 'cat');
  assert.equal(repeated.filter(token => token.text.toLowerCase() === 'the').length, 2);
  assert.equal(tokenForWord(repeated, 0), 0);
  assert.equal(tokenForWord(repeated, 3), 3);
  // Unmasked sentences still render word by word, and whitespace is normalised.
  assert.equal(exampleTokens('  Take   one photo. \n', 'camera').map(token => token.text).join(' '), 'Take one photo.');
  // Inflected and hyphenated targets keep the blank in the spoken position.
  assert.equal(exampleTokens('The fireworks illuminated the harbor.', 'illuminate').map(token => token.text).join(' '), 'The fireworks ____ the harbor.');
  assert.equal(exampleTokens('She wore an OFF‑SHOULDER dress.', 'off-shoulder').map(token => token.text).join(' '), 'She wore an ____ dress.');
});
