const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');

// Initialize electron store
const store = new Store();

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
  });

  // Load the index.html file
  mainWindow.loadFile('src/index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();

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

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Sale',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-sale');
          },
        },
        {
          label: 'Print Receipt',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('menu-print-receipt');
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Inventory',
      submenu: [
        {
          label: 'Add Product',
          click: () => {
            mainWindow.webContents.send('menu-add-product');
          },
        },
        {
          label: 'Manage Inventory',
          click: () => {
            mainWindow.webContents.send('menu-manage-inventory');
          },
        },
      ],
    },
    {
      label: 'Reports',
      submenu: [
        {
          label: 'Daily Sales',
          click: () => {
            mainWindow.webContents.send('menu-daily-sales');
          },
        },
        {
          label: 'Inventory Report',
          click: () => {
            mainWindow.webContents.send('menu-inventory-report');
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Shop POS System',
              message: 'Shop POS System v1.0.0',
              detail: 'A comprehensive point-of-sale system for retail shops.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for data persistence
ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('store-delete', (event, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle('store-clear', (event) => {
  store.clear();
  return true;
});

// File system operations
ipcMain.handle('save-file', async (event, filename, data) => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, filename);
    fs.writeFileSync(filePath, data);
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filename) => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Print dialog
ipcMain.handle('show-print-dialog', async (event) => {
  try {
    const result = await mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      deviceName: '',
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Data management operations
ipcMain.handle('get-data-path', async (event) => {
  try {
    const userDataPath = app.getPath('userData');
    const storePath = path.join(userDataPath, 'config.json');
    return storePath;
  } catch (error) {
    return 'Unable to determine data path';
  }
});

ipcMain.handle('open-data-folder', async (event) => {
  try {
    const userDataPath = app.getPath('userData');
    await shell.openPath(userDataPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
