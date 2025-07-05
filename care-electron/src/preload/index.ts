import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  browseImage: (date: string, folderPath: string) =>
    ipcRenderer.invoke('browseImage', date, folderPath),
  viewImage: (date: string, imagePath: string) => ipcRenderer.invoke('viewImage', date, imagePath),
  getImagePaths: (currentFolder: string) => ipcRenderer.invoke('getImagePaths', currentFolder),
  downloadSelectedGalleryImages: (selectedPaths: string) =>
    ipcRenderer.invoke('downloadSelectedGalleryImages', selectedPaths)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    console.log('API exposed to main world via contextBridge.')
  } catch (error) {
    console.error('Error exposing API via contextBridge:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  console.log('API exposed directly to window object (context isolation disabled).')
}
