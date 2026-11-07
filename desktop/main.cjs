'use strict';
const { app, BrowserWindow, shell, session } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const DIST = app.isPackaged
  ? path.join(process.resourcesPath, 'www')
  : path.resolve(__dirname, '..', 'dist');
const PREFIX = '/piclex-web/';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
  '.piclexdeck': 'application/octet-stream',
  '.zip': 'application/zip'
};

function respond(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); res.end(); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  if (pathname === '/piclex-web') {
    res.writeHead(308, { Location: PREFIX }); res.end(); return;
  }
  if (!pathname.startsWith(PREFIX)) {
    res.writeHead(404); res.end(); return;
  }
  const relative = pathname.slice(PREFIX.length) || 'index.html';
  let full = path.resolve(DIST, relative);
  if (full !== DIST && !full.startsWith(DIST + path.sep)) {
    res.writeHead(403); res.end(); return;
  }
  try {
    if (fs.statSync(full).isDirectory()) full = path.join(full, 'index.html');
    const stat = fs.statSync(full);
    if (!stat.isFile()) throw new Error('Not a file');
    const headers = {
      'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    };
    const range = req.headers.range;
    if (range && /^bytes=\d*-\d*$/.test(range)) {
      const parts = range.substring(6).split('-');
      let start = parts[0] ? Number(parts[0]) : 0;
      let end = parts[1] ? Number(parts[1]) : stat.size - 1;
      if (!parts[0] && parts[1]) {
        start = Math.max(0, stat.size - Number(parts[1]));
        end = stat.size - 1;
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)
          || start > end || start >= stat.size || end >= stat.size) {
        res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size }); res.end(); return;
      }
      headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
      headers['Content-Length'] = end - start + 1;
      res.writeHead(206, headers);
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(full, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(full).pipe(res);
  } catch {
    res.writeHead(404); res.end();
  }
}

let server;
app.whenReady().then(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('dist/index.html not found. Build the Web project first.');
  }
  server = http.createServer(respond);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => {
    const trusted = details.requestingUrl && details.requestingUrl.startsWith(base + PREFIX);
    callback(Boolean(trusted && (permission === 'media' || permission === 'mediaTypes')));
  });
  const win = new BrowserWindow({
    width: 1250, height: 850, minWidth: 750, minHeight: 580,
    title: 'PicLex 摄影学英语',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true, sandbox: true,
      webSecurity: true
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, target) => {
    if (!target.startsWith(base + PREFIX)) {
      event.preventDefault();
      if (/^https:\/\//i.test(target)) shell.openExternal(target);
    }
  });
  await win.loadURL(base + PREFIX);
}).catch(error => {
  console.error(error);
  app.quit();
});

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (server) server.close(); });
