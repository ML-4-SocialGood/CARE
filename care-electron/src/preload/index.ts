import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  browseImage: (date: string, folderPath: string) =>
    ipcRenderer.invoke('browseImage', date, folderPath),
  viewImage: (date: string, imagePath: string) => ipcRenderer.invoke('viewImage', date, imagePath),
  getImagePaths: (currentFolder: string) => ipcRenderer.invoke('getImagePaths', currentFolder),
  downloadSelectedGalleryImages: (selectedPaths: string) =>
    ipcRenderer.invoke('downloadSelectedGalleryImages', selectedPaths),
  uploadImage: (relativePath: string, data: Uint8Array) =>
    ipcRenderer.invoke('uploadImage', relativePath, data),
  detect: (selectedPaths: string[]) => ipcRenderer.invoke('detect', selectedPaths),
  addStreamListener: (callback: (event: IpcRendererEvent, txt: string) => void) =>
    ipcRenderer.addListener('stream', callback),
  removeStreamListener: (callback: (event: IpcRendererEvent, txt: string) => void) =>
    ipcRenderer.removeListener('stream', callback),
  browseDetectImage: (
    date: string,
    folderPath: string,
    filterLabel: string,
    confLow: number,
    confHigh: number
  ) => ipcRenderer.invoke('browseDetectImage', date, folderPath, filterLabel, confLow, confHigh),
  viewDetectImage: (date: string, imagePath: string) =>
    ipcRenderer.invoke('viewDetectImage', date, imagePath),

  getDetectImagePaths: (dirPath: string, filterLabel: string, confLow: number, confHigh: number) =>
    ipcRenderer.invoke('getDetectImagePaths', dirPath, filterLabel, confLow, confHigh),

  downloadDetectImages: (filterLabel: string) =>
    ipcRenderer.invoke('downloadDetectImages', filterLabel),
  downloadSelectedDetectImages: (selectPaths: string[]) =>
    ipcRenderer.invoke('downloadSelectedDetectImages', selectPaths)
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
