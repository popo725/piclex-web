// Novelty/effect voices are still selectable explicitly, but never preferred by Auto.
const effects = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Trinoids|Whisper|Wobble|Zarvox)(?:$|[ (])/i;
export const isEnglishVoice = voice => /^en(?:[-_]|$)/i.test(voice.lang);
const isUS = voice => /^en[-_]US$/i.test(voice.lang);
function preference(voice) {
  if (/^Google US English$/i.test(voice.name)) return 0;
  if (/Microsoft.*(?:Natural|Neural)/i.test(voice.name)) return 1;
  if (/^Samantha(?:$|[ (])/i.test(voice.name)) return /enhanced|premium/i.test(voice.name) ? 2 : 3;
  if (/enhanced|premium|natural|neural/i.test(voice.name)) return 4;
  if (voice.default) return 5;
  return 6;
}
/**
 * Keep the actual browser voice object, and never replace an explicit preference.
 * @template {{lang:string,name:string,voiceURI:string,default?:boolean}} T
 * @param {T[]} voices
 * @param {string|null} [saved]
 * @returns {T|undefined}
 */
export function chooseSpeechVoice(voices, saved) {
  const english = voices.filter(isEnglishVoice);
  const explicit = saved && english.find(voice => voice.voiceURI === saved);
  if (explicit) return explicit;
  return english.filter(voice => !effects.test(voice.name)).sort((a,b) =>
    preference(a)-preference(b) || Number(isUS(b))-Number(isUS(a)) || a.name.localeCompare(b.name)
  )[0];
}
