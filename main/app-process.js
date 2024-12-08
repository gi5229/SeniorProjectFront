const { BrowserWindow } = require("electron");
const path = require("path");


function createAppWindow() {
  let win = new BrowserWindow({
    width: 1920,
    height: 1080,
    titleBarStyle: 'hidden',
    frame: false,
    titleBarOverlay: {
      color: '#1a1a1a',
      symbolColor: '#ff6b2b',
      height: 60
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      overflow: 'hidden',
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  

  win.loadFile('./renderers/base.html');

  win.on('closed', () => {
    // TODO: Dissconnect all mapped network drives..... maybe
    win = null;
  });
}

module.exports = createAppWindow;
