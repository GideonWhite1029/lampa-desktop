const { contextBridge } = require('electron');
const fs = require('fs');
const { spawn } = require('child_process');
contextBridge.exposeInMainWorld('api', {
    fileExists: (path) => fs.existsSync(path),
    spawnProcess: (path, args) => spawn(path, args),
});