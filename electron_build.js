const { app, ipcMain, contextBridge, BrowserWindow } = require('electron')
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: __dirname + '/preload.js',
            experimentalFeatures: true,
            nodeIntegration: true,
        }
    })

    win.setMenu(null)
    // win.webContents.openDevTools()
    win.loadFile('index.html').catch(error => {
        console.error(error)
    })
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (!app.hasWindows()) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})