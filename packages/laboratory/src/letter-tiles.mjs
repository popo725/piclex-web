// Pure helpers for the shop letter-tile bank. The bank is a shuffled multiset of
// the target word's editable letters; every physical tile keeps a stable unique
// id so repeated letters are independent, one-use tiles.
import { fixed } from '../spelling.mjs';

const lower = value => String(value).toLowerCase();

// The letters the player actually types. Spaces, hyphens and apostrophes are
// fixed separators supplied by the shared spelling logic, never tiles.
export function editableLetters(word) {
  return [...String(word)].filter(char => !fixed(char));
}

function shuffle(items, random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

// Fisher-Yates shuffle of the editable letters. When the shuffled order happens
// to equal the answer order for a word with at least two distinct letters, rotate
// once so the initial bank never starts solved.
export function createTileBank(word, random = Math.random) {
  const letters = editableLetters(word).map(lower);
  const tiles = letters.map((letter, index) => ({ id: `tile-${index}`, letter }));
  shuffle(tiles, random);
  const nontrivial = tiles.some(tile => tile.letter !== tiles[0]?.letter);
  if (nontrivial && tiles.map(tile => tile.letter).join('') === letters.join('')) tiles.push(tiles.shift());
  return tiles;
}

export function tileById(bank, id) {
  return bank.find(tile => tile.id === id) || null;
}

export function isUsed(selection, id) {
  return selection.includes(id);
}

// Consume one available tile. Repeated clicks on the same physical tile are
// ignored, so a tile can never be spent twice. A slot draft with an empty
// position (null) is filled at the first vacancy; legacy packed selections
// without vacancies append at the end.
export function useTile(bank, selection, id) {
  if (!tileById(bank, id) || isUsed(selection, id)) return selection;
  const vacancy = selection.indexOf(null);
  if (vacancy >= 0) { const next = selection.slice(); next[vacancy] = id; return next; }
  return [...selection, id];
}

// A fresh fixed-length editable-slot draft: one entry per editable letter, all
// empty. Slots keep their position, so returning a middle letter leaves a hole
// instead of collapsing the letters after it.
export function createSlots(word) {
  return Array(editableLetters(word).length).fill(null);
}

// Return the tile at one editable position to the bank. The position stays as an
// empty slot, preserving the length and every other tile's position.
export function returnTile(selection, index) {
  if (index < 0 || index >= selection.length || selection[index] == null) return selection;
  const next = selection.slice();
  next[index] = null;
  return next;
}

// Move the tile (or gap) at `from` to `to` with a stable sequence insert: only
// the source is removed, every entry between source and target shifts one place
// while keeping its own order, and the array length never changes. Gaps shift
// as entries too; every physical tile and the number of gaps are preserved.
export function moveSlot(selection, from, to) {
  if (from === to || from < 0 || to < 0 || from >= selection.length || to >= selection.length) return selection;
  const next = selection.slice();
  const [entry] = next.splice(from, 1);
  next.splice(to, 0, entry);
  return next;
}

export function undoTile(selection) {
  return selection.slice(0, -1);
}

export function clearTiles() {
  return [];
}

export function proposedFrom(bank, selection) {
  return selection.map(id => tileById(bank, id)?.letter || '').join('');
}

// The current draft with fixed separators kept in their word positions. An
// explicit empty slot is the placeholder '_' so an internal hole never collapses
// later letters; a packed selection that simply ends early leaves the remaining
// positions omitted (legacy partial drafts such as 'lamp shad').
export function draftFrom(bank, selection, word) {
  const chars = [...String(word)];
  let slot = 0;
  let draft = '';
  for (const char of chars) {
    if (fixed(char)) { draft += char; continue; }
    const id = selection[slot++];
    if (id === undefined) continue;
    if (id === null) { draft += '_'; continue; }
    draft += tileById(bank, id)?.letter || '_';
  }
  return draft;
}

// A draft is full only when it has exactly one valid, unique physical tile for
// every editable letter and no holes. Missing, repeated or unknown tiles fail.
export function isFull(bank, selection, word) {
  const count = editableLetters(word).length;
  if (selection.length !== count) return false;
  const seen = new Set();
  for (const id of selection) {
    if (id == null || seen.has(id) || !tileById(bank, id)) return false;
    seen.add(id);
  }
  return true;
}
