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

const isAllowed = (cmd) => {
  if (typeof cmd !== 'string' || !cmd) return false;
  const base = path.basename(cmd).toLowerCase();
  if (KNOWN.has(base)) return true;
  const extra = store.get('extraPlayerBinaries') || [];
  return extra.some((p) => typeof p === 'string' && path.resolve(p) === path.resolve(cmd));
};

// Flags that make a media player load and run attacker-controlled code
// (mpv Lua scripts / IPC, VLC Lua interfaces, youtube-dl passthrough, custom
// config dirs). Lampa itself never passes any of these.
const DANGEROUS_ARG = /^--?(scripts?|load-scripts|script-opts|lua-intf|lua-config|lua-file|luaintf|input-ipc-server|input-conf|input-file|config-dir|ytdl-raw-options)(=|$)/i;
const hasDangerousArg = (args) => args.some((a) =>
  DANGEROUS_ARG.test(a) || /^--extraintf=.*lua/i.test(a));

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

const launch = (cmd, args, onEvent) => {
  if (!isAllowed(cmd)) {
    return { error: `Executable is not an allowed media player: ${cmd}` };
  }
  // In Flatpak the host binary is not on our filesystem, so we can't stat it.
  if (!IN_FLATPAK && !fs.existsSync(cmd)) {
    return { error: `Player executable not found: ${cmd}` };
  }

  const safeArgs = Array.isArray(args) ? args.filter((a) => typeof a === 'string') : [];
  if (hasDangerousArg(safeArgs)) {
    return { error: 'Player arguments contain a disallowed option' };
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
    try { child.kill(signal || 'SIGTERM'); } catch (error) { /* already gone */ }
  }
};

const killAll = () => {
  for (const child of procs.values()) {
    try { child.kill('SIGTERM'); } catch (error) { /* ignore */ }
  }
  procs.clear();
};

module.exports = { isAllowed, detectDefaultPath, detectAll, launch, kill, killAll };
