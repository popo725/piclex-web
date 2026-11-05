// Necessary UI assets only. Keep large photos, decks and audio out of this list.
export const UI_ASSETS = Object.freeze([
  'arrow', 'back', 'camera', 'check', 'close', 'external', 'forward',
  'headphones', 'keycap', 'microphone', 'moon', 'pause', 'peek', 'photo',
  'share', 'sound', 'stop', 'sun', 'upload',
  'tab-capture', 'tab-learn', 'tab-settings',
  'tab-capture-frames', 'tab-learn-frames', 'tab-settings-frames',
].map(name => `icons/${name}.png`));

// One queue per document, including React StrictMode's repeated effects.
export function createUIAssetWarmup({load, schedule, concurrency = 2}) {
  let started = false;
  return () => {
    if (started) return;
    started = true;
    schedule(async () => {
      let next = 0;
      await Promise.all(Array.from({length: concurrency}, async () => {
        while (next < UI_ASSETS.length) {
          const path = UI_ASSETS[next++];
          try { await load(path); } catch { /* Normal rendering can retry later. */ }
        }
      }));
    });
  };
}
