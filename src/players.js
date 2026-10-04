const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const store = require('./store');

// Inside a Flatpak sandbox the host's players (and their paths) are not visible;
// they must be started on the host through `flatpak-spawn --host`.
const IN_FLATPAK = process.env.FLATPAK_ID != null || fs.existsSync('/.flatpak-info');

// Basenames Lampa's own external-player code knows how to drive, plus the common
// desktop players people point it at. A spawn request is only honoured if the target
// executable's basename is in here (or the user added it to extraPlayerBinaries).
const KNOWN = new Set([
  // VLC
  'vlc', 'vlc.exe',
  // MPC family (Lampa talks to their web interface for timecodes)
  'mpc-hc', 'mpc-hc64', 'mpc-hc.exe', 'mpc-hc64.exe',
  'mpc-be', 'mpc-be64', 'mpc-be.exe', 'mpc-be64.exe',
  'mpc-qt', 'mpc-qt.exe',
  // KMPlayer
  'kmplayer', 'kmplayer.exe', 'kmplayer64.exe',
  // mpv and friends
  'mpv', 'mpv.exe', 'mpvnet', 'mpvnet.exe', 'io.mpv.mpv',
  'celluloid', 'io.github.celluloid_player.celluloid',
  // Others
  'smplayer', 'smplayer.exe',
  'potplayermini64.exe', 'potplayer64.exe', 'potplayermini.exe',
  'ffplay', 'ffplay.exe',
  'totem', 'org.gnome.totem',
  'haruna', 'org.kde.haruna'
]);

// Where to look for a player when Lampa has no configured path yet.
const CANDIDATES = () => {
  if (process.platform === 'win32') {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    return [
      [pf, 'VideoLAN', 'VLC', 'vlc.exe'],
      [pf86, 'VideoLAN', 'VLC', 'vlc.exe'],
      [pf, 'MPC-HC', 'mpc-hc64.exe'],
      [pf86, 'MPC-HC', 'mpc-hc.exe'],
      [pf, 'MPC-HC', 'mpc-hc.exe'],
      [pf86, 'MPC-HC', 'mpc-hc64.exe'],
      [pf, 'MPC-BE', 'mpc-be64.exe'],
      [pf, 'mpv', 'mpv.exe'],
      [pf, 'mpv.net', 'mpvnet.exe'],
      [pf, 'DAUM', 'PotPlayer', 'PotPlayerMini64.exe'],
      [pf, 'SMPlayer', 'smplayer.exe']
    ].map((p) => path.join(...p));
  }
  // linux
  const bins = ['vlc', 'mpv', 'io.mpv.Mpv', 'celluloid', 'smplayer', 'mpc-qt', 'haruna', 'totem', 'ffplay'];
  const dirs = ['/usr/bin', '/usr/local/bin', '/var/lib/flatpak/exports/bin',
    path.join(os.homedir(), '.local/share/flatpak/exports/bin'),
    path.join(os.homedir(), '.local/bin')];
  const out = [];
  for (const d of dirs) for (const b of bins) out.push(path.join(d, b));
  return out;
};

const isExtraTrusted = (cmd) => {
  const extra = store.get('extraPlayerBinaries') || [];
  return extra.some((p) => typeof p === 'string' && path.resolve(p) === path.resolve(cmd));
};

// Directories a media player is normally installed into. A binary with a player-like
// name that lives anywhere else (a download folder, a temp dir, a network share) is
// not launched unless the user explicitly trusted it.
const TRUSTED_DIRS = () => {
  const home = os.homedir();
  if (process.platform === 'win32') {
    const env = process.env;
    return [
      env['ProgramFiles'], env['ProgramFiles(x86)'], env['ProgramW6432'],
      env['LOCALAPPDATA'] && path.join(env['LOCALAPPDATA'], 'Programs'),
      env['LOCALAPPDATA'] && path.join(env['LOCALAPPDATA'], 'Microsoft', 'WindowsApps'),
      env['ChocolateyInstall'] && path.join(env['ChocolateyInstall'], 'bin'),
      path.join(home, 'scoop', 'apps'), path.join(home, 'scoop', 'shims')
    ].filter(Boolean);
  }
  return [
    '/usr', '/bin', '/opt', '/snap/bin', '/var/lib/flatpak/exports/bin', '/var/lib/snapd/snap/bin',
    '/Applications', '/opt/homebrew', '/home/linuxbrew/.linuxbrew', '/nix/store', '/run/current-system/sw/bin',
    path.join(home, '.local', 'bin'), path.join(home, '.local', 'share', 'flatpak', 'exports', 'bin'),
    path.join(home, '.nix-profile', 'bin'), path.join(home, 'bin')
  ];
};

const isInside = (dir, file) => {
  const fold = (v) => (process.platform === 'win32' ? v.toLowerCase() : v);
  const rel = path.relative(fold(path.resolve(dir)), fold(path.resolve(file)));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
};

// Local absolute path only: no relative paths (resolved against whatever cwd we have) and
// no UNC / device paths, which would execute a binary from a remote share.
const isLocalAbsolute = (cmd) => {
  if (!path.isAbsolute(cmd) || cmd.includes('\0')) return false;
  if (process.platform === 'win32' && /^[\\/]{2}/.test(cmd)) return false;
  return true;
};

const knownName = (cmd) => KNOWN.has(path.basename(cmd).toLowerCase());

const isTrustedLocation = (cmd) =>
  isExtraTrusted(cmd) || TRUSTED_DIRS().some((dir) => isInside(dir, cmd));

const isAllowed = (cmd) => {
  if (typeof cmd !== 'string' || !cmd || !isLocalAbsolute(cmd)) return false;
  if (isExtraTrusted(cmd)) return true;
  return knownName(cmd) && isTrustedLocation(cmd);
};

// Player name is fine but it lives outside the usual install directories: the caller may
// ask the user (in a native dialog the page cannot drive) whether to trust it.
const needsTrust = (cmd) =>
  typeof cmd === 'string' && isLocalAbsolute(cmd) && knownName(cmd) && !isTrustedLocation(cmd);

const trust = (cmd) => {
  if (!needsTrust(cmd)) return;
  const extra = (store.get('extraPlayerBinaries') || []).filter((p) => typeof p === 'string');
  if (!extra.includes(cmd)) store.set('extraPlayerBinaries', extra.concat(cmd));
};

// Arguments Lampa's own external-player code produces (see getPlayerArgs in app.js),
// plus MPC's /new added below. Everything else is refused: media players expose far too
// many options that load scripts, write files or open IPC sockets to try to deny-list them.
const ALLOWED_FLAGS = [
  /^--extraintf=http$/,
  /^--http-host=(localhost|127\.0\.0\.1)$/,
  /^--http-port=\d{1,5}$/,
  /^--http-password=[^\0]{0,256}$/,
  /^--start-time=[0-9.eE+-]{1,32}$/,
  /^--(play-and-exit|no-loop|fullscreen)$/,
  /^\/(play|close|fullscreen|new)$/i,
  /^\/(webport|start)$/i,
  /^\d{1,12}$/ // value following /webport or /start
];
const MEDIA_URL = /^(https?|rtsps?|rtmps?|rtp|udp|mmsh?|mmst):\/\/[^\s\0]+$/i;
const MAX_ARGS = 16;
const MAX_ARG_LEN = 8192;

const isAllowedArg = (a) =>
  a.length <= MAX_ARG_LEN && (MEDIA_URL.test(a) || ALLOWED_FLAGS.some((re) => re.test(a)));

// First player found on the system — used to pre-fill Lampa's empty player path.
const detectDefaultPath = () => {
  for (const c of CANDIDATES()) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    } catch (error) {
      // keep scanning
    }
  }
  return '';
};

const detectAll = () => {
  const found = [];
  for (const c of CANDIDATES()) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        found.push({ name: path.basename(c), path: c });
      }
    } catch (error) {
      // ignore
    }
  }
  return found;
};

// Managed child processes, keyed by a small integer id handed back to the renderer.
const procs = new Map();
let nextId = 1;
const MAX_PROCS = 8;
const SIGNALS = new Set(['SIGTERM', 'SIGKILL', 'SIGINT']);

const launch = (cmd, args, onEvent) => {
  if (!isAllowed(cmd)) {
    return needsTrust(cmd)
      ? { error: `Player is outside the trusted install directories: ${cmd}`, untrusted: true }
      : { error: `Executable is not an allowed media player: ${cmd}` };
  }
  if (procs.size >= MAX_PROCS) return { error: 'Too many player processes are running' };
  // In Flatpak the host binary is not on our filesystem, so we can't stat it.
  if (!IN_FLATPAK && !fs.existsSync(cmd)) {
    return { error: `Player executable not found: ${cmd}` };
  }

  const safeArgs = Array.isArray(args) ? args.slice() : [];
  if (safeArgs.length > MAX_ARGS || !safeArgs.every((a) => typeof a === 'string' && isAllowedArg(a))) {
    return { error: 'Player arguments contain a disallowed option' };
  }
  // MPC normally redirects to an existing instance and exits immediately. Lampa
  // tracks this child to save the timecode on close, so it needs its own instance.
  // Keep this in the desktop bridge: app.js can be replaced by core auto-updates.
  if (process.platform === 'win32' && /^mpc-(hc|be)(64)?\.exe$/i.test(path.basename(cmd))
      && !safeArgs.some((arg) => arg.toLowerCase() === '/new')) {
    safeArgs.push('/new');
  }
  const exec = IN_FLATPAK ? 'flatpak-spawn' : cmd;
  const execArgs = IN_FLATPAK ? ['--host', cmd, ...safeArgs] : safeArgs;
  let child;
  try {
    child = spawn(exec, execArgs, { shell: false, detached: false, stdio: 'ignore', windowsHide: false });
  } catch (error) {
    return { error: String(error && error.message || error) };
  }

  const id = nextId++;
  procs.set(id, child);

  const forward = (type, code, signal) => { try { onEvent(id, { type, code, signal }); } catch (e) { /* renderer gone */ } };
  child.on('spawn', () => forward('spawn'));
  child.on('error', (err) => { forward('error', null, String(err && err.message || err)); procs.delete(id); });
  child.on('close', (code, signal) => { forward('close', code, signal); procs.delete(id); });
  child.on('exit', (code, signal) => forward('exit', code, signal));

  return { id, pid: child.pid };
};

const kill = (id, signal) => {
  const child = procs.get(id);
  if (child) {
    try { child.kill(SIGNALS.has(signal) ? signal : 'SIGTERM'); } catch (error) { /* already gone */ }
  }
};

const killAll = () => {
  for (const child of procs.values()) {
    try { child.kill('SIGTERM'); } catch (error) { /* ignore */ }
  }
  procs.clear();
};

module.exports = { isAllowed, needsTrust, trust, detectDefaultPath, detectAll, launch, kill, killAll };
