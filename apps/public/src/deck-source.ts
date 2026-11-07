import {MAX_PACKAGE_BYTES} from '../../../packages/deck-format/src/archive.mjs';

export type SourceDeck = {
  deckID: string;
  title: string;
  author: string;
  description: string;
  version: number;
  photoCount: number;
  wordCount: number;
  packageURL: string;
  packageBytes: number;
  packageSHA256: string;
  access: 'public' | 'storekit';
  coverURL?: string;
};

const invalid = (): never => { throw Error('这个链接不是有效的摄影学英语卡组来源。'); };
const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const sha256 = /^[\da-f]{64}$/;
const maxSourceBytes = 2 * 1024 * 1024;

/** Canonical HTTPS/HTTP source. Identity uses its origin, never the feed path. */
export function deckURL(value: string) {
  const text = value.trim();
  if (text.length > 4096 || text.includes('#') || /[\u0000-\u001f\u007f]/.test(text)) invalid();
  let url: URL;
  try { url = new URL(text); } catch { return invalid(); }
  if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) return invalid();
  if (url.port && !(Number(url.port) >= 1 && Number(url.port) <= 65535)) return invalid();
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) url.port = '';
  if (!url.pathname) url.pathname = '/';
  return url.href;
}

export function sourceOrigin(value: string) {
  return new URL(deckURL(value)).origin;
}

function resource(value: unknown, source: string) {
  if (typeof value !== 'string' || value.startsWith('//') || value.length > 4096 || /[\u0000-\u001f\u007f]/.test(value)) return invalid();
  const canonical = deckURL(value.startsWith('/') ? new URL(value, source).href : value);
  if (sourceOrigin(canonical) !== sourceOrigin(source)) return invalid();
  return canonical;
}

export function parseDeckSource(bytes: Uint8Array, source: string): SourceDeck[] {
  if (bytes.length > maxSourceBytes) return invalid();
  let doc: any;
  try { doc = JSON.parse(new TextDecoder().decode(bytes)); } catch { return invalid(); }
  // Legacy one-deck feeds are an input adapter. Stable deck/card IDs are not rewritten.
  if (doc?.format === 'com.piclex.deck-subscription' && doc.schemaVersion === 1) {
    doc = {format: 'com.piclex.deck-source', schemaVersion: 1, title: '', decks: [{...doc, access: doc.access === 'storekit' ? 'storekit' : 'public'}]};
  }
  if (doc?.format !== 'com.piclex.deck-source' || doc.schemaVersion !== 1 || !Array.isArray(doc.decks) || doc.decks.length > 1000) return invalid();
  const canonicalSource = deckURL(source), origin = sourceOrigin(canonicalSource), ids = new Set<string>();
  return doc.decks.map((entry: any) => {
    const deckID = typeof entry?.deckID === 'string' ? entry.deckID.toLowerCase() : '';
    const title = typeof entry?.title === 'string' ? entry.title.trim() : '';
    const author = typeof entry?.author === 'string' ? entry.author.trim() : '';
    const description = typeof entry?.description === 'string' ? entry.description : '';
    const access = entry?.access;
    if (!uuid.test(deckID) || ids.has(deckID) || !title || title.length > 80 || !author || author.length > 120 || description.length > 2000
      || !Number.isSafeInteger(entry?.version) || entry.version < 1 || entry.version > 999_999_999
      || !Number.isSafeInteger(entry?.photoCount) || entry.photoCount < 1 || entry.photoCount > 500
      || !Number.isSafeInteger(entry?.wordCount) || entry.wordCount < 0 || entry.wordCount > 5000
      || !Number.isSafeInteger(entry?.packageBytes) || entry.packageBytes < 1 || entry.packageBytes > MAX_PACKAGE_BYTES
      || typeof entry?.packageSHA256 !== 'string' || !sha256.test(entry.packageSHA256)
      || !['public', 'storekit'].includes(access) || typeof entry?.packageURL !== 'string') return invalid();
    ids.add(deckID);
    const packageURL = resource(entry.packageURL, canonicalSource);
    const coverURL = entry.coverURL == null ? undefined : resource(entry.coverURL, canonicalSource);
    if (new URL(packageURL).origin !== origin) return invalid();
    return {deckID, title, author, description, version: entry.version, photoCount: entry.photoCount, wordCount: entry.wordCount,
      packageURL, packageBytes: entry.packageBytes, packageSHA256: entry.packageSHA256, access, ...(coverURL ? {coverURL} : {})};
  });
}
