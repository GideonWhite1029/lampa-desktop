const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('node:path');
const { updateElectronApp, UpdateSourceType} = require('update-electron-app');

if (require('electron-squirrel-startup')) {
  app.quit();
}

// Разрешаем autoplay без user gesture (нужно для YouTube трейлеров)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false,
      allowRunningInsecureContent: true,
      webSecurity: false
    },
    icon: path.join(__dirname, 'img', 'og.png'),
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  mainWindow.setMenu(null)
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    if (process.platform === 'darwin') {
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
};

app.whenReady().then(async () => {
  // Подменяем User-Agent чтобы YouTube не блокировал iframe в Electron
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = chromeUA;
    callback({ requestHeaders: details.requestHeaders });
  });

  createWindow();

  // Открываем YouTube трейлер в отдельном окне как настоящий браузер
  ipcMain.on('open-youtube', (event, videoId) => {
    const ytWin = new BrowserWindow({
      width: 1280,
      height: 720,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        allowRunningInsecureContent: true
      },
      autoHideMenuBar: true
    });
    ytWin.setMenu(null);
    const url = 'https://www.youtube.com/watch?v=' + videoId;
    ytWin.loadURL(url);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  try {
    updateElectronApp({
        updateSource: {
            type: UpdateSourceType.ElectronPublicUpdateService,
            repo: 'GideonWhite1029/lampa-desktop'
        },
        updateInterval: '1 hour',
        logger: require('electron-log')
    });
  } catch (error) {
    console.error('Ошибка при настройке автообновлений:', error);
  }

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
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