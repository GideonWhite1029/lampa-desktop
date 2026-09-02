const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

const FILE = path.join(app.getPath('userData'), 'desktop.json');

const DEFAULTS = {
  window: { width: 1200, height: 800, x: undefined, y: undefined, maximized: false },
  // Extra absolute executable paths the user explicitly trusts as external players,
  // on top of the built-in known-player list.
  extraPlayerBinaries: [],
  network: {
    // DNS-over-HTTPS. Off by default: turning it on forces ALL name resolution
    // through the servers below, which bypasses ISP DNS poisoning (e.g. TMDB
    // blocked in some regions) BUT fully breaks networking if those endpoints are
    // themselves unreachable. Toggle in the "Сеть" menu; flip back if it hurts.
    // `true` = use the default resolver list; `false` = system DNS; or supply
    // your own array / single URL of DoH endpoints.
    doh: false,
    dohServers: [
      'https://cloudflare-dns.com/dns-query',
      'https://dns.google/dns-query',
      'https://dns.quad9.net/dns-query'
    ],
    // Upstream proxy for all app traffic: '' (none), 'system', or a rule string like
    // 'socks5://127.0.0.1:1080' / 'http://host:port'.
    proxy: ''
  }
};

let cache = null;

const load = () => {
  if (cache) return cache;
  let parsed = {};
  try {
    parsed = JSON.parse(fs.readFileSync(FILE, 'utf-8')) || {};
  } catch (error) {
    parsed = {};
  }
  cache = Object.assign({}, DEFAULTS, parsed);
  // one-level deep merge so a partial section in the file keeps the other defaults
  cache.window = Object.assign({}, DEFAULTS.window, parsed.window || {});
  cache.network = Object.assign({}, DEFAULTS.network, parsed.network || {});
  return cache;
};

let saveTimer = null;
const save = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(FILE, JSON.stringify(cache, null, 2));
    } catch (error) {
      // best-effort; a missing userData dir or read-only FS should not crash the app
    }
  }, 400);
};

const get = (key) => load()[key];

const set = (key, value) => {
  load()[key] = value;
  save();
};

const merge = (key, partial) => {
  const current = load()[key] || {};
  load()[key] = Object.assign({}, current, partial);
  save();
};

module.exports = { load, get, set, merge, FILE };
