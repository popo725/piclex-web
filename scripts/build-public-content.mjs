import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArchive } from '../packages/deck-format/src/archive.mjs';
import { validateSnapshot } from '../packages/deck-format/src/public.mjs';

const root = resolve('apps/public/public');
const snapshot = validateSnapshot(JSON.parse(await readFile('content/snapshot.json', 'utf8')));
const temporary = await mkdtemp(join(tmpdir(), 'piclex-library-'));
const suppliedCache = process.env.PICLEX_CONTENT_CACHE;
const cache = suppliedCache ? resolve(suppliedCache) : join(temporary, 'downloads');
const output = join(temporary, 'library');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = [], source = { format: 'com.piclex.deck-source', schemaVersion: 1, title: 'PicLex 公开卡组', decks: [] };
await mkdir(cache, { recursive: true });
await mkdir(output);
async function obtain(name, url, maximum) {
  const path = join(cache, name);
  try { return await readFile(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  // No redirects, authentication, cookies, or private API. curl works with the public CDN.
  execFileSync('curl', ['--fail', '--silent', '--show-error', '--retry', '2', '--max-time', '180', '--max-filesize', String(maximum), '--output', path, url]);
  return readFile(path);
}
try {
  for (const entry of snapshot.decks) {
    const bytes = await obtain(`${entry.packageSHA256}.piclexdeck`, entry.packageURL, entry.packageBytes);
    if (bytes.length !== entry.packageBytes || digest(bytes) !== entry.packageSHA256) throw new Error(`Public package integrity failed: ${entry.deckID}`);
    const parsed = await parseArchive(new Uint8Array(bytes));
    if (parsed.photos.length !== entry.photoCount || parsed.words.length !== entry.wordCount) throw new Error(`Public package counts differ: ${entry.deckID}`);
    const name = `${entry.deckID}/v${entry.version}-${entry.packageSHA256.slice(0, 16)}`;
    const directory = join(output, name);
    await mkdir(join(directory, 'photos'), { recursive: true });
    const photos = [];
    for (const photo of parsed.photos) {
      const path = `photos/${photo.id}.${photo.mime === 'image/jpeg' ? 'jpg' : 'png'}`;
      await writeFile(join(directory, path), photo.bytes);
      photos.push({ id: photo.id, path: `library/${name}/${path}` });
    }
    const cover = await obtain(`${entry.packageSHA256}.jpg`, entry.coverURL, 4 * 1024 * 1024);
    if (cover.length > 4 * 1024 * 1024 || cover[0] !== 255 || cover[1] !== 216) throw new Error('Invalid public cover');
    await writeFile(join(directory, 'cover.jpg'), cover);
    await writeFile(join(directory, 'deck.piclexdeck'), bytes);
    const payload = JSON.stringify({ format: 'com.piclex.web-deck', schemaVersion: 1, deckID: entry.deckID, fingerprint: parsed.fingerprint, title: entry.title, photos, words: parsed.words });
    await writeFile(join(directory, 'deck.json'), payload);
    catalog.push({ id: entry.deckID, title: entry.title, description: entry.description, count: entry.wordCount, photoCount: entry.photoCount,
      cover: `library/${name}/cover.jpg`, package: `library/${name}/deck.piclexdeck`, payload: `library/${name}/deck.json`, payloadSHA256: digest(payload),
      fingerprint: entry.packageSHA256, author: entry.author, sourceURL: entry.sourceURL,
      preview: { english: parsed.words[0].english, chinese: parsed.words[0].chinese } });
    const { sourceURL, ...descriptor } = entry;
    source.decks.push({ ...descriptor, packageURL: `/piclex-web/library/${name}/deck.piclexdeck`, coverURL: `/piclex-web/library/${name}/cover.jpg` });
    console.log(`${entry.title}: ${parsed.photos.length} photos / ${parsed.words.length} words; lazy image payload ${Buffer.byteLength(payload)} bytes`);
  }
  await writeFile(join(output, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  // This directory contains generated public artifacts only; originals remain at their source URLs.
  await rm(join(root, 'library'), { recursive: true, force: true });
  await cp(output, join(root, 'library'), { recursive: true });
  await writeFile(join(root, 'source.json'), JSON.stringify(source, null, 2) + '\n');
} finally {
  await rm(temporary, { recursive: true, force: true });
}
