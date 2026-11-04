import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sourceURL,EXAMPLES} from '../packages/subscription/links.mjs';
test('QR payloads are the exact existing subscription URLs',()=>{for(const e of EXAMPLES)assert.equal(sourceURL(e.source),e.source);});
test('arbitrary HTTPS publishers and query strings work without domain binding',()=>{for(const s of ['https://author.example/feed.json','https://another.example:8443/feed?a=1&b=%E4%B8%AD'])assert.equal(sourceURL(s),s);});
test('reject unsafe sources',()=>{for(const s of ['http://example.com/x','https://user:pass@example.com/x','https://example.com/x#fragment','https://example.com/x#','javascript:alert(1)','piclex://subscribe','https://example.com/\nfeed','https://example.com/a b','https://example.com/\\evil'])assert.throws(()=>sourceURL(s));});
