/**
 * Runtime updater for the bundled Lampa "core" (app.js + css/app.css).
 *
 * The version shipped inside the asar is the baseline. On launch we check
 * yumata/lampa for a newer release and, if found, download app.min.js + app.css
 * into a writable folder under userData. index.html then loads the newest of the
 * two on the next start (or right away, if the update lands during startup).
 */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { app } = require('electron');
const log = require('electron-log');
const store = require('./store');

const BUNDLED_DIR = __dirname; // .../src (inside asar)
const CORE_ROOT = path.join(app.getPath('userData'), 'lampa-core');
const ACTIVE_FILE = path.join(CORE_ROOT, 'active.json');

const defaults = () => Object.assign(
  { autoUpdate: true, repo: 'yumata/lampa', branch: 'main', activeVersion: null, lastCheck: 0 },
  store.get('lampaCore') || {}
);

const readVersionFrom = (file) => {
  try {
    const head = fs.readFileSync(file, 'utf-8').slice(0, 200000);
    const m = head.match(/app_version:\s*['"]([0-9]+(?:\.[0-9]+){1,3})['"]/);
    return m ? m[1] : null;
  } catch (error) {
    return null;
  }
};

const parseSemver = (v) => (typeof v === 'string' ? v.split('.').map((n) => parseInt(n, 10) || 0) : []);

const isNewer = (remote, local) => {
  const a = parseSemver(remote);
  const b = parseSemver(local);
  if (!a.length) return false;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
};

/** Absolute paths of the app.js / app.css that should be loaded right now. */
const activeAssets = () => {
  try {
    const active = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf-8'));
    const dir = path.join(CORE_ROOT, active.version);
    const js = path.join(dir, 'app.js');
    const css = path.join(dir, 'app.css');
    if (fs.existsSync(js) && fs.existsSync(css) && readVersionFrom(js)) {
      return { version: active.version, js, css, source: 'downloaded' };
    }
  } catch (error) {
    // fall through to bundled
  }
  return {
    version: readVersionFrom(path.join(BUNDLED_DIR, 'app.js')) || '0',
    js: path.join(BUNDLED_DIR, 'app.js'),
    css: path.join(BUNDLED_DIR, 'css', 'app.css'),
    source: 'bundled'
  };
};

const fetchText = async (url, timeoutMs = 15000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
};

const rawBase = (cfg) => `https://raw.githubusercontent.com/${cfg.repo}/${cfg.branch}/`;

/**
 * @returns {Promise<{status:string, version?:string, from?:string}>}
 *   status: 'disabled' | 'up-to-date' | 'updated' | 'error'
 */
const checkAndUpdate = async () => {
  const cfg = defaults();
  if (!cfg.autoUpdate) return { status: 'disabled' };

  const current = activeAssets();
  let remoteVersion;
  try {
    const assembly = JSON.parse(await fetchText(`${rawBase(cfg)}assembly.json`, 10000));
    remoteVersion = String(assembly.app_version || '').trim();
  } catch (error) {
    log.warn('[lampa-core] version check failed:', error.message);
    return { status: 'error' };
  }

  // remoteVersion is later used as a directory name; keep it to a strict
  // dotted-numeric form so a hostile assembly.json can't escape CORE_ROOT.
  if (!/^[0-9]+(\.[0-9]+){1,3}$/.test(remoteVersion)) {
    log.warn('[lampa-core] rejecting malformed remote version:', remoteVersion);
    return { status: 'error' };
  }

  store.merge('lampaCore', { lastCheck: Date.now() });

  if (!isNewer(remoteVersion, current.version)) {
    return { status: 'up-to-date', version: current.version };
  }

  log.info(`[lampa-core] update ${current.version} -> ${remoteVersion}`);

  let js;
  let css;
  try {
    [js, css] = await Promise.all([
      fetchText(`${rawBase(cfg)}app.min.js`, 45000),
      fetchText(`${rawBase(cfg)}css/app.css`, 30000)
    ]);
  } catch (error) {
    log.warn('[lampa-core] download failed:', error.message);
    return { status: 'error' };
  }

  // Reject truncated files / HTML error pages.
  const jsOk = js.length > 500000 && js.trimStart().startsWith('(function') &&
    js.includes(`app_version: '${remoteVersion}'`);
  const cssOk = css.length > 100000 && css.includes('.welcome');
  if (!jsOk || !cssOk) {
    log.warn('[lampa-core] sanity check failed, discarding download');
    return { status: 'error' };
  }

  const finalDir = path.join(CORE_ROOT, remoteVersion);
  const tmpDir = `${finalDir}.tmp-${process.pid}`;
  try {
    await fsp.rm(tmpDir, { recursive: true, force: true });
    await fsp.mkdir(tmpDir, { recursive: true });
    await fsp.writeFile(path.join(tmpDir, 'app.js'), js);
    await fsp.writeFile(path.join(tmpDir, 'app.css'), css);
    await fsp.rm(finalDir, { recursive: true, force: true });
    await fsp.rename(tmpDir, finalDir);
    await fsp.writeFile(ACTIVE_FILE, JSON.stringify(
      { version: remoteVersion, appliedAt: new Date().toISOString(), from: current.version }, null, 2
    ));
  } catch (error) {
    log.warn('[lampa-core] could not stage update:', error.message);
    return { status: 'error' };
  }

  store.merge('lampaCore', { activeVersion: remoteVersion });
  await pruneOld(remoteVersion).catch(() => {});
  return { status: 'updated', version: remoteVersion, from: current.version };
};

const pruneOld = async (keepVersion) => {
  let entries = [];
  try {
    entries = await fsp.readdir(CORE_ROOT, { withFileTypes: true });
  } catch (error) {
    return;
  }
  await Promise.all(entries
    .filter((e) => e.isDirectory() && e.name !== keepVersion)
    .map((e) => fsp.rm(path.join(CORE_ROOT, e.name), { recursive: true, force: true })));
};

const setAutoUpdate = (enabled) => store.merge('lampaCore', { autoUpdate: !!enabled });

module.exports = { activeAssets, checkAndUpdate, setAutoUpdate, isAutoUpdate: () => defaults().autoUpdate, CORE_ROOT };
