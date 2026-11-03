import { fixed } from './spelling.mjs';

// A visual high-water mark, like PracticeExperienceMeter. Restoring an answer,
// deleting and retyping it, or supplying letters in quick mode earns no replay.
export class CharacterRippleLedger {
  scope;
  earned = 0;
  update({ scope, expected, entered, quickIndices, revealed, active }) {
    const chars = [...expected];
    const requested = quickIndices ?? chars.flatMap((c, i) => fixed(c) ? [] : [i]);
    const required = requested.map(i => chars[i].toLowerCase());
    const typed = [...entered.toLowerCase()].filter(c => !fixed(c));
    let correct = 0;
    while (correct < required.length && required[correct] === typed[correct]) correct++;
    if (this.scope !== scope || !active) {
      this.scope = scope; this.earned = revealed ? 0 : correct;
      return [];
    }
    if (revealed) return [];
    const fresh = requested.slice(this.earned, correct);
    this.earned = Math.max(this.earned, correct);
    return fresh;
  }
}

// Same radius, opacity and timing as PracticeExperienceShockwave.
export const RIPPLE_DURATION = 700;
export function rippleFrame(elapsed) {
  const t = elapsed / RIPPLE_DURATION, remaining = 1 - t;
  if (t < 0 || t >= 1) return null;
  return { radius: 4 + 22.5 * (1 - remaining ** 3),
    opacity: .48 * Math.min(1, t * 18) * remaining,
    width: .85 + .45 * remaining };
}
