import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { parsePublicCatalog, parsePublicDeck } from '../../../packages/deck-format/src/public.mjs';
import { parseArchive, MAX_PACKAGE_BYTES } from '../../../packages/deck-format/src/archive.mjs';
import { speak, stopSpeaking } from '../../../packages/learning-ui/src/speech';
import { readPreference, writePreference, saveDeck, storedDecks } from './storage';
import './style.css';
import NativePractice from './NativePractice';

type Parsed = Awaited<ReturnType<typeof parseArchive>>;
type Deck = { id: string; title: string; fingerprint: string; legacyFingerprints?: string[]; covers?: Partial<Record<"landscape" | "portrait", string>>; words: Parsed["words"]; images: string[]; bytes?: Uint8Array; downloadURL?: string };
type Card = { id: string; title: string; description: string; count: number; cover: string; covers?: Partial<Record<"landscape" | "portrait", string>>; progressAliases?: string[]; package?: string; local?: boolean; credit?: string; source?: string; payload?: string; payloadSHA256?: string; fingerprint?: string; photoCount?: number; preview?: { english: string; chinese: string } };
const asset = (path: string) => new URL(import.meta.env.BASE_URL + path, location.href).href;
const appStore = 'https://apps.apple.com/app/id6808490052';
const repository = 'https://github.com/zhaoolee/piclex-web';
const cache = new Map<string, Deck>();
function route() { try { return decodeURIComponent(location.hash.match(/^#\/deck\/(.+)$/)?.[1] || ''); } catch { return ''; } }
function go(id = '') { location.hash = id ? `/deck/${encodeURIComponent(id)}` : '/'; }
function materialize(id: string, parsed: Parsed, bytes: Uint8Array, aliases: string[] = []): Deck {
  const covers = Object.fromEntries(Object.entries(parsed.covers).map(([role, image]) => [role, URL.createObjectURL(new Blob([image.bytes as BlobPart], { type: image.mime }))]));
  const deck = { ...parsed, id, bytes, covers, fingerprint: parsed.learningFingerprint, legacyFingerprints: [...new Set([...aliases, parsed.fingerprint])], images: parsed.photos.map(p => URL.createObjectURL(new Blob([p.bytes as BlobPart], { type: p.mime }))) };
  const previous = cache.get(id);
  if (previous?.bytes) for (const url of [...previous.images, ...Object.values(previous.covers || {})]) URL.revokeObjectURL(url);
  cache.set(id, deck); return deck;
}
function download(bytes: Uint8Array, title: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/zip' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = title.replace(/[\\/:*?"<>|]/g, '-') + '.piclexdeck'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function downloadDeck(deck: Deck) {
  if (deck.bytes) { download(deck.bytes, deck.title); return; }
  if (deck.downloadURL) { const anchor = document.createElement('a'); anchor.href = deck.downloadURL; anchor.download = deck.title + '.piclexdeck'; anchor.click(); }
}
function Icon({ name }: { name: 'camera' | 'arrow' | 'sound' | 'upload' | 'sun' | 'moon' | 'share' | 'check' }) {
  const paths = { camera: <><rect x="3" y="6" width="18" height="14" rx="3"/><path d="m8 6 2-3h4l2 3"/><circle cx="12" cy="13" r="4"/></>, arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>, sound: <><path d="m11 4-5 4H3v8h3l5 4zM15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14"/></>, upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/></>, sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></>, moon: <path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>, share: <><path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8"/></>, check: <path d="m5 12 4 4L19 6"/> };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function App() {
  const [cards, setCards] = useState<Card[]>([]), [selected, setSelected] = useState(route), [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true), [ready, setReady] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [importing, setImporting] = useState(false);
  const [dark, setDark] = useState(() => readPreference('piclex-web.theme') === 'dark');
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; writePreference('piclex-web.theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => { const update = () => { stopSpeaking(); setSelected(route()); setError(''); }; window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  useEffect(() => { const hide = () => { if (document.hidden) stopSpeaking(); }; document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', stopSpeaking); return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', stopSpeaking); }; }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(asset('library/catalog.json')); if (!response.ok) throw new Error('公开卡组暂时无法加载，请刷新重试。');
        const builtin: Card[] = parsePublicCatalog(await response.json());
        const imported: Card[] = [];
        try {
          for (const stored of await storedDecks()) {
            try {
              const bytes = new Uint8Array(stored.bytes); const parsed = await parseArchive(bytes);
              let d = cache.get(stored.id); if (!d) d = materialize(stored.id, parsed, bytes, stored.progressAliases);
              imported.push({ id: stored.id, title: d.title, count: d.words.length, description: '你自己的照片与词汇', cover: d.images[0], covers: d.covers, local: true });
            } catch { if (!cancelled) setNotice('有一份本地卡组暂时无法读取，原文件仍保存在浏览器中。'); }
          }
        } catch { if (!cancelled) setNotice('浏览器未开放卡组存储，仍可体验公开卡组。'); }
        if (!cancelled) { setCards([...builtin, ...imported]); setReady(true); setLoading(false); }
      } catch (e) { if (!cancelled) { setError((e as Error).message); setLoading(false); } }
    })(); return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!ready || !selected) { setDeck(null); return; }
    const card = cards.find(c => c.id === selected);
    if (!card) { setDeck(null); setError('没有找到这份卡组。本地导入的卡组只在当前浏览器可用。'); return; }
    if (cache.has(selected)) { setDeck(cache.get(selected)!); setLoading(false); return; }
    const controller = new AbortController(); setLoading(true); setDeck(null);
    (async () => {
      try {
        const response = await fetch(asset(card.payload!), { signal: controller.signal }); if (!response.ok) throw new Error('卡组暂时无法加载，请返回后重试。');
        const bytes = new Uint8Array(await response.arrayBuffer()); const parsed = await parsePublicDeck(bytes, card);
        if (!controller.signal.aborted) {
          const value: Deck = { id: selected, title: parsed.title, fingerprint: parsed.learningFingerprint || parsed.fingerprint, legacyFingerprints: card.progressAliases, words: parsed.words, images: parsed.photos.map((photo: { path: string }) => asset(photo.path)), downloadURL: asset(card.package!) };
          cache.set(selected, value); setDeck(value); setLoading(false);
        }
      } catch (e) { if (!controller.signal.aborted) { setError((e as Error).message); setLoading(false); } }
    })(); return () => controller.abort();
  }, [selected, cards, ready]);
  useEffect(() => { document.title = deck && selected ? `${deck.title} · 摄影学英语` : '摄影学英语 · 把眼前的生活，变成英语'; }, [deck, selected]);
  async function importFile(selectedFile?: File) {
    if (!selectedFile || importing) return;
    setImporting(true); setNotice('');
    try {
      if (selectedFile.size > MAX_PACKAGE_BYTES || !selectedFile.name.toLowerCase().endsWith('.piclexdeck')) throw new Error('请选择不超过 64 MB 的 .piclexdeck 卡组。');
      const buffer = await selectedFile.arrayBuffer(), bytes = new Uint8Array(buffer), parsed = await parseArchive(bytes);
      const existing = [...cache.values()].find(d => d.bytes && d.fingerprint === parsed.learningFingerprint);
      const id = existing?.id || `local-${parsed.learningFingerprint}`;
      const progressAliases = existing?.legacyFingerprints || [];
      await saveDeck({ id, title: parsed.title, bytes: buffer, progressAliases, addedAt: Date.now() });
      const value = materialize(id, parsed, bytes, progressAliases);
      const card: Card = { id, title: value.title, count: value.words.length, description: '你自己的照片与词汇', cover: value.images[0], covers: value.covers, local: true };
      setCards(current => current.some(c => c.id === id) ? current.map(c => c.id === id ? card : c) : [...current, card]);
      setNotice('卡组已保存到当前浏览器。'); go(id);
    } catch (e) { setNotice((e as Error).message); }
    finally { setImporting(false); if (file.current) file.current.value = ''; }
  }
  const featured = cards.find(card => !card.local);
  const cover = (card: Card, role: "landscape" | "portrait") => { const path = card.covers?.[role] || card.covers?.landscape || card.covers?.portrait || card.cover; return card.local ? path : asset(path); };
  return <><a className="skip-link" href="#main-content">跳到内容</a><header className="site-header"><a className="brand" href="#/" aria-label="摄影学英语 首页"><span className="brand-mark"><Icon name="camera"/></span><strong>摄影学英语</strong></a><nav aria-label="主导航"><a className="nav-github" href={repository} target="_blank" rel="noreferrer">GitHub ↗</a><button className="icon-button" aria-label={dark ? '切换浅色外观' : '切换深色外观'} onClick={() => setDark(v => !v)}><Icon name={dark ? 'sun' : 'moon'}/></button><a className="header-app" href={appStore} target="_blank" rel="noreferrer">获取 iPhone App <span aria-hidden="true">↗</span></a></nav></header>
    <div id="main-content" tabIndex={-1}>
    {error ? <main className="empty-state"><h1>暂时无法打开</h1><p>{error}</p><button className="primary" onClick={() => selected ? go() : location.reload()}>{selected ? '返回全部卡组' : '重新加载'}</button></main> : selected ? loading || !deck || deck.id !== selected ? <main className="empty-state" aria-live="polite">正在准备卡组…</main> : <NativePractice key={deck.fingerprint} deck={deck} notify={setNotice} exit={() => go()} download={() => downloadDeck(deck)} share={async () => {
          if (selected.startsWith('local-')) { downloadDeck(deck); setNotice('卡组已导出，可将文件发给朋友。'); return; }
          try { await navigator.clipboard.writeText(location.href); setNotice('练习链接已复制。'); } catch { setNotice('请复制浏览器地址栏中的练习链接。'); }
        }}/> : <main className="home">
      <section className="hero"><div className="hero-copy"><p className="eyebrow">EVERYDAY SCENES. EVERYDAY ENGLISH.</p><h1>把眼前的生活，<br/><span>变成英语。</span></h1><p className="hero-description">从一张照片开始。看见场景，听见发音，<br className="desktop-break"/>亲手拼出那个词，让记忆有画面。</p><button className="primary" disabled={!featured} onClick={() => featured && go(featured.id)}>开始练习 <Icon name="arrow"/></button><p className="hero-note">免费体验 · 无需登录 · 进度保存在浏览器</p></div><button className="hero-photo" disabled={!featured} onClick={() => featured && go(featured.id)} aria-label={featured ? `开始${featured.title}卡组` : "正在加载公开卡组"}>{featured && <><img src={cover(featured, "landscape")} alt={featured.title}/><span className="hero-photo-label"><span>{featured.photoCount} 个场景 · {featured.count} 个词</span><strong>{featured.title} <Icon name="arrow"/></strong></span></>}</button></section>
      <section className="decks-section" aria-labelledby="decks-title"><div className="section-title"><div><p className="eyebrow">YOUR NEXT SMALL DISCOVERY</p><h2 id="decks-title">今天，想学哪套卡组？</h2></div><button className="text-button" onClick={() => file.current?.click()} disabled={importing || !ready}><Icon name="upload"/>{importing ? '正在导入…' : '导入自己的卡组'}</button></div><div className="deck-grid">{cards.map((card) => <button className="deck-card" key={card.id} onClick={() => go(card.id)}><div className="deck-cover"><img src={cover(card, "portrait")} alt={card.title} loading="lazy"/></div><div className="deck-caption"><h3>{card.title}</h3><Icon name="arrow"/><p>{card.description}</p><span>{card.local ? '我的卡组 · ' : ''}{card.photoCount ? `${card.photoCount} 张卡片 · ` : ''}{card.count} 个词</span></div></button>)}</div>{loading && <p role="status">正在加载卡组…</p>}<p className="import-note">支持 App 导出的 .piclexdeck 文件，最多 64 MB。照片只保存在当前浏览器。</p></section>
      <section className="home-app"><div className="app-icon"><Icon name="camera"/></div><div><h2>你的照片，就是你的词书。</h2><p>用摄影学英语 iPhone App 拍照制卡，在自己的生活里持续练习。</p></div><a className="secondary" href={appStore} target="_blank" rel="noreferrer">探索 iPhone App <Icon name="arrow"/></a></section>
    </main>}
    </div><footer><span>摄影学英语 · 让记忆有画面</span><div><a href={repository} target="_blank" rel="noreferrer">开源代码</a><a href={asset('credits.html')} target="_blank" rel="noreferrer">素材与隐私</a><span>Made for little discoveries.</span></div></footer>
    <input ref={file} className="file-input" type="file" accept=".piclexdeck" aria-label="选择照片卡组文件" onChange={e => void importFile(e.target.files?.[0])}/>
    {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="关闭提示" onClick={() => setNotice('')}>×</button></div>}
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
