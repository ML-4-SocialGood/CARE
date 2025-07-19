import fs from 'fs-extra'
import path from 'path'
import archiver from 'archiver'
import { spawn, ChildProcess, spawnSync } from 'node:child_process'
import os from 'os'
import { app, dialog } from 'electron'
import { lookup } from 'mime-types'

function getAppDataDir() {
  if (process.platform === 'win32') {
    let appDataPath = process.env.APPDATA || process.env.LOCALAPPDATA
    if (appDataPath) {
      return path.join(appDataPath, 'ml4sg-care')
    }
  }
  return path.join(os.homedir(), '.ml4sg-care')
}

const userProfileDir = getAppDataDir()

export async function uploadImage(relativePath: string, file: Uint8Array) {
  try {
    if (file === undefined || file.length === 0) {
      return { ok: false, error: 'No file was uploaded.' }
    }

    // Check if file has .jpg extension
    const fileExtension = path.extname(relativePath).toLowerCase()
    if (fileExtension !== '.jpg') {
      return { ok: false, error: 'Only .jpg files are allowed.' }
    }

    const tempPath = path.join(userProfileDir, 'temp')
    fs.ensureDirSync(tempPath)

    const userIdFolder = '1'
    const dateFolder = new Date().toLocaleDateString('en-CA').replace(/-/g, '')
    const basePath = path.join(userProfileDir, 'data/image_uploaded', userIdFolder, dateFolder)

    // Reconstruct the folder structure using the relative path
    const targetPath = path.join(basePath, relativePath)

    // Normalize both basePath and targetPath to ensure correct comparisons
    const resolvedBase = path.resolve(basePath).toLowerCase()
    const resolvedTarget = path.resolve(targetPath).toLowerCase()

    // Check if targetPath is within basePath (prevent path traversal)
    if (!resolvedTarget.startsWith(resolvedBase)) {
      return { ok: false, error: 'Invalid relativePath. Path traversal detected.' }
    }

    // Ensure the directory exists before saving
    await fs.ensureDir(path.dirname(targetPath))

    await fs.writeFile(targetPath, file)
    return { ok: true }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { ok: false, error: 'uploadImage failed: ' + error.message }
    } else {
      return { ok: false, error: 'uploadImage failed: ' + error }
    }
  }
}

export async function browseImage(date: string, folderPath: string) {
  try {
    const userIdFolder = '1'
    let baseDir: string, targetDir: string

    if (!date) {
      baseDir = path.join(userProfileDir, 'data/image_uploaded', userIdFolder)
      targetDir = path.resolve(baseDir) // Resolve the full path
      fs.ensureDirSync(targetDir)
    } else {
      baseDir = path.join(userProfileDir, 'data/image_uploaded', userIdFolder, date)
      targetDir = path.resolve(baseDir, folderPath) // Resolve the full path
      fs.ensureDirSync(targetDir)
    }

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return { ok: false, error: 'Invalid folder path.' }
    }

    // Check if the directory exists before reading it
    if (!(await fs.pathExists(targetDir))) {
      return { ok: false, error: 'Directory not found.' }
    }

    const stat = fs.statSync(targetDir)
    if (stat.isFile()) {
      return { ok: false, error: 'Path is a file, not a directory.' }
    }

    const files = await fs.readdir(targetDir)
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(targetDir, file)
        const stat = await fs.stat(filePath)
        return {
          name: file,
          isDirectory: stat.isDirectory(),
          path: path.join(folderPath, file)
        }
      })
    )

    return { ok: true, status: 200, files: fileDetails }
  } catch (error: unknown) {
    return { ok: false, error: 'browseImage failed: ' + error }
  }
}

export async function getImagePaths(currentFolder: string) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_uploaded', userIdFolder)
    const targetDir = path.resolve(baseDir, currentFolder) // Resolve the full path

    fs.ensureDirSync(targetDir)

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return { ok: false, error: 'Invalid folder path.' }
    }

    // Check if the directory exists before reading it
    if (!(await fs.pathExists(targetDir))) {
      return { ok: false, error: 'Directory not found.' }
    }

    const stat = fs.statSync(targetDir)
    if (stat.isFile()) {
      return { ok: false, error: 'Path is a file, not a directory.' }
    }

    const filePaths = await getFilePaths(targetDir, baseDir)
    return { ok: true, selectAllPaths: filePaths }
  } catch (error: unknown) {
    return { ok: false, error: 'getImagePaths failed: ' + error }
  }
}

// Function to get all file paths
async function getFilePaths(dir: string, baseDir: string): Promise<string[]> {
  let results: string[] = []
  const list = await fs.readdir(dir)

  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = await fs.stat(filePath)

    if (stat && stat.isDirectory()) {
      const subResults = await getFilePaths(filePath, baseDir)
      results = results.concat(subResults)
    } else {
      const relativePath = path.relative(baseDir, filePath)
      results.push(relativePath)
    }
  }

  return results
}

export async function viewImage(date: string, imagePath: string) {
  try {
    return viewImageInPath('data/image_uploaded', date, imagePath)
  } catch (error: unknown) {
    return { ok: false, error: 'viewImage failed: ' + error }
  }
}

async function viewImageInPath(dir: string, date: string, imagePath: string) {
  let baseDir: string, targetDir: string

  if (!date || !imagePath) {
    return { ok: false, error: 'Missing date or imagePath parameters.' }
  } else {
    const userIdFolder = '1'
    baseDir = path.join(userProfileDir, dir, userIdFolder, date)
    targetDir = path.resolve(baseDir, imagePath) // Resolve the full path
  }

  // Ensure the resolved path is still within the baseDir
  if (!targetDir.startsWith(baseDir)) {
    return { ok: false, error: 'Invalid folder path.' }
  }

  // Check if the directory exists before reading it
  if (!(await fs.pathExists(targetDir))) {
    return { ok: false, error: 'Directory not found.' }
  }

  const stat = fs.statSync(targetDir)
  if (stat.isDirectory()) {
    return { ok: false, error: 'Path is a directory, not an image file.' }
  }

  const mimeType = lookup(targetDir)
  if (!mimeType || !mimeType.startsWith('image/')) {
    return { ok: false, error: 'The requested file is not an image.' }
  }

  // Ensure the file exists before sending it
  if (!fs.existsSync(targetDir)) {
    return { ok: false, error: 'Image not found.' }
  }

  const data = await fs.readFile(targetDir)
  return { ok: true, data: data }
}

export async function viewDetectImage(date: string, imagePath: string) {
  try {
    return viewImageInPath('data/image_marked', date, imagePath)
  } catch (error) {
    return { ok: false, error: 'viewDetectImage failed: ' + error }
  }
}

async function saveZip(baseDir: string, selectedPaths: string[], filename: string) {
  // Check if selectedPaths is an array and contains at least one file path
  if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) {
    return { ok: false, error: 'No image paths provided.' }
  }

  // Ensure the files exist before archiving.
  if (!fs.existsSync(baseDir)) {
    return { ok: false, error: 'Base source dir not found.' }
  }

  const result = await dialog.showSaveDialog({
    title: 'Save archive as',
    filters: [{ name: 'Zip', extensions: ['zip'] }],
    defaultPath: filename
  })
  if (result.canceled) {
    return { ok: true }
  }

  const output = fs.createWriteStream(result.filePath, { flush: true })

  const archive = archiver('zip', {
    zlib: { level: 0 } // Sets the compression level
  })

  // Pipe archive data to the response
  archive.pipe(output)

  // Append files to the archive while maintaining the folder structure
  for (const filePath of selectedPaths) {
    const fullPath = path.resolve(baseDir, filePath) // Resolve the full path
    try {
      // Check if file exists using fs-extra
      await fs.access(fullPath)
      archive.file(fullPath, { name: filePath }) // Maintain folder structure in the archive
    } catch (err) {
      console.warn(`File not found: ${fullPath}`) // Log missing files
    }
  }

  // Finalize the archive (i.e., finish the zipping process)
  const endPromise = new Promise<void>((resolve, _) => {
    output.on('finish', resolve)
  })
  const closePromise = new Promise<void>((resolve, _) => {
    output.on('close', resolve)
  })

  await Promise.all([archive.finalize(), endPromise, closePromise])

  return { ok: true }
}

// Schema for the REID JSON file.
//
// Example:
//   {
//     "ID-0": ["filename1.jpg", "filename2.jpg", ...],
//     "ID-1": ["filename3.jpg"...]
//   }
interface ReidJSON {
  [key: string]: string[]
}

export async function downloadReidImages(date: string, time: string) {
  try {
    // Note: This sorts the images into folder by group ID. So we can't just
    // use saveZip here.
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_reid_output', userIdFolder)
    const baseImgDir = path.join(userProfileDir, 'data/image_marked', userIdFolder)
    let targetDir: string

    const timeJson = time + '.json'
    let relDir = path.join(date, timeJson)
    targetDir = path.resolve(baseDir, relDir)

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return { ok: false, error: 'Invalid folder path.' }
    }

    // Check if the directory exists before reading it
    if (!(await fs.pathExists(targetDir))) {
      return { ok: false, error: 'Directory not found.' }
    }

    // Ensure the base directory exists
    fs.ensureDirSync(baseDir)

    const result = await dialog.showSaveDialog({
      title: 'Save archive as',
      filters: [{ name: 'Zip', extensions: ['zip'] }],
      defaultPath: `reid_images_${timestamp()}.zip`
    })
    if (result.canceled) {
      return { ok: true }
    }
    const output = fs.createWriteStream(result.filePath)

    const archive = archiver('zip', {
      zlib: { level: 0 } // Sets the compression level
    })

    // Pipe archive data to the response
    archive.pipe(output)

    // Read and parse the JSON file
    const fileStructure: ReidJSON = JSON.parse(fs.readFileSync(targetDir, 'utf-8'))

    // Iterate through the folder (key) and files (value) in the JSON structure
    for (const [folder, files] of Object.entries(fileStructure)) {
      for (const filePath of files) {
        const fullPath = path.resolve(baseImgDir, filePath) // Resolve the full path
        try {
          // Check if file exists using fs-extra
          await fs.access(fullPath)
          const fileName = path.basename(filePath) // Extract file name
          archive.file(fullPath, { name: path.join(folder, fileName) }) // Add file under the respective folder in the archive
        } catch (err) {
          console.warn(`File not found: ${fullPath}`) // Log missing files
        }
      }
    }

    // Finalize the archive (i.e., finish the zipping process)
    await archive.finalize()
    await new Promise((resolve, _) => {
      output.close(resolve)
    })

    return { ok: true }
  } catch (error) {
    console.log(error)
    return { ok: false, error: 'downloadReidImages: ' + error }
  }
}

export async function downloadSelectedGalleryImages(selectedPaths: string[]) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_uploaded', userIdFolder)
    const filename = `gallery_images_${timestamp()}.zip`
    return saveZip(baseDir, selectedPaths, filename)
  } catch (error: unknown) {
    return { ok: false, error: 'downloadSelectedGalleryImages failed: ' + error }
  }
}

let subProcess: ChildProcess | null = null

function terminateSubprocess() {
  // Terminate any running AI process.
  if (subProcess === null) {
    return
  }
  subProcess.kill()
  subProcess = null
}

function conda(): boolean {
  try {
    const ps = spawnSync('conda info')
    return ps.status !== undefined && ps.status == 0
  } catch (e) {
    return false
  }
}

function spawnPythonSubprocess(args: string[]) {
  let ps: ChildProcess | null = null
  let python = ''

  console.log(`process.resourcesPath=${process.resourcesPath}`)
  if (process.env.PYTHON_SCRIPT_PATH) {
    if (process.env.VIRTUAL_ENV) {
      // Standard Python virtual env.
      if (os.platform() == 'win32') {
        python = path.join(process.env.VIRTUAL_ENV, 'Scripts', 'python')
      } else {
        python = path.join(process.env.VIRTUAL_ENV, 'bin', 'python')
      }
      args = [process.env.PYTHON_SCRIPT_PATH, ...args]
      console.log(`Spawning Python subprocess using venv.`)
    } else if (conda()) {
      const scriptPath = process.env.PYTHON_SCRIPT_PATH
      const condaEnv = process.env.DEVICE == 'GPU' ? 'CARE-GPU' : 'CARE'
      python = os.platform() == 'win32' ? 'python' : 'python3'
      args = ['run', '--no-capture-output', '-n', condaEnv, python, scriptPath].concat(args)
      console.log(`Spawning Conda Python subprocess.`)
    }
  } else {
    // Want: C:\Users\chris\AppData\Local\Programs\care-electron\resources\app.asar.unpacked\resources\care-detect-reid
    // GOT: C:\Users\chris\AppData\Local\Programs\resources\care-detect-reid
    console.log('Running Pyinstaller Python')
    if (app.isPackaged) {
      const ext = os.platform() == 'win32' ? '.exe' : ''
      python = path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'resources',
        'care-detect-reid',
        `care-detect-reid${ext}`
      )
    } else {
      python = path.join(__dirname, `../../resources/care-detect-reid/care-detect-reid`)
    }
  }
  console.log(`Spawn: ${python} ${args.join(' ')}`)
  try {
    ps = spawn(python, args)
  } catch (e) {
    console.log(e)
    throw e
  }
  return ps
}

export async function detect(selectedPaths: string[], stream: (txt: string) => void) {
  const userIdFolder = '1'
  const tempPath = path.join(userProfileDir, 'temp/image_detection_pending', userIdFolder)
  try {
    terminateSubprocess()
    await fs.remove(tempPath)

    if (!selectedPaths || !Array.isArray(selectedPaths) || selectedPaths.length === 0) {
      return { ok: false, error: 'No images selected.' }
    }

    // Copy selected images to a temp folder for detection.
    for (const imagePath of selectedPaths) {
      const baseDir = path.join(userProfileDir, 'data/image_uploaded', userIdFolder)
      const srcPath = path.resolve(baseDir, imagePath) // Resolve the full path

      // Ensure the resolved path is still within the baseDir
      if (!srcPath.startsWith(baseDir)) {
        await fs.remove(tempPath)
        return { ok: false, error: 'Invalid folder path ' + srcPath }
      }

      const destPath = path.join(
        userProfileDir,
        'temp/image_detection_pending',
        userIdFolder,
        imagePath
      )

      // Check if the source image exists
      if (await fs.pathExists(srcPath)) {
        // Ensure the destination directory exists
        await fs.ensureDir(path.dirname(destPath))

        // Copy the image
        await fs.copy(srcPath, destPath)
      } else {
        console.warn(`runDetection: File not found: ${imagePath}`)
      }
    }

    let args = [
      'detection',
      path.join(userProfileDir, 'temp/image_detection_pending', userIdFolder),
      path.join(userProfileDir, 'data/image_marked', userIdFolder),
      path.join(userProfileDir, 'data/image_cropped_json', userIdFolder),
      path.join(userProfileDir, 'logs')
    ]
    let ps = spawnPythonSubprocess(args)
    // Note: We track the process on a global, but only reference it in a local var, as another
    // ipc/event handler could clear the global var.
    subProcess = ps

    if (ps && ps.stdout) {
      ps.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`)
        stream(data)
      })
    }

    return await new Promise((resolve, reject) => {
      ps.on('close', (code) => {
        console.log(`child process exited with code ${code}`)
        fs.remove(tempPath)
        if (code != 0) {
          reject({ ok: false, error: 'ERROR: Detection AI model error, please contact support.' })
        }
        subProcess = null
        resolve({ ok: true })
      })
    })
  } catch (error) {
    await fs.remove(tempPath)
    return { ok: false, error: 'detect failed: ' + error }
  }
}

export async function browseDetectImage(
  date: string,
  folderPath: string,
  filterLabel: string,
  confLow: number,
  confHigh: number
) {
  try {
    const userIdFolder = '1'
    let baseDir: string, targetDir: string

    if (!date) {
      baseDir = path.join(userProfileDir, 'data/image_marked', userIdFolder)
      targetDir = path.resolve(baseDir) // Resolve the full path
      fs.ensureDirSync(targetDir)
    } else {
      baseDir = path.join(userProfileDir, 'data/image_marked', userIdFolder, date)
      targetDir = path.resolve(baseDir, folderPath) // Resolve the full path
      fs.ensureDirSync(targetDir)
    }

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return { ok: false, error: 'Invalid folder path.' }
    }

    // Check if the directory exists before reading it
    if (!(await fs.pathExists(targetDir))) {
      return { ok: false, error: 'Directory not found.' }
    }

    const stat = fs.statSync(targetDir)
    if (stat.isFile()) {
      return { ok: false, error: 'Path is a file, not a directory.' }
    }

    const files = await fs.readdir(targetDir)
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(targetDir, file)
        const stat = await fs.stat(filePath)

        // Step 1: Check if it's a directory
        if (stat.isDirectory()) {
          return { name: file, isDirectory: true, path: path.join(folderPath, file) }
        }

        // Step 2: If it's not a directory, construct the corresponding JSON path
        // Assuming filePath points to the image file
        const relativeFilePath = path.relative(
          path.join(userProfileDir, 'data/image_marked'),
          filePath
        )

        // Extract the file name without the extension
        const fileNameWithoutExt = path.basename(relativeFilePath, path.extname(relativeFilePath))

        // Construct the corresponding JSON file path by replacing the base folder and appending `.json`
        const jsonFilePath = path.join(
          userProfileDir,
          'data/image_cropped_json',
          path.dirname(relativeFilePath), // Keeps the directory structure intact
          `${fileNameWithoutExt}.json`
        )

        // Step 3: Extract label and confidence from the corresponding JSON file
        const jsonData = await extractLabelAndConfidence(jsonFilePath)
        if (!jsonData) return null // Skip if the JSON cannot be read
        const { label, confidence } = jsonData

        // Step 4: Filtering logic based on the query parameters
        const isLabelNoDetection = filterLabel === 'No Detection' // Check if filterLabel is the string "NoDetection"
        const isLabelMatch = isLabelNoDetection
          ? label === null
          : !filterLabel || label === filterLabel

        // Apply confidence filtering only if filterLabel is not "null"
        const isConfidenceMatch =
          !isLabelNoDetection && confidence >= confLow && confidence <= confHigh

        if (isLabelMatch && (isLabelNoDetection || isConfidenceMatch)) {
          return { name: file, isDirectory: false, path: path.join(folderPath, file) }
        }

        return null // Skip if the file doesn't match the filter
      })
    )

    // Filter out null values (files that didn't pass the filter)
    const filteredFiles = fileDetails.filter((file) => file !== null)
    return { ok: true, files: filteredFiles }
  } catch (error) {
    return { ok: false, error: 'browseDetectImages failed: ' + error }
  }
}

async function extractLabelAndConfidence(filePath) {
  try {
    // Use fs-extra to read and parse JSON directly
    const jsonData = await fs.readJson(filePath)

    // Extract the label and confidence from the first box
    const label = jsonData.boxes[0].label
    const confidence = jsonData.boxes[0].confidence

    return { label, confidence }
  } catch (error) {
    console.error('Error reading or parsing the file:', error)
    return null // If JSON cannot be read or parsed, return null to skip this file
  }
}

// Function to get all file paths
async function getDetectFilePaths(
  dir: string,
  baseDir: string,
  filterLabel: string,
  confLow: number,
  confHigh: number
) {
  let results: string[] = []
  const list = await fs.readdir(dir)

  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = await fs.stat(filePath)

    if (stat && stat.isDirectory()) {
      const subResults = await getDetectFilePaths(filePath, baseDir, filterLabel, confLow, confHigh)
      results = results.concat(subResults)
    } else {
      const relativeFilePath = path.relative(
        path.join(userProfileDir, 'data/image_marked'),
        filePath
      )

      // Extract the file name without the extension
      const fileNameWithoutExt = path.basename(relativeFilePath, path.extname(relativeFilePath))

      // Construct the corresponding JSON file path by replacing the base folder and appending `.json`
      const jsonFilePath = path.join(
        userProfileDir,
        'data/image_cropped_json',
        path.dirname(relativeFilePath), // Keeps the directory structure intact
        `${fileNameWithoutExt}.json`
      )

      // Step 3: Extract label and confidence from the corresponding JSON file
      const jsonData = await extractLabelAndConfidence(jsonFilePath)
      if (jsonData) {
        const { label, confidence } = jsonData

        // Step 4: Filtering logic based on the query parameters
        const isLabelNoDetection = filterLabel === 'No Detection' // Check if filterLabel is the string "NoDetection"
        const isLabelMatch = isLabelNoDetection
          ? label === null
          : !filterLabel || label === filterLabel

        // Apply confidence filtering only if filterLabel is not "null"
        const isConfidenceMatch =
          !isLabelNoDetection && confidence >= confLow && confidence <= confHigh

        if (isLabelMatch && (isLabelNoDetection || isConfidenceMatch)) {
          const relativePath = path.relative(baseDir, filePath)
          results.push(relativePath)
        }
      }
    }
  }

  return results
}

export async function getDetectImagePaths(
  dirPath: string,
  filterLabel: string,
  confLow: number,
  confHigh: number
) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_marked', userIdFolder)
    const targetDir = path.resolve(baseDir, dirPath) // Resolve the full path

    fs.ensureDirSync(targetDir)

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return { ok: false, error: 'Invalid folder path.' }
    }

    // Check if the directory exists before reading it
    if (!(await fs.pathExists(targetDir))) {
      return { ok: false, error: 'Directory not found.' }
    }

    const stat = fs.statSync(targetDir)
    if (stat.isFile()) {
      return { ok: false, error: 'Path is a file, not a directory.' }
    }

    const filePaths = await getDetectFilePaths(targetDir, baseDir, filterLabel, confLow, confHigh)

    return { ok: true, selectAllPaths: filePaths }
  } catch (error) {
    console.log(error)
    return { ok: false, error: 'getDetectImagePaths failed: ' + error }
  }
}

export async function downloadDetectImages(filterLabel: string) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_marked', userIdFolder)
    fs.ensureDirSync(baseDir)
    const filePaths = await getDetectFilePaths(baseDir, baseDir, filterLabel, 0, 1)
    const filename = `detection_${filterLabel}_images_${timestamp()}.zip`
    return saveZip(baseDir, filePaths, filename)
  } catch (error) {
    console.log(error)
    return { ok: false, error: 'downloadDetectImages failed: ' + error }
  }
}

function timestamp(): string {
  // Generate timestamp-based zip filename using current timezone in YYYYMMDD_HHMMSS format
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0') // Months are 0-based
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

export async function downloadSelectedDetectImages(selectPaths: string[]) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_marked', userIdFolder)
    const filename = `detection_images_${timestamp()}.zip`
    return saveZip(baseDir, selectPaths, filename)
  } catch (error) {
    console.log(error)
    return { ok: false, error: 'downloadSelectedDetectImages failed: ' + error }
  }
}

export async function runReid(selectedPaths: string[], stream: (txt: string) => void) {
  const userIdFolder = '1'
  const tempImagePath = path.join(userProfileDir, 'temp/image_reid_pending', userIdFolder)
  const tempJsonPath = path.join(userProfileDir, 'temp/image_cropped_reid_pending', userIdFolder)
  try {
    terminateSubprocess()
    await fs.remove(tempImagePath)
    await fs.remove(tempJsonPath)

    if (!selectedPaths || !Array.isArray(selectedPaths) || selectedPaths.length === 0) {
      return { ok: false, error: 'No images selected or invalid format.' }
    }

    // Copy selected image to a temp folder for ReID
    for (const imagePath of selectedPaths) {
      const baseDir = path.join(userProfileDir, 'data/image_uploaded', userIdFolder)
      const srcPath = path.resolve(baseDir, imagePath) // Resolve the full path

      // Ensure the resolved path is still within the baseDir
      if (!srcPath.startsWith(baseDir)) {
        await fs.remove(tempImagePath)
        await fs.remove(tempJsonPath)
        return { ok: false, error: 'Invalid folder path.' }
      }

      const destPath = path.join(userProfileDir, 'temp/image_reid_pending', userIdFolder, imagePath)

      // Check if the source image exists
      if (await fs.pathExists(srcPath)) {
        // Ensure the destination directory exists
        await fs.ensureDir(path.dirname(destPath))

        // Copy the image
        await fs.copy(srcPath, destPath)
      } else {
        console.warn(`runReid: File not found: ${imagePath}`)
      }
    }

    let args = [
      'reid',
      path.join(userProfileDir, 'temp/image_reid_pending', userIdFolder),
      path.join(userProfileDir, 'data/image_cropped_json', userIdFolder),
      path.join(userProfileDir, 'temp/image_cropped_reid_pending', userIdFolder),
      path.join(userProfileDir, 'data/image_reid_output', userIdFolder),
      path.join(userProfileDir, 'logs')
    ]
    let ps = spawnPythonSubprocess(args)
    if (!ps) {
      return { ok: false, error: 'Failed to start process' }
    }

    // Note: We track the process on a global, but only reference it in a local var, as another
    // event handler could clear the global var.
    subProcess = ps

    if (ps.stdout) {
      ps.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`)
        stream(data)
      })
    }
    if (ps.stderr) {
      ps.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
        stream(data)
      })
    }

    return await new Promise((resolve, reject) => {
      ps.on('close', (code) => {
        console.log(`child process exited with code ${code}`)
        fs.remove(tempImagePath)
        if (code != 0) {
          reject({ ok: false, error: 'ERROR: Detection AI model error, please contact support.' })
        }
        subProcess = null
        resolve({ ok: true })
      })
    })
  } catch (error) {
    return { ok: false, error: 'runReid failed: ' + error }
  } finally {
    await fs.remove(tempImagePath)
  }
}

// Function to read the JSON file and extract keys
const extractKeysFromJson = async (filePath) => {
  try {
    // Read the JSON file
    const data = fs.readFileSync(filePath, 'utf8')
    const jsonObject = JSON.parse(data)

    // Extract keys into a list
    return Object.keys(jsonObject)
  } catch (error) {
    console.error('Error reading or parsing JSON file:', error)
    return []
  }
}

// Function to read the JSON file and extract values for a specific key
const extractValuesForKey = async (filePath, key) => {
  try {
    // Read the JSON file
    const data = fs.readFileSync(filePath, 'utf8')
    const jsonObject = JSON.parse(data)

    // Extract values for the specified key
    const values = jsonObject[key]

    // Check if values exist and return them, or return an empty array
    return Array.isArray(values) ? values : []
  } catch (error) {
    console.error('Error reading or parsing JSON file:', error)
    return []
  }
}

export async function browseReidImage(date: string, time: string, group_id: string) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_reid_output', userIdFolder)
    let targetDir: string, browseMode: string

    if (!date) {
      browseMode = 'root'
      targetDir = path.resolve(baseDir) // Resolve the full path
      fs.ensureDirSync(targetDir)
    } else if (!time) {
      browseMode = 'date'
      targetDir = path.resolve(baseDir, date) // Resolve the full path
    } else if (!group_id) {
      browseMode = 'time'
      const timeJson = time + '.json'
      let relDir = path.join(date, timeJson)
      targetDir = path.resolve(baseDir, relDir) // Resolve the full path
    } else {
      browseMode = 'group_id'
      const timeJson = time + '.json'
      let relDir = path.join(date, timeJson)
      targetDir = path.resolve(baseDir, relDir) // Resolve the full path
    }

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return { ok: false, error: 'Invalid folder path.' }
    }

    // Check if the directory exists before reading it
    if (!(await fs.pathExists(targetDir))) {
      // console.log("browseMode: " + browseMode);
      return { ok: false, error: 'Directory not found.' }
    }

    if (browseMode === 'root') {
      const stat = fs.statSync(targetDir)
      if (stat.isFile()) {
        return { ok: false, error: 'Path is a file, not a directory.' }
      }

      const files = await fs.readdir(targetDir)
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(targetDir, file)
          const stat = await fs.stat(filePath)
          return {
            name: file,
            isDirectory: stat.isDirectory(),
            path: path.join(file),
            date: file,
            time: null,
            group_id: null,
            realDate: null,
            realPath: null
          }
        })
      )

      return { ok: true, files: fileDetails }
    } else if (browseMode === 'date') {
      const stat = fs.statSync(targetDir)
      if (stat.isFile()) {
        return { ok: false, error: 'Path is a file, not a directory.' }
      }

      const files = await fs.readdir(targetDir)
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(targetDir, file)
          const basename = path.basename(filePath)
          const fileName = path.parse(basename).name // Remove the extension
          return {
            name: fileName,
            isDirectory: true,
            path: path.join(date, fileName),
            date: date,
            time: fileName,
            group_id: null,
            realDate: null,
            realPath: null
          }
        })
      )

      return { ok: true, files: fileDetails }
    } else if (browseMode === 'time') {
      const ids = await extractKeysFromJson(targetDir)
      // console.log(ids);
      return {
        ok: true,
        files: ids.map((key) => ({
          name: key,
          isDirectory: true,
          path: path.join(date, time, key),
          date: date,
          time: time,
          group_id: key,
          realDate: null,
          realPath: null
        }))
      }
    } else if (browseMode === 'group_id') {
      // Extract values
      const imagePaths = await extractValuesForKey(targetDir, group_id)
      // Extract filenames from the paths
      // const imageNames = imagePaths.map(imagePath => path.basename(imagePath));
      return {
        ok: true,
        files: imagePaths.map((key) => ({
          name: path.basename(key),
          isDirectory: false,
          path: path.join(date, time, group_id, path.basename(key)),
          date: date,
          time: time,
          group_id: group_id,
          realDate: key.split(path.sep)[0],
          realPath: key.split(path.sep).slice(1).join(path.sep)
        }))
      }
    } else {
      return { ok: false, error: 'browseReidImage: Internal error related to browseMode.' }
    }
  } catch (error) {
    console.log(error)
    return { ok: false, error: 'browseReidImage: ' + error }
  }
}

export async function deleteReidResult(date: string, time: string) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_reid_output', userIdFolder)

    if (!date || !time) {
      return { ok: false, error: 'Missing one or more parameters: date, time.' }
    }

    const timeJson = time + '.json'
    const deteleDir = path.join(date, timeJson)
    const targetDir = path.resolve(baseDir, deteleDir)

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return { ok: false, error: 'Invalid path.' }
    }

    // Check if the target exists
    if (await fs.pathExists(targetDir)) {
      await fs.remove(targetDir) // Remove the file or directory

      // Check if the date folder is now empty
      const dateDir = path.join(targetDir, '..')
      const remainingFiles = await fs.readdir(dateDir)
      if (remainingFiles.length === 0) {
        await fs.remove(dateDir) // Remove the date folder if empty
      }

      return {
        ok: true,
        message: `ReID result (date = ${date}, time = ${time}) deleted successfully.`
      }
    } else {
      return { ok: false, error: `ReID result (date = ${date}, time = ${time}) not found.` }
    }
  } catch (error) {
    console.error(error)
    return { ok: false, error: 'deleteReidMessage: ' + error }
  }
}

export async function renameReidGroup(
  date: string,
  time: string,
  old_group_id: string,
  new_group_id: string
) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_reid_output', userIdFolder)
    let targetDir: string

    if (!date || !time || !old_group_id || !new_group_id) {
      return {
        ok: false,
        error: 'Missing one or more query parameters: date, time, old_group_id, new_group_id.'
      }
    }

    const timeJson = time + '.json'
    let relDir = path.join(date, timeJson)
    targetDir = path.resolve(baseDir, relDir) // Resolve the full path

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return { ok: false, error: 'Invalid folder path.' }
    }

    // Check if the directory exists before reading it
    if (!(await fs.pathExists(targetDir))) {
      return { ok: false, error: 'Directory not found.' }
    }

    // Read the JSON file
    const fileData = await fs.readJson(targetDir)

    // Check if old_group_id exists
    if (!fileData.hasOwnProperty(old_group_id)) {
      return { ok: false, error: `Key "${old_group_id}" not found.` }
    }

    // Check if new_group_id already exists
    if (fileData.hasOwnProperty(new_group_id)) {
      if (new_group_id === old_group_id) {
        return {
          ok: true,
          message: 'The new name is the same as the old name. The group name will not change. '
        }
      }
      return {
        ok: false,
        message: `Key "${new_group_id}" already exists. Chose a different name.`
      }
    }

    // Create a new object to maintain the original order of keys
    const newData = {}

    // Loop through the existing keys in fileData
    Object.keys(fileData).forEach((key) => {
      // If the key is the old_group_id, add it to newData with the new_group_id
      if (key === old_group_id) {
        newData[new_group_id] = fileData[old_group_id]
      } else {
        // Otherwise, just copy the existing key-value pair
        newData[key] = fileData[key]
      }
    })

    // Write the modified JSON back to the file
    await fs.writeJson(targetDir, newData, { spaces: 4 })

    return { ok: true, message: `Successfully renamed from ${old_group_id} to ${new_group_id}.` }
  } catch (error) {
    console.error(error)
    return { ok: false, error: 'renameReidGroup: ' + error }
  }
}

export function terminateAI() {
  terminateSubprocess()
}
