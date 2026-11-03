import { resolve, mismatch } from '../../learning-ui/src/spelling.mjs';

export function newSession(deck) {
  return { version: 1, fingerprint: deck.fingerprint, round: 0, index: 0, input: '', hadMistake: false, result: null, results: [] };
}
export function restoreSession(deck, saved) {
  const fresh = newSession(deck);
  if (!saved || saved.version !== 1 || saved.fingerprint !== deck.fingerprint || !Number.isSafeInteger(saved.round) || saved.round < 0 || !Number.isInteger(saved.index) || saved.index < 0 || saved.index > deck.words.length || !Array.isArray(saved.results) || saved.results.length !== saved.index || !saved.results.every(x => ['correct', 'reviewed', 'revealed'].includes(x)) || !['correct', 'reviewed', 'revealed', null].includes(saved.result) || typeof saved.input !== 'string' || typeof saved.hadMistake !== 'boolean') return fresh;
  if (saved.index === deck.words.length) return { ...saved, input: '', result: null };
  const expected = deck.words[saved.index].english;
  if (saved.input.length > expected.length || (saved.result && saved.input.toLowerCase() !== expected.toLowerCase())) return fresh;
  return saved;
}
export function questionKey(session) { return `${session.fingerprint}:${session.round}:${session.index}`; }
/** Actions carry a question identity so a stale click cannot advance the next question. */
export function reduceSession(deck, session, action) {
  if (action.type === 'restart') return { ...newSession(deck), round: session.round + 1 };
  if (session.index >= deck.words.length || action.question !== questionKey(session)) return session;
  const word = deck.words[session.index];
  if (action.type === 'next' && session.result) return { ...session, index: session.index + 1, input: '', result: null, hadMistake: false, results: [...session.results, session.result] };
  if (session.result) return session;
  if (action.type === 'reveal') return { ...session, input: word.english, result: 'revealed' };
  if (action.type !== 'input' || typeof action.value !== 'string') return session;
  const input = resolve(word.english, session.input, action.value.slice(0, 200));
  const hadMistake = session.hadMistake || mismatch(word.english, input) >= 0;
  const complete = input.toLowerCase() === word.english.toLowerCase();
  return { ...session, input, hadMistake, result: complete ? hadMistake ? 'reviewed' : 'correct' : null };
}
