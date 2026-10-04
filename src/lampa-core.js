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
const crypto = require('node:crypto');
const { app, net } = require('electron');
const log = require('electron-log');
const store = require('./store');

const BUNDLED_DIR = __dirname; // .../src (inside asar)
const CORE_ROOT = path.join(app.getPath('userData'), 'lampa-core');
const ACTIVE_FILE = path.join(CORE_ROOT, 'active.json');

const DEFAULT_REPO = 'yumata/lampa';
const DEFAULT_BRANCH = 'main';
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BRANCH_RE = /^(?!.*\.\.)[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)*$/;
const VERSION_RE = /^[0-9]+(\.[0-9]+){1,3}$/;
const MAX_DOWNLOAD = 25 * 1024 * 1024;

// repo/branch end up inside URLs, so a hand-edited desktop.json can only pick a
// well-formed GitHub repo/branch, never inject path or query fragments.
const defaults = () => {
  const cfg = Object.assign(
    { autoUpdate: true, repo: DEFAULT_REPO, branch: DEFAULT_BRANCH, activeVersion: null, lastCheck: 0 },
    store.get('lampaCore') || {}
  );
  if (typeof cfg.repo !== 'string' || !REPO_RE.test(cfg.repo)) cfg.repo = DEFAULT_REPO;
  if (typeof cfg.branch !== 'string' || !BRANCH_RE.test(cfg.branch)) cfg.branch = DEFAULT_BRANCH;
  return cfg;
};

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
    // active.version becomes a path segment under CORE_ROOT that is then loaded as code.
    if (typeof active.version !== 'string' || !VERSION_RE.test(active.version)) throw new Error('bad version');
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

// net.fetch goes through Chromium's network stack, so it honours the proxy and DNS-over-HTTPS
// settings applied to the session (Node's global fetch would silently bypass both).
const fetchBytes = async (url, timeoutMs = 15000, headers = {}) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await net.fetch(url, { signal: ctrl.signal, redirect: 'follow', headers });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    if (!String(res.url || url).startsWith('https://')) throw new Error(`refusing non-https response for ${url}`);
    if (Number(res.headers.get('content-length')) > MAX_DOWNLOAD) throw new Error(`response too large for ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_DOWNLOAD) throw new Error(`response too large for ${url}`);
    return buf;
  } finally {
    clearTimeout(timer);
  }
};

const GH_HEADERS = { 'User-Agent': 'lampa-desktop', Accept: 'application/vnd.github+json' };

// Everything below is read at one immutable commit, so the version check, the downloaded
// files and their hashes cannot drift apart if upstream pushes mid-update.
const resolveCommit = async (cfg) => {
  const meta = JSON.parse((await fetchBytes(
    `https://api.github.com/repos/${cfg.repo}/commits/${cfg.branch}`, 10000, GH_HEADERS)).toString('utf-8'));
  if (!/^[0-9a-f]{40}$/.test(String(meta.sha))) throw new Error('unexpected commit sha from GitHub API');
  return meta.sha;
};

const rawBase = (cfg, commit) => `https://raw.githubusercontent.com/${cfg.repo}/${commit}/`;

// Cross-checks the downloaded bytes against the git blob hash reported by the GitHub
// Contents API (a different host from raw.githubusercontent.com). This catches a
// corrupted or tampered raw-content response; it is not a signature, so it cannot protect
// against a compromised upstream repository itself.
const verifyIntegrity = async (cfg, commit, filePath, bytes) => {
  const api = `https://api.github.com/repos/${cfg.repo}/contents/${filePath}?ref=${commit}`;
  const meta = JSON.parse((await fetchBytes(api, 15000, GH_HEADERS)).toString('utf-8'));
  const expected = String(meta.sha || '');
  const actual = crypto.createHash('sha1')
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex');
  if (!/^[0-9a-f]{40}$/.test(expected) || expected !== actual) throw new Error(`integrity mismatch for ${filePath}`);
};

/**
 * @returns {Promise<{status:string, version?:string, from?:string}>}
 *   status: 'disabled' | 'up-to-date' | 'updated' | 'error'
 */
const checkAndUpdate = async () => {
  const cfg = defaults();
  if (!cfg.autoUpdate) return { status: 'disabled' };

  const current = activeAssets();
  let commit;
  let remoteVersion;
  try {
    commit = await resolveCommit(cfg);
    const assembly = JSON.parse((await fetchBytes(`${rawBase(cfg, commit)}assembly.json`, 10000)).toString('utf-8'));
    remoteVersion = String(assembly.app_version || '').trim();
  } catch (error) {
    log.warn('[lampa-core] version check failed:', error.message);
    return { status: 'error' };
  }

  // remoteVersion is later used as a directory name; keep it to a strict
  // dotted-numeric form so a hostile assembly.json can't escape CORE_ROOT.
  if (!VERSION_RE.test(remoteVersion)) {
    log.warn('[lampa-core] rejecting malformed remote version:', remoteVersion);
    return { status: 'error' };
  }

  store.merge('lampaCore', { lastCheck: Date.now() });

  if (!isNewer(remoteVersion, current.version)) {
    return { status: 'up-to-date', version: current.version };
  }

  log.info(`[lampa-core] update ${current.version} -> ${remoteVersion}`);

  let jsBytes;
  let cssBytes;
  try {
    [jsBytes, cssBytes] = await Promise.all([
      fetchBytes(`${rawBase(cfg, commit)}app.min.js`, 45000),
      fetchBytes(`${rawBase(cfg, commit)}css/app.css`, 30000)
    ]);
  } catch (error) {
    log.warn('[lampa-core] download failed:', error.message);
    return { status: 'error' };
  }

  // Verify before the bytes are decoded or inspected any further.
  try {
    await Promise.all([
      verifyIntegrity(cfg, commit, 'app.min.js', jsBytes),
      verifyIntegrity(cfg, commit, 'css/app.css', cssBytes)
    ]);
  } catch (error) {
    log.warn('[lampa-core] integrity verification failed:', error.message);
    return { status: 'error' };
  }

  const js = jsBytes.toString('utf-8');
  const css = cssBytes.toString('utf-8');

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
    await fsp.writeFile(path.join(tmpDir, 'app.js'), jsBytes);
    await fsp.writeFile(path.join(tmpDir, 'app.css'), cssBytes);
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
