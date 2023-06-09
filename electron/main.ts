import { app, BrowserWindow, Menu } from 'electron'
import path from 'node:path'

process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')


let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 960,
    height: 720,
    icon: path.join(process.env.PUBLIC, 'arc.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  //open devtools
  win.webContents.openDevTools()

  createMenu()
}

function createMenu() {
  const template = [
    {
      label: 'Reload',
      accelerator: 'CmdOrCtrl+Shift+R',
      click: function () {
        win?.webContents.reload()
      }
    },
    {
      label: 'Toggle DevTools',
      accelerator: 'CmdOrCtrl+Shift+I',
      click: function () {
        win?.webContents.toggleDevTools()
      }
    },
    {
      label: 'Window size',
      submenu: [
        {
          label: '800x600 (original)',
          click: function () {
            win?.setSize(800, 600)
          }
        },
        {
          label: '960x720 (x1.2)',
          click: function () {
            win?.setSize(960, 720)
          }
        },
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'GitHub',
          click: function () {
            require('electron').shell.openExternal('https://github.com/requinDr/tsukihime-port')
          }
        }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.on('window-all-closed', () => {
  win = null
})

app.whenReady().then(createWindow)
