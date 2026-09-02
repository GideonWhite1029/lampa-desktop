const { app, BrowserWindow, shell, ipcMain, Menu, powerSaveBlocker, screen, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const log = require('electron-log');
const { updateElectronApp, UpdateSourceType } = require('update-electron-app');
const store = require('./store');
const players = require('./players');
const menu = require('./menu');
const lampaCore = require('./lampa-core');

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let miniPlayerPrev = null;
let psbId = null;
let windowCreatedAt = 0;
let lampaCoreReloaded = false;
let lampaCoreLoadedVersion = null;

const isExternalHttpUrl = (url) => {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const openExternalIfHttp = (url) => {
  if (isExternalHttpUrl(url)) shell.openExternal(url);
  else log.warn('Blocked attempt to open non-http(s) URL:', url);
};

// IPC: node shims consumed by Lampa's own external-player code.
// Lampa calls require('fs').existsSync(...) synchronously, so this must be sync.
ipcMain.on('node-fs:existsSync', (event, filePath) => {
  let result = false;
  try {
    result = typeof filePath === 'string' && fs.existsSync(filePath);
  } catch (error) {
    result = false;
  }
  event.returnValue = result;
});

ipcMain.on('node-cp:spawn', (event, payload) => {
  const { cmd, args } = payload || {};
  const sender = event.sender;
  const res = players.launch(cmd, args, (id, data) => {
    if (!sender.isDestroyed()) sender.send(`node-cp:event:${id}`, data);
  });
  if (res.error) log.warn('Rejected player spawn:', res.error);
  event.returnValue = res;
});

ipcMain.on('node-cp:kill', (event, { id, signal } = {}) => players.kill(id, signal));

// Pre-fill Lampa's empty external-player path with whatever is installed.
ipcMain.on('desktop:defaultPlayerPath', (event) => {
  event.returnValue = players.detectDefaultPath();
});

ipcMain.handle('desktop:detectPlayers', () => players.detectAll());

// IPC: Lampa core (app.js + app.css) self-update.
// index.html asks (synchronously, before it injects any tags) which app.js/app.css to load.
ipcMain.on('lampa:assets', (event) => {
  const a = lampaCore.activeAssets();
  lampaCoreLoadedVersion = a.version;
  event.returnValue = a.source === 'downloaded'
    ? { js: pathToFileURL(a.js).href, css: pathToFileURL(a.css).href, version: a.version }
    : { js: 'app.js', css: 'css/app.css?v=4.56', version: a.version };
});

const applyCoreUpdate = (result) => {
  if (!result || result.status !== 'updated' || !mainWindow) return;
  const freshEnough = Date.now() - windowCreatedAt < 25000;
  const stillOnIndex = mainWindow.webContents.getURL().endsWith('/index.html');
  if (!lampaCoreReloaded && freshEnough && stillOnIndex && result.version !== lampaCoreLoadedVersion) {
    lampaCoreReloaded = true;
    log.info(`[lampa-core] applying ${result.version} via reload`);
    mainWindow.reload();
  }
};

const runCoreCheck = () => lampaCore.checkAndUpdate()
  .then((result) => { applyCoreUpdate(result); return result; })
  .catch((error) => { log.warn('[lampa-core] check error:', error && error.message); return { status: 'error' }; });

ipcMain.handle('desktop:checkLampaCore', async () => runCoreCheck());
ipcMain.handle('desktop:lampaCoreInfo', () => ({
  autoUpdate: lampaCore.isAutoUpdate(),
  active: lampaCore.activeAssets().version,
  source: lampaCore.activeAssets().source
}));

// Read/write the desktop-only options surfaced inside Lampa's Settings ("Приложение").
ipcMain.handle('desktop:config', () => {
  const net = store.get('network') || {};
  const core = lampaCore.activeAssets();
  return {
    doh: net.doh === true,
    proxy: typeof net.proxy === 'string' ? net.proxy : '',
    lampaAutoUpdate: lampaCore.isAutoUpdate(),
    coreVersion: core.version,
    coreSource: core.source
  };
});

// '' (none), 'system', or scheme://host[:port] with a known proxy scheme.
const isValidProxyRule = (value) =>
  value === '' || value === 'system' ||
  /^(https?|socks|socks4|socks5):\/\/[^\s/]+$/i.test(value);

ipcMain.handle('desktop:set', (event, patch) => {
  patch = patch || {};
  if (typeof patch.doh === 'boolean') store.merge('network', { doh: patch.doh });
  if (typeof patch.proxy === 'string') {
    const proxy = patch.proxy.trim();
    if (isValidProxyRule(proxy)) store.merge('network', { proxy });
    else log.warn('[net] ignored malformed proxy rule from renderer:', proxy);
  }
  if (typeof patch.lampaAutoUpdate === 'boolean') lampaCore.setAutoUpdate(patch.lampaAutoUpdate);
  applyNetworkConfig();
  return { ok: true };
});

// Mini-player (always-on-top compact window).
const toggleMiniPlayer = () => {
  if (!mainWindow) return;
  if (miniPlayerPrev) {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setMinimumSize(800, 600);
    if (miniPlayerPrev.maximized) mainWindow.maximize();
    else mainWindow.setBounds(miniPlayerPrev.bounds);
    miniPlayerPrev = null;
  } else {
    miniPlayerPrev = { bounds: mainWindow.getBounds(), maximized: mainWindow.isMaximized() };
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    mainWindow.setMinimumSize(320, 180);
    const area = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setBounds({ width: 500, height: 281, x: area.width - 520, y: 40 });
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  }
};

// Window.
const persistBounds = () => {
  if (!mainWindow || miniPlayerPrev) return;
  const maximized = mainWindow.isMaximized();
  const b = mainWindow.getBounds();
  store.merge('window', {
    maximized,
    width: maximized ? store.get('window').width : b.width,
    height: maximized ? store.get('window').height : b.height,
    x: maximized ? store.get('window').x : b.x,
    y: maximized ? store.get('window').y : b.y
  });
};

const createWindow = () => {
  const w = store.get('window');

  mainWindow = new BrowserWindow({
    width: w.width,
    height: w.height,
    x: w.x,
    y: w.y,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1d1f20',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false
    },
    icon: path.join(__dirname, 'img', 'og.png'),
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webSecurity: true
  });

  if (w.maximized) mainWindow.maximize();

  windowCreatedAt = Date.now();
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (process.platform === 'darwin') mainWindow.focus();
  });

  const wc = mainWindow.webContents;

  // Keep the screen awake only while media is actually playing.
  wc.on('media-started-playing', () => {
    if (psbId === null || !powerSaveBlocker.isStarted(psbId)) {
      psbId = powerSaveBlocker.start('prevent-display-sleep');
    }
  });
  wc.on('media-paused', () => {
    if (psbId !== null && powerSaveBlocker.isStarted(psbId)) {
      powerSaveBlocker.stop(psbId);
      psbId = null;
    }
  });

  wc.on('will-navigate', (event, navigationUrl) => {
    if (navigationUrl !== wc.getURL()) {
      event.preventDefault();
      openExternalIfHttp(navigationUrl);
    }
  });

  wc.setWindowOpenHandler(({ url }) => {
    openExternalIfHttp(url);
    return { action: 'deny' };
  });

  mainWindow.on('resize', persistBounds);
  mainWindow.on('move', persistBounds);
  mainWindow.on('close', persistBounds);
  mainWindow.on('closed', () => { mainWindow = null; });
};

// Network: DNS-over-HTTPS + optional proxy.
// (works around ISP DNS poisoning, e.g. TMDB blocked in some regions)
let dohApplied = false;

const applyNetworkConfig = () => {
  const net = store.get('network') || {};

  const servers = net.doh === true
    ? (net.dohServers || [])
    : (Array.isArray(net.doh) ? net.doh : (typeof net.doh === 'string' && net.doh ? [net.doh] : []));

  // Only touch the resolver when DoH is enabled, so "off" is 100% transparent on
  // startup. If we turned it on earlier this session, an explicit "off" undoes it live.
  try {
    if (servers.length) {
      app.configureHostResolver({
        // built-in resolver is required for DoH on Linux/Windows (off there by default)
        enableBuiltInResolver: true,
        secureDnsMode: 'secure',
        secureDnsServers: servers
      });
      dohApplied = true;
      log.info('[net] DoH enabled:', servers.join(', '));
    } else if (dohApplied) {
      app.configureHostResolver({ secureDnsMode: 'off' });
      dohApplied = false;
      log.info('[net] DoH disabled');
    }
  } catch (error) {
    log.warn('[net] configureHostResolver failed:', error && error.message);
  }

  if (net.proxy && typeof net.proxy === 'string') {
    const { session } = require('electron');
    const rules = net.proxy === 'system'
      ? { mode: 'system' }
      : { proxyRules: net.proxy };
    session.defaultSession.setProxy(rules)
      .then(() => log.info('[net] proxy:', net.proxy))
      .catch((error) => log.warn('[net] setProxy failed:', error && error.message));
  }
};

const setDoh = (enabled) => store.merge('network', { doh: !!enabled });
const getDoh = () => store.get('network').doh !== false;

// App lifecycle.
app.on('web-contents-created', (event, contents) => {
  contents.on('will-attach-webview', (attachEvent) => attachEvent.preventDefault());
  contents.setWindowOpenHandler(({ url }) => {
    openExternalIfHttp(url);
    return { action: 'deny' };
  });
});

app.whenReady().then(async () => {
  applyNetworkConfig();

  // Let Lampa's localhost timecode polling (VLC / MPC web APIs) read cross-origin from file://.
  const { session } = require('electron');
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(details.url)) {
      callback({
        responseHeaders: Object.assign({}, details.responseHeaders, {
          'access-control-allow-origin': ['*'],
          'access-control-allow-headers': ['*']
        })
      });
    } else {
      callback({ responseHeaders: details.responseHeaders });
    }
  });

  createWindow();
  Menu.setApplicationMenu(menu.build({
    win: mainWindow,
    onToggleMiniPlayer: toggleMiniPlayer,
    getDoh,
    onSetDoh: (enabled) => {
      setDoh(enabled);
      applyNetworkConfig();
      if (mainWindow) dialog.showMessageBox(mainWindow, {
        type: 'info',
        message: enabled ? 'DNS через HTTPS включён' : 'DNS через HTTPS выключен',
        detail: 'Перезапустите приложение, чтобы применить полностью.'
      });
    },
    onOpenConfig: () => shell.openPath(store.FILE),
    getLampaAutoUpdate: () => lampaCore.isAutoUpdate(),
    onSetLampaAutoUpdate: (enabled) => lampaCore.setAutoUpdate(enabled),
    onCheckLampaCore: async () => {
      const result = await runCoreCheck();
      if (!mainWindow) return;
      if (result.status === 'updated' && !lampaCoreReloaded) {
        const { response } = await dialog.showMessageBox(mainWindow, {
          type: 'info',
          buttons: ['Перезапустить', 'Позже'],
          defaultId: 0,
          message: `Ядро Lampa обновлено до ${result.version}`,
          detail: 'Изменения вступят в силу после перезагрузки окна.'
        });
        if (response === 0) { lampaCoreReloaded = true; mainWindow.reload(); }
      } else if (result.status === 'up-to-date') {
        dialog.showMessageBox(mainWindow, { type: 'info', message: `Ядро Lampa актуально (${result.version})` });
      } else if (result.status === 'error') {
        dialog.showMessageBox(mainWindow, { type: 'warning', message: 'Не удалось проверить обновление ядра Lampa' });
      }
    }
  }));

  // Check for a newer Lampa core in the background; applied now if it lands during startup.
  runCoreCheck();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  try {
    updateElectronApp({
      updateSource: {
        type: UpdateSourceType.ElectronPublicUpdateService,
        repo: 'GideonWhite1029/lampa-desktop'
      },
      updateInterval: '1 hour',
      logger: log
    });
  } catch (error) {
    log.error('Ошибка при настройке автообновлений:', error);
  }
});

app.on('before-quit', () => players.killAll());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

process.on('uncaughtException', (error) => {
  log.error('Необработанная ошибка:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Необработанное отклонение промиса:', promise, 'причина:', reason);
});
