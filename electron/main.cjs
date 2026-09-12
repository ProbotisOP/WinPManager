const { app, BrowserWindow, ipcMain, shell, clipboard, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const portEngine = require('./portEngine.cjs');

let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const logoPath = path.join(__dirname, '../public/Logo.png');

function createTrayIcon() {
  try {
    const icon = nativeImage.createFromPath(logoPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip('WinPManager - Dev Port Controller');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open WinPManager',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Kill All Dev Ports',
        click: async () => {
          const res = await portEngine.scanPorts();
          const devPids = res.ports.filter(p => p.isDevServer).map(p => p.pid);
          if (devPids.length > 0) {
            await portEngine.killManyPids(devPids);
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (e) {
    console.warn('Tray icon initialization failed:', e.message);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1160,
    height: 780,
    minWidth: 880,
    minHeight: 560,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#090d16',
    icon: logoPath,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  // Smooth appearance when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Try local dev URL or dist/index.html
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath).catch(() => {
      // Fallback if dist doesn't exist yet
      mainWindow.loadURL('http://localhost:5199');
    });
  }

  // Prevent closing when minimized if tray is active
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      // Allow close or minimize
    }
  });
}

// IPC Handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('get-ports', async () => {
  try {
    return await portEngine.scanPorts();
  } catch (err) {
    console.error('Error scanning ports:', err);
    return {
      timestamp: Date.now(),
      ports: [],
      totalListening: 0,
      devPortsCount: 0,
      systemPortsCount: 0,
      memoryTotalDevBytes: 0,
      error: err.message
    };
  }
});

ipcMain.handle('kill-port', async (event, port) => {
  try {
    return await portEngine.killPort(Number(port));
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('kill-pid', async (event, pid) => {
  try {
    return await portEngine.killProcessTree(Number(pid));
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('kill-many-pids', async (event, pids) => {
  try {
    return await portEngine.killManyPids(pids.map(Number));
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-external-url', async (event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (err) {
    console.error('Failed to open external url:', err);
    return false;
  }
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    if (folderPath) {
      await shell.openPath(folderPath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to open folder:', err);
    return false;
  }
});

ipcMain.handle('copy-text', (event, text) => {
  clipboard.writeText(String(text));
  return true;
});

app.whenReady().then(() => {
  createWindow();
  createTrayIcon();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
