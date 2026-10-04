#!/usr/bin/env node
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};

const PORT = parseInt(arg('port', process.env.LAMPA_SYNC_PORT || '8095'), 10);
const DATA_DIR = arg('data', process.env.LAMPA_SYNC_DATA ||
  path.join(process.env.APPDATA || path.join(os.homedir(), '.config'), 'lampa-sync'));
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const TOKEN_FILE = path.join(DATA_DIR, 'token');
const HOST = arg('host', process.env.LAMPA_SYNC_HOST || '127.0.0.1');
const MAX_TIMELINE = 50000;
const MAX_FAV = 50000;
const MAX_KV = 5000;
const MAX_KV_VALUE = 256 * 1024;
const MAX_CARD = 256 * 1024;
const MIN_TOKEN = 16;
const SECRET_KEY = /^settings:.*(key|password|login|auth|token)/i;
const UNSAFE_KEY = /(^|:)(__proto__|constructor|prototype)$/;

function loadToken() {
  const given = arg('token', process.env.LAMPA_SYNC_TOKEN || '');
  if (given) {
    if (given.length < MIN_TOKEN) {
      console.error(`[sync] refusing to start: --token must be at least ${MIN_TOKEN} characters`);
      process.exit(1);
    }
    return given;
  }
  try {
    const saved = fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
    if (saved) return saved;
  } catch (error) {
  }
  const token = crypto.randomBytes(24).toString('hex');
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(TOKEN_FILE, token + '\n', { mode: 0o600 });
  return token;
}
const TOKEN = loadToken();
const TOKEN_BUF = Buffer.from(TOKEN);

function authorized(req, url) {
  const header = String(req.headers.authorization || '');
  const given = header.startsWith('Bearer ') ? header.slice(7) : url.searchParams.get('token') || '';
  const buf = Buffer.from(given);
  return buf.length === TOKEN_BUF.length && crypto.timingSafeEqual(buf, TOKEN_BUF);
}
const SRC_DIR = path.join(__dirname, '..', 'src');
const BUNDLE = ['desktop-resume.js', 'desktop-audio.js', 'lampa-sync.js'];
const MAX_BODY = 20 * 1024 * 1024;
const WHERE = new Set(['book', 'like', 'wath', 'history', 'look', 'viewed', 'scheduled', 'continued', 'thrown']);
const KV_NS = new Set(['resume', 'audio', 'settings']);

const PRIVATE = new Set(['index.js', 'preload.js', 'players.js', 'store.js', 'menu.js', 'lampa-core.js']);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav'
};

const CORE_ROOT = path.join(process.env.APPDATA || path.join(os.homedir(), '.config'), 'Lampa', 'lampa-core');
function coreFile(name) {
  try {
    const active = JSON.parse(fs.readFileSync(path.join(CORE_ROOT, 'active.json'), 'utf-8'));
    if (/^[0-9]+(\.[0-9]+){1,3}$/.test(active.version)) {
      const file = path.join(CORE_ROOT, active.version, name);
      if (fs.existsSync(file)) return file;
    }
  } catch (error) {
  }
  return null;
}

function serveStatic(pathname, res) {
  let rel;
  try {
    rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
  } catch (error) {
    return false;
  }
  if (rel === 'lampa.js' || PRIVATE.has(rel)) return false;

  let file = rel === 'app.js' ? coreFile('app.js') : rel === 'css/app.css' ? coreFile('app.css') : null;
  if (!file) {
    file = path.resolve(SRC_DIR, rel);
    if (file !== SRC_DIR && !file.startsWith(SRC_DIR + path.sep)) return false;
  }

  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) return false;
  let data;
  try {
    data = fs.readFileSync(file);
  } catch (error) {
    return false;
  }
  const cache = /\.(html|js|css|json)$/i.test(file) ? 'no-cache' : 'max-age=86400';
  res.writeHead(200, Object.assign({ 'content-type': type, 'cache-control': cache, 'x-content-type-options': 'nosniff' }, cors));
  res.end(data);
  return true;
}

let state = { seq: 0, timeline: {}, fav: {}, cards: {}, kv: {} };
try {
  state = Object.assign(state, JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')));
} catch (error) {
  if (error.code !== 'ENOENT') console.warn('[sync] state unreadable, starting empty:', error.message);
}
for (const key of Object.keys(state.kv)) if (SECRET_KEY.test(key)) delete state.kv[key];

let saveTimer = null;
const save = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    const tmp = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state), { mode: 0o600 });
    fs.renameSync(tmp, STATE_FILE);
  }, 500);
};

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);

function merge(body) {
  let changed = false;
  const bump = () => { changed = true; return ++state.seq; };

  const timeline = body.timeline && typeof body.timeline === 'object' ? body.timeline : {};
  for (const hash of Object.keys(timeline)) {
    const road = timeline[hash];
    if (!road || typeof road !== 'object' || !/^-?\d+$/.test(hash)) continue;
    const cur = state.timeline[hash];
    if (!cur && Object.keys(state.timeline).length >= MAX_TIMELINE) continue;
    if (cur && num(cur.v.updated) >= num(road.updated)) continue;
    state.timeline[hash] = {
      v: {
        time: num(road.time), duration: num(road.duration), percent: num(road.percent),
        profile: num(road.profile), updated: num(road.updated)
      },
      s: bump()
    };
  }

  for (const f of Array.isArray(body.fav) ? body.fav : []) {
    if (!f || !WHERE.has(f.where) || UNSAFE_KEY.test(`:${f.id}`)) continue;
    if (!(typeof f.id === 'number' && isFinite(f.id)) && !(typeof f.id === 'string' && f.id && f.id.length <= 64)) continue;
    const key = `${f.where}:${f.id}`;
    const cur = state.fav[key];
    if (!cur && Object.keys(state.fav).length >= MAX_FAV) continue;
    if (cur && num(cur.t) >= num(f.t)) continue;
    state.fav[key] = { where: f.where, id: f.id, on: !!f.on, t: num(f.t), s: bump() };
    if (f.on && f.card && typeof f.card === 'object' && JSON.stringify(f.card).length <= MAX_CARD) state.cards[f.id] = f.card;
  }

  const kv = body.kv && typeof body.kv === 'object' ? body.kv : {};
  for (const key of Object.keys(kv)) {
    const item = kv[key];
    if (!item || !KV_NS.has(key.split(':')[0]) || UNSAFE_KEY.test(key) || SECRET_KEY.test(key)) continue;
    if (JSON.stringify(item.v === undefined ? null : item.v).length > MAX_KV_VALUE) continue;
    const cur = state.kv[key];
    if (!cur && Object.keys(state.kv).length >= MAX_KV) continue;
    if (cur && num(cur.u) >= num(item.u)) continue;
    state.kv[key] = { v: item.v, u: num(item.u), s: bump() };
  }

  if (changed) save();
}

function changesSince(since) {
  const out = { cursor: state.seq, timeline: {}, fav: [], kv: {} };
  for (const hash of Object.keys(state.timeline)) {
    const e = state.timeline[hash];
    if (e.s > since) out.timeline[hash] = e.v;
  }
  for (const key of Object.keys(state.fav)) {
    const e = state.fav[key];
    if (e.s > since) out.fav.push({ where: e.where, id: e.id, on: e.on, t: e.t, card: e.on ? state.cards[e.id] || null : null });
  }
  for (const key of Object.keys(state.kv)) {
    const e = state.kv[key];
    if (e.s > since) out.kv[key] = { v: e.v, u: e.u };
  }
  return out;
}

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS'
};

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, Object.assign({ 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }, cors));
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

// When bound to loopback only, refuse requests whose Host header isn't a loopback name:
// that is what a DNS-rebinding page in the user's browser would send.
const LOOPBACK_BOUND = /^(127\.\d+\.\d+\.\d+|localhost|::1)$/i.test(HOST);
const LOOPBACK_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])(:\d+)?$/i;

const server = http.createServer((req, res) => {
  if (LOOPBACK_BOUND && !LOOPBACK_HOST.test(String(req.headers.host || ''))) {
    return send(res, 403, { error: 'forbidden host' });
  }
  let url;
  try {
    url = new URL(req.url, 'http://x');
  } catch (error) {
    return send(res, 400, { error: 'bad request' });
  }

  if (req.method === 'OPTIONS') return send(res, 204, '');

  if (req.method === 'GET' && url.pathname === '/echo') {
    return send(res, 200, { ok: true, seq: state.seq });
  }

  if (req.method === 'GET' && url.pathname === '/lampa.js') {
    if (!authorized(req, url)) return send(res, 401, { error: 'unauthorized' });
    try {
      const code = BUNDLE.map((f) => `/* ${f} */\n` + fs.readFileSync(path.join(SRC_DIR, f), 'utf-8')).join('\n;\n');
      return send(res, 200, code, 'application/javascript; charset=utf-8');
    } catch (error) {
      return send(res, 500, { error: error.message });
    }
  }

  if (req.method === 'POST' && url.pathname === '/sync') {
    if (!authorized(req, url)) return send(res, 401, { error: 'unauthorized' });
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { send(res, 413, { error: 'too large' }); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (res.writableEnded) return;
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
      } catch (error) {
        return send(res, 400, { error: 'bad json' });
      }
      merge(body);
      send(res, 200, changesSince(num(body.since)));
    });
    return;
  }

  if (req.method === 'GET' && serveStatic(url.pathname, res)) return;

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[sync] listening on ${HOST}:${PORT}, data ${STATE_FILE}`);
  console.log(`[sync] token: ${TOKEN}  (file: ${TOKEN_FILE})`);
  const open = HOST === '0.0.0.0' || HOST === '::';
  const hosts = open
    ? Object.values(os.networkInterfaces()).flat()
        .filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address)
    : [HOST];
  hosts.forEach((ip) => console.log(`[sync] Lampa for TV/phone: http://${ip}:${PORT}/  (plugin only: http://${ip}:${PORT}/lampa.js?token=<token>)`));
  if (!open) console.log('[sync] reachable from this machine only; use --host 0.0.0.0 to serve other devices');
  else console.warn('[sync] WARNING: listening on all interfaces over plain HTTP; the token is sent unencrypted, so use only on a trusted LAN (or put it behind an HTTPS proxy)');
});
