/** QR payloads are ordinary subscription URLs, with no app scheme or domain binding. */
export function sourceURL(value) {
  if (typeof value !== 'string' || !value || value.length > 4096 || /[\x00-\x20\x7f\\]/.test(value)) throw Error('请填写有效的 HTTPS 订阅清单地址。');
  const url = new URL(value);
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.hash || value.includes('#')) throw Error('订阅地址需要 HTTPS，且不能含账号、密码或片段。');
  return url.href;
}
export const EXAMPLES = [
  {slug:'nce2',title:'新概念英语第二册',source:'https://piclex.v2fy.com/public/subscriptions/nce2/feed.json'},
  {slug:'classic-english-songs',title:'经典英语歌曲',source:'https://piclex.v2fy.com/public/subscriptions/classic-english-songs/feed.json'}
];
