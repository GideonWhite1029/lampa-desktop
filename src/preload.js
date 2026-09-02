const { contextBridge, ipcRenderer } = require('electron');

// Which Lampa core (app.js + app.css) index.html should load.
let lampaAssets = { js: 'app.js', css: 'css/app.css?v=4.56' };
try {
  const a = ipcRenderer.sendSync('lampa:assets');
  if (a && a.js) lampaAssets = a;
} catch (error) {
  // keep bundled defaults
}
contextBridge.exposeInMainWorld('__lampaAssets', lampaAssets);

// Pre-fill Lampa's external-player path on first run.
try {
  if (!window.localStorage.getItem('player_nw_path')) {
    const detected = ipcRenderer.sendSync('desktop:defaultPlayerPath');
    if (detected) window.localStorage.setItem('player_nw_path', detected);
  }
} catch (error) {
  // storage may be unavailable very early; harmless
}

// Minimal EventEmitter for the fake ChildProcess.
const makeEmitter = () => {
  const handlers = Object.create(null);
  return {
    on(event, cb) { (handlers[event] = handlers[event] || []).push(cb); return this; },
    once(event, cb) {
      const wrap = (...a) => { this.off(event, wrap); cb(...a); };
      return this.on(event, wrap);
    },
    off(event, cb) {
      if (handlers[event]) handlers[event] = handlers[event].filter((h) => h !== cb);
      return this;
    },
    emit(event, ...args) {
      (handlers[event] || []).slice().forEach((h) => { try { h(...args); } catch (e) {} });
    }
  };
};

const noopStream = { on() { return this; }, once() { return this; }, off() { return this; }, pipe() {}, read() { return null; } };

// Node "require" shim — only what Lampa's player code needs.
const fsShim = {
  existsSync: (p) => {
    try { return ipcRenderer.sendSync('node-fs:existsSync', String(p)); } catch (e) { return false; }
  }
};

const childProcessShim = {
  spawn: (cmd, args) => {
    const emitter = makeEmitter();
    let res;
    try {
      res = ipcRenderer.sendSync('node-cp:spawn', {
        cmd: String(cmd),
        args: Array.isArray(args) ? args.map(String) : []
      });
    } catch (e) {
      res = { error: String((e && e.message) || e) };
    }

    const child = {
      pid: res && res.pid,
      stdout: noopStream,
      stderr: noopStream,
      stdin: noopStream,
      kill: (signal) => {
        if (res && res.id != null) ipcRenderer.send('node-cp:kill', { id: res.id, signal });
      },
      on: (...a) => emitter.on(...a),
      once: (...a) => emitter.once(...a),
      off: (...a) => emitter.off(...a),
      removeListener: (...a) => emitter.off(...a)
    };

    if (!res || res.error) {
      setTimeout(() => emitter.emit('error', new Error((res && res.error) || 'spawn failed')), 0);
      return child;
    }

    const channel = `node-cp:event:${res.id}`;
    const listener = (event, data) => {
      if (data.type === 'error') emitter.emit('error', new Error(data.signal || 'process error'));
      else if (data.type === 'close') { emitter.emit('close', data.code, data.signal); ipcRenderer.removeListener(channel, listener); }
      else emitter.emit(data.type, data.code, data.signal);
    };
    ipcRenderer.on(channel, listener);

    return child;
  }
};

const requireShim = (name) => {
  if (name === 'fs') return fsShim;
  if (name === 'child_process') return childProcessShim;
  throw new Error(`module "${name}" is not available in the Lampa desktop renderer`);
};

contextBridge.exposeInMainWorld('require', requireShim);

// Public convenience API.
contextBridge.exposeInMainWorld('api', {
  fileExists: (p) => fsShim.existsSync(p),
  detectPlayers: () => ipcRenderer.invoke('desktop:detectPlayers'),
  checkLampaCore: () => ipcRenderer.invoke('desktop:checkLampaCore'),
  lampaCoreInfo: () => ipcRenderer.invoke('desktop:lampaCoreInfo'),
  desktopConfig: () => ipcRenderer.invoke('desktop:config'),
  setDesktop: (patch) => ipcRenderer.invoke('desktop:set', patch)
});
