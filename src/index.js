const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const {UpdateSourceType, updateElectronApp} = require("update-electron-app");

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      experimentalFeatures: true,
      nodeIntegration: true
    },
    icon: "/img/og.png"
  });

  mainWindow.setMenu(null)
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  const { updateElectronApp } = require('update-electron-app');
  updateElectronApp({
    updateInterval: '1 hours'
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
