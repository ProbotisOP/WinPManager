const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('winpmanager', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Port operations
  getPorts: () => ipcRenderer.invoke('get-ports'),
  killPort: (port) => ipcRenderer.invoke('kill-port', port),
  killPid: (pid) => ipcRenderer.invoke('kill-pid', pid),
  killManyPids: (pids) => ipcRenderer.invoke('kill-many-pids', pids),

  // Utilities
  openExternal: (url) => ipcRenderer.invoke('open-external-url', url),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  copyText: (text) => ipcRenderer.invoke('copy-text', text),

  // Platform flag
  isElectron: true
});
