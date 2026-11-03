import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { parseArchive, MAX_PACKAGE_BYTES } from '../../../packages/deck-format/src/archive.mjs';
import { newSession, questionKey, reduceSession, restoreSession } from '../../../packages/practice/src/session.mjs';
import { PhotoFocus } from '../../../packages/learning-ui/src/PhotoFocus';
import { AnswerSlots } from '../../../packages/learning-ui/src/AnswerSlots';
import { maskExample, mismatch } from '../../../packages/learning-ui/src/spelling.mjs';
import { speak, stopSpeaking } from '../../../packages/learning-ui/src/speech';
import { readPreference, writePreference, saveDeck, storedDecks } from './storage';
import './style.css';

type Parsed = Awaited<ReturnType<typeof parseArchive>>;
type Deck = Parsed & { id: string; images: string[]; bytes: Uint8Array };
type Session = ReturnType<typeof newSession>;
type Card = { id: string; title: string; description: string; count: number; cover: string; package?: string; local?: boolean; credit?: string; source?: string };
const asset = (path: string) => new URL(import.meta.env.BASE_URL + path, location.href).href;
const appStore = 'https://apps.apple.com/app/id6808490052';
const repository = 'https://github.com/zhaoolee/piclex-web';
const cache = new Map<string, Deck>();
const progressKey = (deck: Deck) => `piclex-web.progress.v1.${deck.fingerprint}`;
function route() { try { return decodeURIComponent(location.hash.match(/^#\/deck\/(.+)$/)?.[1] || ''); } catch { return ''; } }
function go(id = '') { location.hash = id ? `/deck/${encodeURIComponent(id)}` : '/'; }
function materialize(id: string, parsed: Parsed, bytes: Uint8Array): Deck {
  const deck = { ...parsed, id, bytes, images: parsed.photos.map(p => URL.createObjectURL(new Blob([p.bytes as BlobPart], { type: p.mime }))) };
  cache.set(id, deck); return deck;
}
function restore(deck: Deck) { try { return restoreSession(deck, JSON.parse(readPreference(progressKey(deck)) || 'null')); } catch { return newSession(deck); } }
function download(bytes: Uint8Array, title: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/zip' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = title.replace(/[\\/:*?"<>|]/g, '-') + '.piclexdeck'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function Icon({ name }: { name: 'camera' | 'arrow' | 'sound' | 'upload' | 'sun' | 'moon' | 'share' | 'check' }) {
  const paths = { camera: <><rect x="3" y="6" width="18" height="14" rx="3"/><path d="m8 6 2-3h4l2 3"/><circle cx="12" cy="13" r="4"/></>, arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>, sound: <><path d="m11 4-5 4H3v8h3l5 4zM15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14"/></>, upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/></>, sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></>, moon: <path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>, share: <><path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8"/></>, check: <path d="m5 12 4 4L19 6"/> };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function Practice({ deck, card, notify }: { deck: Deck; card: Card; notify: (message: string) => void }) {
  const [session, setSession] = useState<Session>(() => restore(deck));
  const input = useRef<HTMLInputElement>(null), next = useRef<HTMLButtonElement>(null), warned = useRef(false);
  const [composing, setComposing] = useState(false), [composition, setComposition] = useState('');
  const word = deck.words[session.index], complete = !word;
  const key = questionKey(session);
  function action(type: string, value?: string) {
    setSession(current => reduceSession(deck, current, { type, value, question: key }));
  }
  useEffect(() => {
    if (!writePreference(progressKey(deck), JSON.stringify(session)) && !warned.current) { warned.current = true; notify('浏览器无法保存进度；本次仍可练习，关闭页面后可能无法恢复。'); }
  }, [session, deck]);
  useEffect(() => {
    setComposition(''); setComposing(false); stopSpeaking();
    if (!complete) input.current?.focus({ preventScroll: true });
    return stopSpeaking;
  }, [key]);
  useEffect(() => { if (session.result) next.current?.focus({ preventScroll: true }); }, [session.result]);
  const listen = () => { if (word) { try { speak(word.english, word.example); } catch (e) { notify((e as Error).message); } } };
  const correct = session.results.filter(x => x === 'correct').length;
  async function share() {
    if (card.local) { download(deck.bytes, deck.title); notify('卡组已导出，可将文件发给朋友。'); return; }
    const url = new URL(location.href); url.hash = `/deck/${deck.id}`;
    try { await navigator.clipboard.writeText(url.href); notify('练习链接已复制。'); } catch { notify('复制未成功，请复制浏览器地址栏中的链接。'); }
  }
  return <main className="practice-page">
    <div className="practice-top"><button className="text-button" onClick={() => go()}><span aria-hidden="true">←</span> 全部卡组</button><span>{deck.title}</span><button className="icon-button" aria-label={card.local ? '导出卡组分享' : '复制练习链接'} onClick={share}><Icon name="share"/></button></div>
    <div className="progress-track" role="progressbar" aria-label="本轮练习进度" aria-valuenow={session.index} aria-valuemin={0} aria-valuemax={deck.words.length}><span style={{ width: `${session.index / deck.words.length * 100}%` }}/></div>
    {complete ? <section className="completion">
      <div className="completion-mark"><Icon name="check"/></div><p className="eyebrow">ONE SCENE, MORE WORDS</p><h1>又记住了一点生活。</h1><p>完成 {deck.words.length} 个词，{correct} 个一次拼对，{deck.words.length - correct} 个经过复习。</p>
      <div className="button-row"><button className="primary" onClick={() => action('restart')}>再练一遍 <Icon name="arrow"/></button><button className="secondary" onClick={() => go()}>换个场景</button></div>
      <div className="app-prompt"><Icon name="camera"/><h2>下一张，换成你的照片。</h2><p>在 iPhone 上拍照制卡，把自己的生活带进练习。</p><a className="primary" href={appStore} target="_blank" rel="noreferrer">下载摄影学英语 <Icon name="arrow"/></a><button className="text-button" onClick={() => download(deck.bytes, deck.title)}>下载这份卡组，在 App 中打开</button></div>
    </section> : <div className="practice-grid">
      <div className="practice-visual"><PhotoFocus src={deck.images[word.imageIndex]} focus={word.focus} alt={`${deck.title}的练习场景`}/><span className="photo-counter">{String(session.index + 1).padStart(2, '0')} / {String(deck.words.length).padStart(2, '0')}</span>{card.credit && <a className="photo-credit" href={card.source} target="_blank" rel="noreferrer">摄影 · {card.credit}</a>}</div>
      <section className="question-panel" aria-label="单词练习">
        <p className="eyebrow">看见它，也记住它</p><div className="word-title"><h1>{word.chinese}</h1><button className="icon-button listen" aria-label="播放英文发音" onClick={listen}><Icon name="sound"/></button></div>
        <p className="word-meta">{word.partOfSpeech || '英语词汇'}{session.result && word.phonetic ? ` · ${word.phonetic}` : ''}</p>
        <div className={`answer-area ${session.result ? 'answered' : ''}`} onClick={() => input.current?.focus()}>
          <AnswerSlots expected={word.english} entered={session.input} revealed={session.result === 'revealed'} scope={key}/>
          <input ref={input} className="spelling-input" aria-label="输入英文" autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} inputMode="text" readOnly={!!session.result} value={composing ? composition : session.input}
            onCompositionStart={e => { setComposing(true); setComposition(e.currentTarget.value); }} onCompositionEnd={e => { setComposing(false); action('input', e.currentTarget.value); }}
            onChange={e => composing ? setComposition(e.target.value) : action('input', e.target.value)}
            onKeyDown={e => { if (e.nativeEvent.isComposing || composing || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
              if (e.key === 'Escape' && !session.result) { e.preventDefault(); action('reveal'); }
              if (e.key === 'Enter' && session.result) { e.preventDefault(); action('next'); }
              if (e.key === ' ') { e.preventDefault(); listen(); }
            }}/>
        </div>
        <p className={`answer-feedback ${mismatch(word.english, session.input) >= 0 ? 'error' : ''}`} role="status">{session.result === 'revealed' ? '看一遍，再记住它。' : session.result ? '拼对了，继续下一词。' : mismatch(word.english, session.input) >= 0 ? '这个字母不太对，退格改一下。' : '点击字母区域，输入英文'}</p>
        {word.example && <div className="example"><p>{session.result ? word.example : maskExample(word.example, word.english)}</p><span>{word.exampleChinese}</span></div>}
        <div className="question-actions">{session.result ? <button ref={next} className="primary" onClick={() => action('next')}>{session.index + 1 === deck.words.length ? '完成这一组' : '下一词'}<Icon name="arrow"/></button> : <button className="secondary" onClick={() => action('reveal')}>看答案 <kbd>esc</kbd></button>}<span className="keyboard-note">空格听发音 · 回车下一词</span></div>
      </section>
    </div>}
  </main>;
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
        const response = await fetch(asset('catalog.json')); if (!response.ok) throw new Error('示例卡组暂时无法加载，请刷新重试。');
        const builtin: Card[] = await response.json();
        const imported: Card[] = [];
        try {
          for (const stored of await storedDecks()) {
            try {
              const bytes = new Uint8Array(stored.bytes); const parsed = await parseArchive(bytes);
              let d = cache.get(stored.id); if (!d) d = materialize(stored.id, parsed, bytes);
              imported.push({ id: stored.id, title: d.title, count: d.words.length, description: '你自己的照片与词汇', cover: d.images[0], local: true });
            } catch { if (!cancelled) setNotice('有一份本地卡组暂时无法读取，原文件仍保存在浏览器中。'); }
          }
        } catch { if (!cancelled) setNotice('浏览器未开放卡组存储，仍可体验示例卡组。'); }
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
        const response = await fetch(asset(card.package!), { signal: controller.signal }); if (!response.ok) throw new Error('卡组下载失败，请返回后重试。');
        const bytes = new Uint8Array(await response.arrayBuffer()); const parsed = await parseArchive(bytes);
        if (!controller.signal.aborted) { setDeck(materialize(selected, parsed, bytes)); setLoading(false); }
      } catch (e) { if (!controller.signal.aborted) { setError((e as Error).message); setLoading(false); } }
    })(); return () => controller.abort();
  }, [selected, cards, ready]);
  useEffect(() => { document.title = deck && selected ? `${deck.title} · PicLex` : 'PicLex · 把眼前的生活，变成英语'; }, [deck, selected]);
  async function importFile(selectedFile?: File) {
    if (!selectedFile || importing) return;
    setImporting(true); setNotice('');
    try {
      if (selectedFile.size > MAX_PACKAGE_BYTES || !selectedFile.name.toLowerCase().endsWith('.piclexdeck')) throw new Error('请选择不超过 32 MB 的 .piclexdeck 卡组。');
      const buffer = await selectedFile.arrayBuffer(), bytes = new Uint8Array(buffer), parsed = await parseArchive(bytes), id = `local-${parsed.fingerprint}`;
      await saveDeck({ id, title: parsed.title, bytes: buffer, addedAt: Date.now() });
      const value = cache.get(id) || materialize(id, parsed, bytes);
      setCards(current => current.some(c => c.id === id) ? current : [...current, { id, title: value.title, count: value.words.length, description: '你自己的照片与词汇', cover: value.images[0], local: true }]);
      setNotice('卡组已保存到当前浏览器。'); go(id);
    } catch (e) { setNotice((e as Error).message); }
    finally { setImporting(false); if (file.current) file.current.value = ''; }
  }
  const cover = (card: Card) => card.local ? card.cover : asset(card.cover);
  return <><a className="skip-link" href="#main-content">跳到内容</a><header className="site-header"><a className="brand" href="#/" aria-label="PicLex 首页"><span className="brand-mark"><Icon name="camera"/></span><strong>PicLex</strong><span className="brand-caption">摄影学英语</span></a><nav aria-label="主导航"><a className="nav-github" href={repository} target="_blank" rel="noreferrer">GitHub ↗</a><button className="icon-button" aria-label={dark ? '切换浅色外观' : '切换深色外观'} onClick={() => setDark(v => !v)}><Icon name={dark ? 'sun' : 'moon'}/></button><a className="header-app" href={appStore} target="_blank" rel="noreferrer">获取 iPhone App <span aria-hidden="true">↗</span></a></nav></header>
    <div id="main-content" tabIndex={-1}>
    {error ? <main className="empty-state"><h1>暂时无法打开</h1><p>{error}</p><button className="primary" onClick={() => selected ? go() : location.reload()}>{selected ? '返回全部卡组' : '重新加载'}</button></main> : selected ? loading || !deck || deck.id !== selected ? <main className="empty-state" aria-live="polite">正在准备卡组…</main> : <Practice key={deck.fingerprint} deck={deck} card={cards.find(c => c.id === selected)!} notify={setNotice}/> : <main className="home">
      <section className="hero"><div className="hero-copy"><p className="eyebrow">EVERYDAY SCENES. EVERYDAY ENGLISH.</p><h1>把眼前的生活，<br/><span>变成英语。</span></h1><p className="hero-description">从一张照片开始。看见场景，听见发音，<br className="desktop-break"/>亲手拼出那个词，让记忆有画面。</p><button className="primary" disabled={!ready} onClick={() => go('cafe')}>开始一分钟练习 <Icon name="arrow"/></button><p className="hero-note">免费体验 · 无需登录 · 进度保存在浏览器</p></div><button className="hero-photo" onClick={() => go('cafe')} aria-label="开始咖啡馆的早晨卡组"><img src={asset('images/cafe.jpg')} alt="木桌上的牛角包、木勺与水果"/><span className="hero-photo-label"><span>从熟悉的场景开始</span><strong>咖啡馆的早晨 <Icon name="arrow"/></strong></span><span className="word-bubble">croissant <span>牛角包</span></span></button></section>
      <section className="decks-section" aria-labelledby="decks-title"><div className="section-title"><div><p className="eyebrow">YOUR NEXT SMALL DISCOVERY</p><h2 id="decks-title">今天，想走进哪个场景？</h2></div><button className="text-button" onClick={() => file.current?.click()} disabled={importing}><Icon name="upload"/>{importing ? '正在导入…' : '导入自己的卡组'}</button></div><div className="deck-grid">{cards.map((card, index) => <button className="deck-card" key={card.id} onClick={() => go(card.id)}><div className="deck-cover"><img src={cover(card)} alt={card.title} loading="lazy"/><span>{card.local ? '我的卡组' : `SCENE ${String(index + 1).padStart(2, '0')}`}</span></div><div className="deck-caption"><h3>{card.title}</h3><Icon name="arrow"/><p>{card.description}</p><span>{card.count} 个单词 · 随时开始</span></div></button>)}</div>{loading && <p role="status">正在加载卡组…</p>}<p className="import-note">支持 App 导出的 .piclexdeck 文件，最多 32 MB。照片只保存在当前浏览器。</p></section>
      <section className="home-app"><div className="app-icon"><Icon name="camera"/></div><div><h2>你的照片，就是你的词书。</h2><p>用摄影学英语 iPhone App 拍照制卡，在自己的生活里持续练习。</p></div><a className="secondary" href={appStore} target="_blank" rel="noreferrer">探索 iPhone App <Icon name="arrow"/></a></section>
    </main>}
    </div><footer><span>PicLex · 让记忆有画面</span><div><a href={repository} target="_blank" rel="noreferrer">开源代码</a><a href={asset('credits.html')} target="_blank" rel="noreferrer">素材与隐私</a><span>Made for little discoveries.</span></div></footer>
    <input ref={file} className="file-input" type="file" accept=".piclexdeck" aria-label="选择照片卡组文件" onChange={e => void importFile(e.target.files?.[0])}/>
    {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="关闭提示" onClick={() => setNotice('')}>×</button></div>}
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
