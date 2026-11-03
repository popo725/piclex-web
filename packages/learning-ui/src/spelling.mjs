// Mirrors the native fixed-character and correction behavior for immediate input feedback.
export const fixed = c => !/^[a-z]$/i.test(c);
export function align(expected, value) {
  const entered = [...value].filter(c => !fixed(c));
  const chars = [...expected]; let cursor = 0; let result = '';
  for (let i = 0; i < chars.length; i++) {
    if (fixed(chars[i])) {
      if (cursor < entered.length || (result.length && !chars.slice(i + 1).some(c => !fixed(c)))) result += chars[i];
    } else if (cursor < entered.length) result += entered[cursor++];
    else break;
  }
  return result;
}
export function mismatch(expected, entered) {
  return [...entered.toLowerCase()].findIndex((c, i) => c !== [...expected.toLowerCase()][i]);
}
export function resolve(expected, current, proposed) {
  const candidate = align(expected, proposed);
  return mismatch(expected, current) >= 0 && mismatch(expected, candidate) >= 0 && candidate.length >= current.length ? current : candidate;
}
export function board(expected, entered, quickIndices) {
  const typed = new Map([...entered].map((c, i) => [quickIndices?.[i] ?? i, c]));
  return [...expected].map((c, i) => fixed(c) || (quickIndices && !quickIndices.includes(i)) ? c : typed.get(i) || '_').join('');
}

export function boardMismatch(inputExpected, entered, quickIndices) {
  const index = mismatch(inputExpected, entered);
  return index < 0 ? null : quickIndices?.[index] ?? index;
}

// The complete target, including case and typographic separator variants, plus
// the common inflections of its last word. Shared by masking and by the
// sentence alignment that keeps spoken words and displayed words in step.
function targetExpression(target) {
  const parts = target.trim().split(/[\s\-‐‑‒–—−]+/u).filter(Boolean);
  if (!parts.length) return null;
  const escaped = parts.map((part, index) => {
    const body = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/['’]/g, "['’]");
    // Examples usually inflect the target ("illuminated", "canopies"), so the
    // last word also hides its common endings; otherwise the answer stays
    // readable in the sentence.
    if (index !== parts.length - 1) return body;
    const stem = body.slice(0, -1);
    switch (part[part.length - 1].toLowerCase()) {
      case 'e': return `${stem}(?:e|es|ed|ing)?`;
      case 'y': return `${stem}(?:y|ies|ied|ier|iest|ying)?`;
      default: return `${body}(?:s|es|ed|d|ing|er|est)?`;
    }
  });
  return new RegExp('(?<![A-Za-z0-9])' + escaped.join('[\\s\\-‐‑‒–—−]+') + '(?![A-Za-z0-9])', 'giu');
}

// Mask the complete target, including case and typographic separator variants.
// Keep substrings of unrelated words intact, and never alter stored examples.
export function maskExample(example, target) {
  const expression = targetExpression(target);
  return expression ? example.replace(expression, '____') : example;
}

// Split the sentence into the words a speech engine announces: punctuation stays
// attached to the word it follows, and every word keeps its original position.
export function exampleWords(example) {
  return [...example.matchAll(/\S+/gu)].map(match => ({ text: match[0], start: match.index, end: match.index + match[0].length }));
}

// Display words for the masked sentence, each remembering which original words it
// covers. A masked phrase collapses into one blank block, so the highlight lands
// on the blank for every word of that phrase instead of flickering across it.
export function exampleTokens(example, target) {
  const words = exampleWords(example);
  const expression = targetExpression(target);
  const covered = new Set(), blocks = new Map();
  if (expression) {
    for (const match of example.matchAll(expression)) {
      const end = match.index + match[0].length;
      let first = -1, last = -1;
      words.forEach((word, index) => {
        if (word.start < end && word.end > match.index) { if (first < 0) first = index; last = index; }
      });
      if (first < 0) continue;
      blocks.set(first, last);
      for (let index = first; index <= last; index++) covered.add(index);
    }
  }
  const tokens = [];
  for (let index = 0; index < words.length; index++) {
    if (!covered.has(index)) tokens.push({ text: words[index].text, from: index, to: index });
    else if (blocks.has(index)) tokens.push({ text: '____', from: index, to: blocks.get(index) });
  }
  return tokens;
}

// Which display word the currently spoken original word belongs to; -1 when the
// engine reports a position we cannot place.
export function tokenForWord(tokens, wordIndex) {
  return tokens.findIndex(token => wordIndex >= token.from && wordIndex <= token.to);
}
