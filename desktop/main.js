// Coremon para PC (Windows / Linux / macOS) — un juego de acorik.
// Ventana de Electron que carga el juego HTML5 incluido en ./game.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1120, height: 720, minWidth: 420, minHeight: 480,
    backgroundColor: '#14151f',
    title: 'Coremon: Edición Corazonistas Vitoria',
    icon: path.join(__dirname, 'game', 'icons', 'icon-512.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'game', 'index.html'));
  // los enlaces externos se abren en el navegador
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); shell.openExternal(url); } });
  // F11: pantalla completa
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
