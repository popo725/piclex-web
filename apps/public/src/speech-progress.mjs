// Web Speech exposes neither audio samples nor a duration. This presentation
// clock interpolates between events; boundaries refine its estimate, never set
// the visible width directly. Only the utterance's end event completes it.
export function createSpeechProgress(text, rate = 1, now = performance.now()) {
  const speed = Number.isFinite(rate) && rate > 0 ? rate : 1;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const punctuation = (text.match(/[,;:.!?]/g) || []).length;
  const initialDuration = Math.max(450, (text.length * 45 + words * 120 + punctuation * 150 + 250) / speed);
  let duration = initialDuration, value = 0, activeTime = 0, runningSince = now, lastSample = now;
  let paused = false, anchorTime = 0, anchorValue = 0, remaining = duration, lastCharacter = 0;
  const elapsed = time => activeTime + (paused ? 0 : Math.max(0, time - runningSince));
  return {
    sample(time) {
      const delta = Math.min(80, Math.max(0, time - lastSample));
      lastSample = time;
      if (paused || !delta) return value;
      const phase = Math.max(0, (elapsed(time) - anchorTime) / remaining);
      // Keep moving gently when speech outlasts the estimate, without reaching
      // the segment boundary before its real end event.
      const fraction = phase < .8 ? phase : .8 + .19 * (1 - Math.exp(-(phase - .8) / .19));
      const target = Math.min(.99, anchorValue + (1 - anchorValue) * fraction);
      const correction = Math.max(0, target - value) * (1 - Math.exp(-delta / 120));
      value += Math.min(correction, delta * Math.max(.0008, 1 / duration));
      return value;
    },
    boundary(character, time) {
      if (!Number.isFinite(character) || character <= lastCharacter || character >= text.length) return;
      lastCharacter = character;
      const fraction = character / text.length, spokenTime = elapsed(time);
      if (spokenTime >= 250 && fraction >= .05) {
        const observed = Math.min(initialDuration * 4, Math.max(initialDuration / 4, spokenTime / fraction));
        duration = duration * .5 + observed * .5;
      }
      // A late/early boundary changes the pace ahead, not the current position.
      anchorValue = Math.max(value, fraction);
      anchorTime = spokenTime;
      remaining = Math.max(100, duration * (1 - fraction));
    },
    setPaused(next, time) {
      if (next === paused) return;
      activeTime = elapsed(time);
      runningSince = time;
      lastSample = time;
      paused = next;
    }
  };
}
