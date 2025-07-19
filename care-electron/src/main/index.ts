import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ico from '../../resources/icon.ico?asset'
import icon from '../../resources/icon.png?asset'
import icns from '../../resources/icon.icns?asset'
import {
  browseDetectImage,
  browseImage,
  browseReidImage,
  detect,
  deleteReidResult,
  downloadSelectedGalleryImages,
  downloadDetectImages,
  downloadReidImages,
  downloadSelectedDetectImages,
  getDetectImagePaths,
  getImagePaths,
  renameReidGroup,
  runReid,
  terminateAI,
  uploadImage,
  viewDetectImage,
  viewImage
} from './controller'

let mainWindow: BrowserWindow

function appIcon(): string {
  switch (process.platform) {
    case 'win32': {
      return ico
    }
    case 'darwin': {
      return icns
    }
    default: {
      return icon
    }
  }
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    icon: appIcon(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (process.env.OPEN_DEVTOOLS === 'true' || app.commandLine.hasSwitch('debug')) {
      mainWindow.webContents.openDevTools();
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  let stream = (txt: string) => {
    if (mainWindow) {
      mainWindow.webContents.send('stream', txt)
    } else {
      console.log('null mainWindow, cannot send stream data')
    }
  }

  ipcMain.handle('browseImage', (_, date, folderPath) => browseImage(date, folderPath))
  ipcMain.handle('viewImage', (_, date, imagePath) => viewImage(date, imagePath))
  ipcMain.handle('getImagePaths', (_, currentFolder) => getImagePaths(currentFolder))
  ipcMain.handle('downloadSelectedGalleryImages', (_, selectedPaths) =>
    downloadSelectedGalleryImages(selectedPaths)
  )
  ipcMain.handle('uploadImage', (_, relativePath, data) => uploadImage(relativePath, data))
  ipcMain.handle('detect', (_, selectedPaths) => detect(selectedPaths, stream))
  ipcMain.handle('browseDetectImage', (_, date, folderPath, filterLabel, confLow, confHigh) =>
    browseDetectImage(date, folderPath, filterLabel, confLow, confHigh)
  )
  ipcMain.handle('viewDetectImage', (_, date, imagePath) => viewDetectImage(date, imagePath))
  ipcMain.handle('getDetectImagePaths', (_, dirPath, filterLabel, confLow, confHigh) =>
    getDetectImagePaths(dirPath, filterLabel, confLow, confHigh)
  )
  ipcMain.handle('downloadDetectImages', (_, filterLabel) => downloadDetectImages(filterLabel))
  ipcMain.handle('downloadSelectedDetectImages', (_, selectPaths) =>
    downloadSelectedDetectImages(selectPaths)
  )
  ipcMain.handle('runReid', (_, selectedPaths) => runReid(selectedPaths, stream))
  ipcMain.handle('browseReidImage', (_, date, time, group_id) =>
    browseReidImage(date, time, group_id)
  )
  ipcMain.handle('downloadReidImages', (_, date, time) => downloadReidImages(date, time))
  ipcMain.handle('deleteReidResult', (_, date, time) => deleteReidResult(date, time))
  ipcMain.handle('renameReidGroup', (_, date, time, old_group_id, new_group_id) =>
    renameReidGroup(date, time, old_group_id, new_group_id)
  )
  ipcMain.handle('terminateAI', (_) => terminateAI())

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
