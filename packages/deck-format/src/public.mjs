import { MAX_PACKAGE_BYTES, sha256 } from './archive.mjs';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash = /^[0-9a-f]{64}$/;
const fail = () => { throw new Error('公开卡组内容校验失败，请刷新重试。'); };
const string = (value, min, max) => typeof value === 'string' && value.length >= min && value.length <= max;
const positive = (value, max) => Number.isSafeInteger(value) && value > 0 && value <= max;
const assetPath = value => string(value, 1, 300) && /^library\/[a-zA-Z0-9/._-]+$/.test(value) && !value.split('/').some(part => !part || part.startsWith('.'));

/** A reviewed build snapshot; only publicly downloadable sources may be mirrored. */
export function validateSnapshot(snapshot) {
  const sources = new Set(['https://piclex.v2fy.com/decks/source.json', 'https://piclex.v2fy.com/public/subscriptions/nce2/feed.json']);
  if (!snapshot || !Array.isArray(snapshot.decks) || !snapshot.decks.length || snapshot.decks.length > 1000) fail();
  const ids = new Set();
  for (const entry of snapshot.decks) {
    if (!uuid.test(entry.deckID) || ids.has(entry.deckID) || entry.access !== 'public' || entry.productID || !sources.has(entry.sourceURL) || !string(entry.title, 1, 80) || !string(entry.author, 1, 120) || !string(entry.description, 0, 2000) || !positive(entry.version, 999999999) || !positive(entry.packageBytes, MAX_PACKAGE_BYTES) || !hash.test(entry.packageSHA256) || !positive(entry.photoCount, 500) || !positive(entry.wordCount, 5000)) fail();
    ids.add(entry.deckID);
    for (const field of ['packageURL', 'coverURL']) {
      let url; try { url = new URL(entry[field]); } catch { fail(); }
      if (url.origin !== 'https://piclex.v2fy.com' || url.username || url.password || url.hash || url.search || !['/decks/', '/public/subscriptions/'].some(prefix => url.pathname.startsWith(prefix))) fail();
    }
  }
  return snapshot;
}

export function parsePublicCatalog(value) {
  if (!Array.isArray(value) || !value.length || value.length > 1000) fail();
  const ids = new Set();
  for (const card of value) {
    if (!card || !uuid.test(card.id) || ids.has(card.id) || !string(card.title, 1, 80) || !string(card.description, 0, 2000) || !positive(card.count, 5000) || !positive(card.photoCount, 500) || !hash.test(card.fingerprint) || !hash.test(card.payloadSHA256) || ![card.cover, card.package, card.payload].every(assetPath) || !card.preview || !string(card.preview.english, 1, 100) || !string(card.preview.chinese, 1, 200)) fail();
    ids.add(card.id);
  }
  return value;
}

/** Public practice reads a small checked JSON file; images are fetched only when shown. */
export async function parsePublicDeck(bytes, card) {
  if (!(bytes instanceof Uint8Array) || bytes.length > 8 * 1024 * 1024 || await sha256(bytes) !== card.payloadSHA256) fail();
  let value; try { value = JSON.parse(new TextDecoder().decode(bytes)); } catch { fail(); }
  if (value.format !== 'com.piclex.web-deck' || value.schemaVersion !== 1 || value.deckID !== card.id || value.fingerprint !== card.fingerprint || !string(value.title, 1, 80) || !Array.isArray(value.photos) || value.photos.length !== card.photoCount || !Array.isArray(value.words) || value.words.length !== card.count) fail();
  for (const photo of value.photos) if (!photo || !uuid.test(photo.id) || !assetPath(photo.path)) fail();
  for (const word of value.words) {
    if (!word || !string(word.id, 1, 200) || !string(word.english, 1, 100) || !string(word.chinese, 1, 200) || !Number.isInteger(word.imageIndex) || word.imageIndex < 0 || word.imageIndex >= value.photos.length || !string(word.example, 0, 2000) || !string(word.exampleChinese, 0, 2000) || !string(word.phonetic, 0, 200) || !string(word.partOfSpeech, 0, 50)) fail();
    if (word.focus && (word.focus.visible !== true || !Array.isArray(word.focus.box) || word.focus.box.length !== 4 || !word.focus.box.every(n => Number.isFinite(n) && n >= 0 && n <= 1))) fail();
  }
  return value;
}
