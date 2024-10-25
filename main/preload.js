const { contextBridge, ipcRenderer } = require("electron");

// API Definition
const electronAPI = {
  getProfile: () => ipcRenderer.invoke('auth:get-profile'),
  logOut: () => ipcRenderer.send('auth:log-out'),
  getPrivateData: () => ipcRenderer.invoke('api:get-private-data'),
};

// Register the API with the contextBridge
process.once("loaded", () => {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
});