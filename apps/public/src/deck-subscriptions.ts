import {sha256 as nobleSHA256} from '@noble/hashes/sha2.js';
import {strFromU8, strToU8, unzipSync, zipSync} from 'fflate';
import {downloadBytes} from '../../../packages/learning-ui/src/download.mjs';
import {MAX_PACKAGE_BYTES, parseArchive, sha256} from '../../../packages/deck-format/src/archive.mjs';
import {deckURL, parseDeckSource, sourceOrigin, type SourceDeck} from './deck-source';
import {
  loadStoredDeck, loadStoredSubscription as readStoredSubscription, saveDeckAndSubscription,
  saveStoredSubscription as writeStoredSubscription, storedSubscriptions,
  type StoredDeck,
} from './storage';

const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const hash = /^[\da-f]{64}$/;
const sourceLimit = 2 * 1024 * 1024;
const deckPrefix = 'local-sub-';

export const subscriptionMessages = {
  invalid: '这个链接不是有效的摄影学英语卡组订阅。',
  corrupt: '卡组校验失败，原有卡片和学习记录已保留。',
  versionConflict: '订阅版本与已下载内容不一致，原有内容已保留。',
  inactive: '这个卡组已取消订阅，请先恢复订阅。',
  busy: '这个卡组正在下载，请稍后重试。',
  unavailable: '暂时无法连接订阅来源，请稍后重试。已下载内容仍可使用。',
  missingDeck: '订阅记录仍在，但本地卡组暂时无法读取。已保留原记录。',
  missingFeed: '订阅来源中找不到这个卡组，已下载内容仍然保留。',
  record: '订阅记录暂时无法读取，已下载卡组仍然保留。',
} as const;

export type SubscriptionCardRecord = {
  sourceID: string;
  localID: string;
  sourceFingerprint: string;
  imageSHA256: string;
  removedByAuthor: boolean;
};

/** The source feed URL may move within one origin. Origin + publisher deck UUID is identity. */
export type DeckSubscriptionRecord = {
  storageVersion: 1;
  id: string;
  sourceURL: string;
  origin: string;
  sourceDeckID: string;
  title: string;
  author: string;
  description: string;
  version: number;
  photoCount: number;
  wordCount: number;
  packageURL: string;
  packageBytes: number;
  packageSHA256: string;
  active: boolean;
  autoUpdateWiFi: boolean;
  createdAt: number;
  updatedAt: number;
  fingerprint: string;
  progressAliases: string[];
  cards: SubscriptionCardRecord[];
  newCardIDs: string[];
  preserved: number;
  memberCount: number;
};

export type SubscriptionInstallResult = {
  status: 'installed' | 'updated' | 'unchanged';
  id: string;
  version: number;
  fingerprint: string;
  added: number;
  updated: number;
  preserved: number;
  newCardIDs: string[];
  record: DeckSubscriptionRecord;
};

export type SubscriptionCheck = {
  status: 'current' | 'available';
  feed: SourceDeck;
  record: DeckSubscriptionRecord;
};

export type SubscriptionArchivePlan = {
  bytes: Uint8Array;
  fingerprint: string;
  cards: SubscriptionCardRecord[];
  added: number;
  updated: number;
  preserved: number;
  newCardIDs: string[];
  memberCount: number;
  wordCount: number;
};

export type SubscriptionListener = (change: {
  type: 'installed' | 'updated' | 'unchanged' | 'cancelled' | 'resumed';
  id: string;
  record: DeckSubscriptionRecord;
  result?: SubscriptionInstallResult;
}) => void;

type FetchLike = typeof fetch;
type Options = {signal?: AbortSignal; fetcher?: FetchLike};

const installing = new Set<string>();
const listeners = new Set<SubscriptionListener>();

const noCredentials: FetchLike = (input, init) => fetch(input, {...init, credentials: 'omit', referrerPolicy: 'no-referrer'});

export function onSubscriptionChange(listener: SubscriptionListener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function announce(change: Parameters<SubscriptionListener>[0]) {
  for (const listener of [...listeners]) {
    try { listener(change); } catch { /* A listener must not corrupt a committed install. */ }
  }
  if (typeof window !== 'undefined') {
    try { window.dispatchEvent(new CustomEvent('piclex-deck-subscription-changed', {detail: change})); } catch { /* no DOM */ }
  }
}

function bytesToUUID(bytes: Uint8Array) {
  const value = new Uint8Array(bytes.slice(0, 16));
  value[6] = (value[6] & 0x0f) | 0x40;
  value[8] = (value[8] & 0x3f) | 0x80;
  const hex = [...value].map(n => n.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function identity(text: string) {
  return bytesToUUID(nobleSHA256(new TextEncoder().encode(text)));
}

function deckUUID(id: string) {
  return id.startsWith(deckPrefix) ? id.slice(deckPrefix.length) : id;
}

/** Stable local deck id: origin + publisher deck UUID. A moved feed path is the same deck. */
export function subscriptionDeckID(source: string, sourceDeckID: string) {
  if (!uuid.test(sourceDeckID)) throw Error(subscriptionMessages.invalid);
  return deckPrefix + identity(`piclex.subscription.v1/${sourceOrigin(source)}/${sourceDeckID.toLowerCase()}`);
}

/** Stable local card id: deck identity + publisher photo UUID. */
export function subscriptionCardID(id: string, sourceID: string) {
  if (!uuid.test(sourceID)) throw Error(subscriptionMessages.corrupt);
  return identity(`piclex.subscription.card.v1/${deckUUID(id).toLowerCase()}/${sourceID.toLowerCase()}`);
}

export function mergeProgressAliases(...groups: (string[] | undefined)[]) {
  const values: string[] = [];
  for (const group of groups) for (const value of group || []) if (hash.test(value) && !values.includes(value)) values.push(value);
  return values.slice(-100);
}

export function assertSubscriptionVersion(feed: Pick<SourceDeck, 'version' | 'packageSHA256'>, record: Pick<DeckSubscriptionRecord, 'version' | 'packageSHA256'>) {
  if (feed.version < record.version || (feed.version === record.version && feed.packageSHA256 !== record.packageSHA256)) {
    throw Error(subscriptionMessages.versionConflict);
  }
}

function isCard(value: any): value is SubscriptionCardRecord {
  return !!value && typeof value === 'object'
    && typeof value.sourceID === 'string' && uuid.test(value.sourceID)
    && typeof value.localID === 'string' && uuid.test(value.localID)
    && typeof value.sourceFingerprint === 'string' && hash.test(value.sourceFingerprint)
    && typeof value.imageSHA256 === 'string' && hash.test(value.imageSHA256)
    && typeof value.removedByAuthor === 'boolean';
}

function assertRecord(value: any): DeckSubscriptionRecord {
  if (!value || typeof value !== 'object' || value.storageVersion !== 1
    || typeof value.id !== 'string' || typeof value.sourceURL !== 'string' || typeof value.sourceDeckID !== 'string'
    || typeof value.origin !== 'string' || typeof value.title !== 'string' || typeof value.author !== 'string'
    || typeof value.description !== 'string' || !Number.isSafeInteger(value.version) || value.version < 1
    || !Number.isSafeInteger(value.photoCount) || value.photoCount < 0 || !Number.isSafeInteger(value.wordCount) || value.wordCount < 0
    || typeof value.packageURL !== 'string' || !Number.isSafeInteger(value.packageBytes) || value.packageBytes < 1
    || typeof value.packageSHA256 !== 'string' || !hash.test(value.packageSHA256)
    || typeof value.active !== 'boolean' || typeof value.autoUpdateWiFi !== 'boolean'
    || !Number.isFinite(value.createdAt) || !Number.isFinite(value.updatedAt)
    || typeof value.fingerprint !== 'string' || !hash.test(value.fingerprint)
    || !Array.isArray(value.progressAliases) || value.progressAliases.length > 100 || !value.progressAliases.every((item: unknown) => typeof item === 'string' && hash.test(item))
    || !Array.isArray(value.cards) || !value.cards.every(isCard)
    || !Array.isArray(value.newCardIDs) || !value.newCardIDs.every((item: unknown) => typeof item === 'string' && uuid.test(item))
    || !Number.isSafeInteger(value.preserved) || value.preserved < 0
    || !Number.isSafeInteger(value.memberCount) || value.memberCount < 0) throw Error(subscriptionMessages.record);
  try {
    if (value.id !== subscriptionDeckID(value.sourceURL, value.sourceDeckID) || value.origin !== sourceOrigin(value.sourceURL)) throw Error();
    if (new Set(value.cards.map((card: SubscriptionCardRecord) => card.sourceID)).size !== value.cards.length
      || new Set(value.cards.map((card: SubscriptionCardRecord) => card.localID)).size !== value.cards.length) throw Error();
    for (const card of value.cards) if (card.localID !== subscriptionCardID(value.id, card.sourceID)) throw Error();
  } catch { throw Error(subscriptionMessages.record); }
  return value as DeckSubscriptionRecord;
}

export async function listSubscriptions(): Promise<DeckSubscriptionRecord[]> {
  const records = await storedSubscriptions();
  if (!Array.isArray(records)) throw Error(subscriptionMessages.record);
  return records.map(assertRecord).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function subscriptionForDeck(id: string): Promise<DeckSubscriptionRecord | undefined> {
  const value = await readStoredSubscription(id);
  return value == null ? undefined : assertRecord(value);
}

async function requiredSubscription(id: string) {
  const record = await subscriptionForDeck(id);
  if (!record) throw Error(subscriptionMessages.record);
  return record;
}

function feedFrom(entries: SourceDeck[], deckID?: string) {
  if (deckID) {
    const found = entries.find(entry => entry.deckID === deckID.toLowerCase());
    if (!found) throw Error(subscriptionMessages.missingFeed);
    return found;
  }
  if (entries.length === 1) return entries[0];
  throw Error('这个来源包含多个卡组，请从列表选择要订阅的卡组。');
}

async function sourceEntries(source: string, {signal, fetcher = noCredentials}: Options = {}) {
  const address = deckURL(source);
  try {
    const {bytes} = await downloadBytes(address, {signal, maxBytes: sourceLimit, fetcher});
    return {address, entries: parseDeckSource(bytes, address)};
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof TypeError) throw Error(subscriptionMessages.unavailable);
    throw error;
  }
}

async function packageBytes(feed: SourceDeck, {signal, fetcher = noCredentials}: Options = {}) {
  try {
    const {bytes} = await downloadBytes(feed.packageURL, {signal, maxBytes: MAX_PACKAGE_BYTES, fetcher});
    return bytes;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof TypeError) throw Error(subscriptionMessages.unavailable);
    throw error;
  }
}

export async function checkSubscription(recordOrID: string | DeckSubscriptionRecord, options: Options = {}): Promise<SubscriptionCheck> {
  const record = typeof recordOrID === 'string' ? await requiredSubscription(recordOrID) : recordOrID;
  if (!record.active) throw Error(subscriptionMessages.inactive);
  options.signal?.throwIfAborted();
  const {address, entries} = await sourceEntries(record.sourceURL, options);
  const feed = feedFrom(entries, record.sourceDeckID);
  if (feed.packageURL === '' || subscriptionDeckID(address, feed.deckID) !== record.id) throw Error(subscriptionMessages.invalid);
  assertSubscriptionVersion(feed, record);
  return {status: feed.version > record.version ? 'available' : 'current', feed, record};
}

export async function updateSubscription(id: string, options: Options = {}): Promise<SubscriptionInstallResult> {
  const record = await requiredSubscription(id);
  if (!record.active) throw Error(subscriptionMessages.inactive);
  const checked = await checkSubscription(record, options);
  if (checked.status === 'current') {
    return {status: 'unchanged', id, version: record.version, fingerprint: record.fingerprint, added: 0, updated: 0,
      preserved: record.preserved, newCardIDs: [], record};
  }
  const bytes = await packageBytes(checked.feed, options);
  return installSubscription({bytes, source: record.sourceURL, feed: checked.feed, signal: options.signal, fetcher: options.fetcher});
}

export async function installSubscription({bytes, source, feed, signal, fetcher, resubscribe = false}: {
  bytes: Uint8Array;
  source: string;
  feed: SourceDeck;
  signal?: AbortSignal;
  fetcher?: FetchLike;
  resubscribe?: boolean;
}): Promise<SubscriptionInstallResult> {
  const address = deckURL(source);
  if (sourceOrigin(feed.packageURL) !== sourceOrigin(address) || feed.packageURL === '') throw Error(subscriptionMessages.invalid);
  const id = subscriptionDeckID(address, feed.deckID);
  if (installing.has(id)) throw Error(subscriptionMessages.busy);
  installing.add(id);
  try {
    signal?.throwIfAborted();
    if (bytes.length !== feed.packageBytes || await sha256(bytes) !== feed.packageSHA256) throw Error(subscriptionMessages.corrupt);
    signal?.throwIfAborted();
    const previous = await subscriptionForDeck(id);
    const previousDeck = await loadStoredDeck(id);
    if (previousDeck && !previous) throw Error(subscriptionMessages.missingDeck);
    if (previous && !previousDeck) throw Error(subscriptionMessages.missingDeck);
    if (previous) {
      if (!previous.active && !resubscribe) throw Error(subscriptionMessages.inactive);
      assertSubscriptionVersion(feed, previous);
      if (feed.version === previous.version && feed.packageSHA256 === previous.packageSHA256) {
        if (!previousDeck) throw Error(subscriptionMessages.missingDeck);
        const next: DeckSubscriptionRecord = {...previous, sourceURL: address, origin: sourceOrigin(address),
          title: feed.title, author: feed.author, description: feed.description, packageURL: feed.packageURL,
          packageBytes: feed.packageBytes, active: true};
        const changed = ['sourceURL', 'title', 'author', 'description', 'packageURL', 'packageBytes', 'active']
          .some(key => (previous as any)[key] !== (next as any)[key]);
        if (changed) {
          next.updatedAt = Date.now();
          await writeStoredSubscription(next, signal, previous);
          announce({type: 'unchanged', id, record: next});
        }
        return {status: 'unchanged', id, version: next.version, fingerprint: next.fingerprint, added: 0, updated: 0,
          preserved: next.preserved, newCardIDs: [], record: next};
      }
    }
    const plan = await buildSubscriptionArchive({bytes, feed, id, previousBytes: previousDeck ? new Uint8Array(previousDeck.bytes) : undefined, previous});
    signal?.throwIfAborted();
    const now = Date.now();
    const progressAliases = mergeProgressAliases(previous ? [previous.fingerprint, ...previous.progressAliases] : [])
      .filter(value => value !== plan.fingerprint);
    const record: DeckSubscriptionRecord = {
      storageVersion: 1, id, sourceURL: address, origin: sourceOrigin(address), sourceDeckID: feed.deckID.toLowerCase(),
      title: feed.title, author: feed.author, description: feed.description, version: feed.version,
      photoCount: plan.memberCount, wordCount: plan.wordCount, packageURL: feed.packageURL,
      packageBytes: feed.packageBytes, packageSHA256: feed.packageSHA256, active: true,
      autoUpdateWiFi: previous?.autoUpdateWiFi ?? false, createdAt: previous?.createdAt ?? now, updatedAt: now,
      fingerprint: plan.fingerprint, progressAliases, cards: plan.cards, newCardIDs: plan.newCardIDs,
      preserved: plan.preserved, memberCount: plan.memberCount,
    };
    const deck: StoredDeck = {id, title: feed.title, bytes: plan.bytes.slice().buffer,
      addedAt: previousDeck?.addedAt ?? now, progressAliases, subscribed: true};
    await saveDeckAndSubscription(deck, record, signal, {record:previous,deck:previousDeck});
    const result: SubscriptionInstallResult = {status: previous ? 'updated' : 'installed', id, version: record.version,
      fingerprint: record.fingerprint, added: plan.added, updated: plan.updated, preserved: plan.preserved,
      newCardIDs: plan.newCardIDs, record};
    announce({type: result.status, id, record, result});
    return result;
  } finally {
    installing.delete(id);
  }
}

export async function cancelSubscription(id: string, signal?: AbortSignal) {
  const record = await requiredSubscription(id);
  if (installing.has(id)) throw Error(subscriptionMessages.busy);
  if (!record.active) return record;
  const next: DeckSubscriptionRecord = {...record, active: false, updatedAt: Date.now()};
  await writeStoredSubscription(next, signal, record);
  announce({type: 'cancelled', id, record: next});
  return next;
}

export async function resumeSubscription(id: string, signal?: AbortSignal) {
  const record = await requiredSubscription(id);
  if (installing.has(id)) throw Error(subscriptionMessages.busy);
  if (record.active) return record;
  const next: DeckSubscriptionRecord = {...record, active: true, updatedAt: Date.now()};
  await writeStoredSubscription(next, signal, record);
  announce({type: 'resumed', id, record: next});
  return next;
}

function canonical(value: any): any {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value).sort()) result[key] = canonical(value[key]);
    return result;
  }
  return value;
}

async function sourceFingerprint(meta: any) {
  const {id: _id, imagePath: _imagePath, ...rest} = meta || {};
  return sha256(strToU8(JSON.stringify(canonical(rest))));
}

function extension(path: string) {
  const match = /\.([a-z0-9]{1,8})$/i.exec(path || '');
  return match ? `.${match[1].toLowerCase()}` : '';
}

function parseZip(bytes: Uint8Array) {
  const raw = unzipSync(bytes);
  if (!raw['manifest.json']) throw Error(subscriptionMessages.corrupt);
  let manifest: any;
  try { manifest = JSON.parse(strFromU8(raw['manifest.json'])); } catch { throw Error(subscriptionMessages.corrupt); }
  if (!manifest || !Array.isArray(manifest.photos)) throw Error(subscriptionMessages.corrupt);
  return {raw, manifest};
}

/**
 * Rewrites publisher photo UUIDs to stable local card IDs and merges cards the
 * author removed so their local photos and study progress stay available.
 * Returns an ordinary .piclexdeck archive; no side effects.
 */
export async function buildSubscriptionArchive({bytes, feed, id, previousBytes, previous}: {
  bytes: Uint8Array;
  feed: SourceDeck;
  id: string;
  previousBytes?: Uint8Array;
  previous?: DeckSubscriptionRecord;
}): Promise<SubscriptionArchivePlan> {
  let parsed: any;
  try { parsed = await parseArchive(bytes); } catch (error) { throw Error((error as Error).message || subscriptionMessages.corrupt); }
  if (parsed.photos.length !== feed.photoCount || parsed.words.length !== feed.wordCount) throw Error(subscriptionMessages.corrupt);
  const {raw, manifest} = parseZip(bytes);

  const oldLocalIDs = new Set((previous?.cards || []).map(card => card.localID));
  const oldBySource = new Map((previous?.cards || []).map(card => [card.sourceID, card]));
  const oldByLocal = new Map((previous?.cards || []).map(card => [card.localID, card]));
  if (oldBySource.size !== (previous?.cards || []).length || oldByLocal.size !== (previous?.cards || []).length) throw Error(subscriptionMessages.corrupt);
  for (const card of previous?.cards || []) if (card.localID !== subscriptionCardID(id, card.sourceID)) throw Error(subscriptionMessages.corrupt);

  const referenced = new Set<string>();
  for (const item of manifest.photos) {
    if (!item || typeof item.jsonPath !== 'string' || !raw[item.jsonPath]) throw Error(subscriptionMessages.corrupt);
    referenced.add(item.jsonPath);
    let meta: any;
    try { meta = JSON.parse(strFromU8(raw[item.jsonPath])); } catch { throw Error(subscriptionMessages.corrupt); }
    if (typeof meta?.imagePath !== 'string' || !raw[meta.imagePath]) throw Error(subscriptionMessages.corrupt);
    referenced.add(meta.imagePath);
  }

  type Entry = {sourceID?: string; localID: string; item: any; meta: any; image: Uint8Array; fingerprint: string; removedByAuthor: boolean; old?: SubscriptionCardRecord};
  const incoming: Entry[] = [];
  const incomingByLocal = new Map<string, Entry>();
  for (const item of manifest.photos) {
    const meta = JSON.parse(strFromU8(raw[item.jsonPath]));
    const sourceID = String(meta.id).toLowerCase();
    if (!uuid.test(sourceID)) throw Error(subscriptionMessages.corrupt);
    const localID = subscriptionCardID(id, sourceID);
    if (incomingByLocal.has(localID)) throw Error(subscriptionMessages.corrupt);
    const entry: Entry = {sourceID, localID, item, meta, image: raw[meta.imagePath], fingerprint: await sourceFingerprint(meta),
      removedByAuthor: false, old: oldBySource.get(sourceID)};
    incoming.push(entry);
    incomingByLocal.set(localID, entry);
  }

  let preservedCount = 0;
  const ordered: Entry[] = [];
  let previousManifest: any, previousRaw: Record<string, Uint8Array>;
  if (previousBytes) {
    try { const previousArchive = parseZip(previousBytes); previousManifest = previousArchive.manifest; previousRaw = previousArchive.raw; }
    catch { throw Error(subscriptionMessages.missingDeck); }
    for (const item of previousManifest.photos) {
      const localID = String(item?.id || '').toLowerCase();
      const found = incomingByLocal.get(localID);
      if (found) { ordered.push(found); incomingByLocal.delete(localID); continue; }
      const card = oldByLocal.get(localID);
      if (!card || !uuid.test(localID) || !previousRaw[item.jsonPath]) throw Error(subscriptionMessages.corrupt);
      let meta: any;
      try { meta = JSON.parse(strFromU8(previousRaw[item.jsonPath])); } catch { throw Error(subscriptionMessages.corrupt); }
      if (typeof meta?.imagePath !== 'string' || !previousRaw[meta.imagePath]) throw Error(subscriptionMessages.corrupt);
      ordered.push({localID, item, meta, image: previousRaw[meta.imagePath], fingerprint: card.sourceFingerprint,
        removedByAuthor: true, old: card});
      preservedCount += 1;
    }
  }
  for (const entry of incoming) if (incomingByLocal.has(entry.localID)) ordered.push(entry);

  const files: Record<string, Uint8Array> = {};
  for (const [name, data] of Object.entries(raw)) if (name !== 'manifest.json' && !referenced.has(name)) files[name] = data;
  const photos: any[] = [];
  const cards: SubscriptionCardRecord[] = [];
  for (const entry of ordered) {
    const ext = extension(entry.meta.imagePath);
    const imagePath = `photos/${entry.localID}${ext}`;
    const jsonPath = `photos/${entry.localID}.json`;
    if (Object.hasOwn(files, imagePath) || Object.hasOwn(files, jsonPath)) throw Error(subscriptionMessages.corrupt);
    const meta = {...entry.meta, id: entry.localID, imagePath};
    const json = strToU8(JSON.stringify(meta));
    files[imagePath] = entry.image;
    files[jsonPath] = json;
    photos.push({...entry.item, id: entry.localID, jsonPath, jsonSHA256: await sha256(json)});
    const old = entry.old, sourceID = entry.sourceID || old?.sourceID;
    if (!sourceID) throw Error(subscriptionMessages.corrupt);
    cards.push({sourceID, localID: entry.localID,
      sourceFingerprint: old && entry.removedByAuthor ? old.sourceFingerprint : entry.fingerprint,
      imageSHA256: String(meta.imageSHA256).toLowerCase(), removedByAuthor: entry.removedByAuthor});
  }
  const outgoingManifest = {...manifest, photoCount: photos.length, trashCount: 0, deckName: feed.title, photos};
  files['manifest.json'] = strToU8(JSON.stringify(outgoingManifest));

  let result: Uint8Array;
  try { result = zipSync(files, {level: 6}); } catch { throw Error(subscriptionMessages.corrupt); }
  let output: any;
  try { output = await parseArchive(result); } catch { throw Error(subscriptionMessages.corrupt); }
  if (output.photos.length !== photos.length) throw Error(subscriptionMessages.corrupt);

  const addedEntries = incoming.filter(entry => !oldLocalIDs.has(entry.localID));
  const updated = incoming.filter(entry => entry.old && entry.old.sourceFingerprint !== entry.fingerprint).length;
  return {bytes: result, fingerprint: output.learningFingerprint, cards, added: addedEntries.length,
    updated, preserved: preservedCount, newCardIDs: addedEntries.map(entry => entry.localID),
    memberCount: output.photos.length, wordCount: output.words.length};
}
