import fs from 'fs-extra'
import path from 'path'
import archiver from 'archiver'
import { spawn, ChildProcess } from 'node:child_process'
import os from 'os'

const userProfileDir = '/Users/cpearce/src/CARE-untouched/backend'

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

  const mime = require('mime-types')
  const mimeType = mime.lookup(targetDir)
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

async function downloadZip(baseDir: string, selectedPaths: string[]) {
  // Check if selectedPaths is an array and contains at least one file path
  if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) {
    return { ok: false, error: 'No image paths provided.' }
  }

  // Ensure the base directory exists
  fs.ensureDirSync(baseDir)
  const archivePath = userProfileDir + '/images.zip'
  const output = fs.createWriteStream(archivePath)

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
  await archive.finalize()
  await new Promise((resolve, _) => {
    output.close(resolve)
  })

  const data = await fs.readFile(archivePath)
  return { ok: true, data: data }
}

export async function downloadSelectedGalleryImages(selectedPaths: string[]) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_uploaded', userIdFolder)
    return downloadZip(baseDir, selectedPaths)
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

function spawnPythonSubprocess(args: string[]) {
  let ps: ChildProcess | null = null
  if (process.env.PYINSTALLER_EXE !== undefined) {
    console.log(
      `Spawning pyinstaller subprocess: ${process.env.PYINSTALLER_EXE} args: ${args.join(' ')}`
    )
    try {
      ps = spawn(process.env.PYINSTALLER_EXE, args)
    } catch (e) {
      console.log(e)
      throw e
    }
  } else {
    const scriptPath = path.join(userProfileDir, 'ai_server/main.py')
    const condaEnv = process.env.DEVICE == 'GPU' ? 'CARE-GPU' : 'CARE'
    const python = os.platform() == 'win32' ? 'python' : 'python3'
    args = ['run', '--no-capture-output', '-n', condaEnv, python, scriptPath].concat(args)
    console.log(`Spawning conda subprocess. 'conda ${args.join(' ')}'`)
    try {
      ps = spawn('conda', args)
    } catch (e) {
      console.log(e)
      throw e
    }
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

    const device = process.env.DEVICE === 'GPU' ? 'gpu' : 'cpu'
    let args = [
      'detection-' + device,
      path.join(userProfileDir, 'temp/image_detection_pending', userIdFolder),
      path.join(userProfileDir, 'temp/image_marked', userIdFolder),
      path.join(userProfileDir, 'temp/image_cropped_json', userIdFolder)
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
    return downloadZip(baseDir, filePaths)
  } catch (error) {
    console.log(error)
    return { ok: false, error: 'downloadDetectImages failed: ' + error }
  }
}

export async function downloadSelectedDetectImages(selectPaths: string[]) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, 'data/image_marked', userIdFolder)
    return downloadZip(baseDir, selectPaths)
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

    const device = process.env.DEVICE === 'GPU' ? 'gpu' : 'cpu'
    let args = [
      'reid-' + device,
      path.join(userProfileDir, 'temp/image_reid_pending', userIdFolder),
      path.join(userProfileDir, 'temp/image_cropped_json', userIdFolder),
      path.join(userProfileDir, 'temp/image_cropped_reid_pending', userIdFolder),
      path.join(userProfileDir, 'temp/image_reid_output', userIdFolder)
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
