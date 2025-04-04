const { app, BrowserWindow, protocol } = require('electron')
const path = require('path')
const fs = require('fs')
const url = require('url')

// Keep a global reference of the window object
let mainWindow

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // In production (packaged app), load from the out directory
  if (app.isPackaged) {
    // Register protocol handler for serving static files
    protocol.registerFileProtocol('file', (request, callback) => {
      const url = request.url.substr(7)
      try {
        return callback(decodeURIComponent(url))
      } catch (error) {
        console.error('Failed to register protocol', error)
      }
    })

    const indexPath = path.join(__dirname, 'out', 'index.html')
    
    if (fs.existsSync(indexPath)) {
      // Use file URL format to ensure proper base path resolution
      mainWindow.loadFile(indexPath)
    } else {
      console.error('Could not find index.html in out directory')
    }
  } else {
    // In development, connect to the Next.js dev server
    mainWindow.loadURL('http://localhost:3000')
  }

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools()
}

// Initialize app when ready
app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})