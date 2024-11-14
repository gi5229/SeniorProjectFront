const { contextBridge, ipcRenderer } = require("electron");

const electronAPI = {
  getProfile: () => ipcRenderer.invoke('auth:get-profile'),
  logOut: () => ipcRenderer.send('auth:log-out'),
  getPrivateData: () => ipcRenderer.invoke('api:get-private-data'),
  createDrive: (driveName) => ipcRenderer.invoke('auth:create-drive', driveName),
  refreshTokens: () => ipcRenderer.invoke('auth:refresh-tokens'),
  mountDrive: (driveLetter, dataset) => ipcRenderer.invoke('auth:mount-drive', driveLetter, dataset),
  
};

process.once("loaded", () => {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
});
