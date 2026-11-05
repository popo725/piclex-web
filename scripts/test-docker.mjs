// Integration check against an actual running image; no model API calls.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const origin = new URL(process.argv[2] || 'http://127.0.0.1:18121');
const base = new URL('/piclex-web/', origin);
let checked = 0;
async function request(path, options = {}) {
  checked++;
  return fetch(new URL(path, base), { signal: AbortSignal.timeout(15000), ...options });
}
for (const [path, status] of [['/', 302], ['/piclex-web', 308]]) {
  const response = await request(path, { redirect: 'manual' });
  assert.equal(response.status, status);
  assert.equal(response.headers.get('location'), '/piclex-web/');
}
const index = await request('');
assert.equal(index.status, 200);
assert.match(index.headers.get('cache-control'), /no-cache/);
const html = await index.text();
assert.match(html, /id="root"/);
const modules = [...html.matchAll(/(?:src|href)="(\/piclex-web\/assets\/[^" ]+\.(?:js|css))"/g)].map(m => m[1]);
assert.ok(modules.length >= 2, 'JS and CSS entry points exist');
for (const path of modules) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('content-type'), path.endsWith('.js') ? /javascript/ : /text\/css/);
  assert.match(response.headers.get('cache-control'), /immutable/);
}
for (const path of ['subscribe/', 'lab/', 'credits.html']) assert.equal((await request(path)).status, 200, path);
for (const path of ['assets/missing.js', 'library/missing.json', '../not-a-route']) assert.equal((await request(path)).status, 404, path);
const catalogResponse = await request('library/catalog.json');
assert.equal(catalogResponse.status, 200);
assert.match(catalogResponse.headers.get('cache-control'), /no-cache/);
const catalog = await catalogResponse.json();
assert.ok(catalog.length > 0);
const sourceResponse = await request('source.json');
assert.equal(sourceResponse.status, 200);
const source = await sourceResponse.json();
assert.equal(source.decks.length, catalog.length);
let photos = 0, words = 0, audioChecked = false;
for (const card of catalog) {
  const response = await request(card.payload);
  assert.equal(response.status, 200, card.payload);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha256').update(bytes).digest('hex'), card.payloadSHA256);
  const deck = JSON.parse(bytes);
  assert.equal(deck.photos.length, card.photoCount);
  assert.equal(deck.words.length, card.count);
  photos += deck.photos.length; words += deck.words.length;
  const packageResponse = await request(card.package, { method: 'HEAD' });
  assert.equal(packageResponse.status, 200);
  const descriptor = source.decks.find(d => d.deckID === card.id);
  assert.equal(Number(packageResponse.headers.get('content-length')), descriptor.packageBytes);
  assert.equal(new URL(descriptor.packageURL, origin).origin, origin.origin);
  assert.equal((await request(card.cover)).status, 200);
  for (const path of Object.values(card.covers || {})) assert.equal((await request(path, {method:'HEAD'})).status, 200);
  // Check every image with bounded concurrency, without decoding user data.
  for (let i = 0; i < deck.photos.length; i += 8) {
    await Promise.all(deck.photos.slice(i, i + 8).map(async photo => {
      const result = await request(photo.path, { method:'HEAD' });
      assert.equal(result.status, 200, photo.path);
      assert.match(result.headers.get('content-type'), /^image\//);
    }));
  }
  const audio = deck.words.find(w => w.audio?.path)?.audio;
  if (audio) {
    const result = await request(audio.path, { headers:{Range:'bytes=0-15'} });
    assert.equal(result.status, 206);
    assert.match(result.headers.get('content-type'), /audio/);
    assert.equal((await result.arrayBuffer()).byteLength, 16);
    audioChecked = true;
  }
}
console.log(JSON.stringify({ requests:checked, decks:catalog.length, photos, words, audioRange:audioChecked, status:'passed' }));
