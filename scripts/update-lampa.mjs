#!/usr/bin/env node
/**
 * Sync the vendored Lampa web sources in src/ from the upstream build repo
 * (github.com/yumata/lampa). Used locally and by .github/workflows/update-lampa.yml.
 *
 *   node scripts/update-lampa.mjs [--repo yumata/lampa] [--branch main]
 *
 * Exit code is always 0. It prints a summary and, when running in GitHub
 * Actions, writes `changed` / `version` to $GITHUB_OUTPUT.
 */
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { appendFile } from 'node:fs/promises';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC = join(ROOT, 'src');

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};
const REPO = getArg('repo', 'yumata/lampa');
const BRANCH = getArg('branch', 'main');
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(REPO) || !/^(?!.*\.\.)[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)*$/.test(BRANCH)) {
  console.error('invalid --repo / --branch');
  process.exit(1);
}
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
const API_TREE = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;

// Upstream path -> local path under src/ (identity unless remapped).
const REMAP = { 'app.min.js': 'app.js' };
// Only mirror files under these upstream prefixes (plus the two explicit files).
const PREFIXES = ['lang/', 'vender/', 'fonts/', 'sound/'];
const EXPLICIT = ['app.min.js', 'css/app.css'];

const ghHeaders = process.env.GITHUB_TOKEN
  ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'User-Agent': 'lampa-desktop-updater' }
  : { 'User-Agent': 'lampa-desktop-updater' };

const fetchBuf = async (url) => {
  const res = await fetch(url, { headers: ghHeaders });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
};

// git blob id of a file: sha1("blob <size>\0" + bytes)
const blobSha = (buf) => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

const sameBytes = async (file, buf) => {
  try {
    const cur = await readFile(file);
    return cur.equals(buf);
  } catch {
    return false;
  }
};

const main = async () => {
  const tree = JSON.parse((await fetchBuf(API_TREE)).toString('utf-8'));
  if (tree.truncated) console.warn('warning: upstream tree listing was truncated');

  const wanted = tree.tree.filter((e) =>
    e.type === 'blob' && (EXPLICIT.includes(e.path) || PREFIXES.some((p) => e.path.startsWith(p)))
  );

  const changed = [];
  for (const entry of wanted) {
    const localRel = REMAP[entry.path] || entry.path;
    const localAbs = resolve(SRC, localRel);
    if (!localAbs.startsWith(SRC + sep)) {
      console.warn(`skip ${entry.path}: resolves outside src/`);
      continue;
    }
    let buf;
    try {
      buf = await fetchBuf(RAW + entry.path);
    } catch (error) {
      console.warn(`skip ${entry.path}: ${error.message}`);
      continue;
    }
    // The tree listing and the raw download are separate requests; only accept bytes that
    // match the blob id the tree reported, so a half-pushed or tampered file is never committed.
    if (blobSha(buf) !== entry.sha) {
      console.warn(`skip ${entry.path}: content does not match tree blob ${entry.sha}`);
      continue;
    }
    if (await sameBytes(localAbs, buf)) continue;
    await mkdir(dirname(localAbs), { recursive: true });
    await writeFile(localAbs, buf);
    changed.push(localRel);
  }

  let version = 'unknown';
  try {
    const assembly = JSON.parse((await fetchBuf(RAW + 'assembly.json')).toString('utf-8'));
    version = String(assembly.app_version || 'unknown');
  } catch {
    const m = (await readFile(join(SRC, 'app.js'), 'utf-8')).slice(0, 200000)
      .match(/app_version:\s*['"]([\d.]+)['"]/);
    if (m) version = m[1];
  }

  console.log(`Lampa ${REPO}@${BRANCH} -> version ${version}`);
  if (changed.length) {
    console.log(`Updated ${changed.length} file(s):`);
    for (const c of changed.slice(0, 40)) console.log(`  ${c}`);
    if (changed.length > 40) console.log(`  ... and ${changed.length - 40} more`);
  } else {
    console.log('Already up to date.');
  }

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT,
      `changed=${changed.length ? '1' : '0'}\nversion=${version}\ncount=${changed.length}\n`);
  }
};

main().catch((error) => {
  console.error('update-lampa failed:', error);
  process.exitCode = 1;
});
