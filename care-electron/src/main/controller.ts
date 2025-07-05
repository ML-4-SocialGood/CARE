import fs from 'fs-extra'
import path from 'path'
import archiver from 'archiver'

const userProfileDir = '/Users/cpearce/src/CARE-untouched/backend/src/controllers'

export async function browseImage(date: string, folderPath: string) {
  try {
    const userIdFolder = '1'
    let baseDir: string, targetDir: string

    if (!date) {
      baseDir = path.join(userProfileDir, '../../data/image_uploaded', userIdFolder)
      targetDir = path.resolve(baseDir) // Resolve the full path
      fs.ensureDirSync(targetDir)
    } else {
      baseDir = path.join(userProfileDir, '../../data/image_uploaded', userIdFolder, date)
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
    if (error instanceof Error) {
      return { ok: false, error: error.message }
    } else {
      return { ok: false, error: 'browseImage failed: ' + error }
    }
  }
}

export async function getImagePaths(currentFolder: string) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, '../../data/image_uploaded', userIdFolder)
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
    if (error instanceof Error) {
      return { ok: false, error: error.message }
    } else {
      return { ok: false, error: 'browseImage failed: ' + error }
    }
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
    let baseDir: string, targetDir: string

    if (!date || !imagePath) {
      return { ok: false, error: 'Missing date or imagePath query parameters.' }
    } else {
      const userIdFolder = '1'
      baseDir = path.join(userProfileDir, '../../data/image_uploaded', userIdFolder, date)
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { ok: false, error: error.message }
    } else {
      return { ok: false, error: 'browseImage failed: ' + error }
    }
  }
}

export async function downloadSelectedGalleryImages(selectedPaths: string[]) {
  try {
    const userIdFolder = '1'
    const baseDir = path.join(userProfileDir, '../../data/image_uploaded', userIdFolder)

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

    const data = await fs.readFile(archivePath)
    return { ok: true, data: data }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { ok: false, error: error.message }
    } else {
      return { ok: false, error: 'browseImage failed: ' + error }
    }
  }
}
