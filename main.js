const { app, ipcMain, BrowserWindow } = require('electron');

const { createAuthWindow, createLogoutWindow } = require('./main/auth-process');
const createAppWindow = require('./main/app-process');
const authService = require('./services/auth-service');
const apiService = require('./services/api-service');

async function showWindow() {
  try {
    await authService.refreshTokens();
    createAppWindow();
  } catch (err) {
    createAuthWindow();
  }
}


// TODO: Remove special console log later
var nodeConsole = require('console');
var myConsole = new nodeConsole.Console(process.stdout, process.stderr);


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {



  // Handle IPC messages from the renderer process.
  ipcMain.handle('auth:get-profile', authService.getProfile);
  ipcMain.handle('api:get-private-data', apiService.getPrivateData);
  ipcMain.on('auth:log-out', () => {
    console.log('logout');
    BrowserWindow.getAllWindows().forEach(window => window.close());
    createLogoutWindow();
  });

  ipcMain.handle('auth:create-drive', async (event, driveName) => {
    console.log('Received driveName:', driveName); // Log the drive name in main.js
    await authService.createDrive(driveName);
  });

  ipcMain.handle('auth:refresh-tokens', authService.refreshTokens);

  ipcMain.handle('auth:mount-drive', async (event, driveLetter, dataset) => {
    console.log(`Received driveLetter: ${driveLetter} and dataset: ${dataset}`); // Log the drive letter and dataset in main.js
    authService.mountDrive(driveLetter, dataset);
    
  });

  showWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
});
