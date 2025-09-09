const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow

function createWindow() {
  // Ana pencereyi oluştur
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
    titleBarStyle: 'default',
    show: false
  })

  // Uygulama yüklendiğinde pencereyi göster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // URL'yi yükle
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : 'http://localhost:3000'
  
  mainWindow.loadURL(startUrl)

  // Pencere kapatıldığında
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Dış linkleri varsayılan tarayıcıda aç
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// Uygulama hazır olduğunda
app.whenReady().then(() => {
  createWindow()

  // macOS'ta dock'tan tıklandığında pencereyi yeniden aç
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Tüm pencereler kapatıldığında uygulamayı kapat (macOS hariç)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Menü oluştur
const template = [
  {
    label: 'Dosya',
    submenu: [
      {
        label: 'Yeni Başvuru',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('new-application')
        }
      },
      {
        label: 'CSV İçe Aktar',
        accelerator: 'CmdOrCtrl+I',
        click: () => {
          mainWindow.webContents.send('import-csv')
        }
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit()
        }
      }
    ]
  },
  {
    label: 'Görünüm',
    submenu: [
      {
        label: 'Yeniden Yükle',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          mainWindow.reload()
        }
      },
      {
        label: 'Geliştirici Araçları',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
        click: () => {
          mainWindow.webContents.toggleDevTools()
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)