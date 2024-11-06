const { BrowserWindow } = require("electron");
const path = require("path");


function createAppWindow() {
  let win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      overflow: 'hidden',
    }
  });

  win.loadFile('./renderers/home.html');

  win.on('closed', () => {
    win = null;
  });
}

module.exports = createAppWindow;
