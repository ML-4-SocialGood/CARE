require('dotenv').config();
const { User, Image } = require('../models');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
// const unzipper = require('unzipper');
const mime = require('mime-types');
// const axios = require('axios');
// const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
const archiver = require('archiver');

// Multer setup for image upload
const upload = multer({ dest: 'temp' });

// Get current user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update current user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email) {
      const existingUserByEmail = await User.findOne({ where: { email } });
      if (existingUserByEmail) {
        if (existingUserByEmail.id !== req.user.id) {
          return res.status(400).json({ message: 'Email is already taken.' });
        }
      }
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await user.update({ email, password: hashedPassword});
      res.json({ message: 'User profile updated successfully.' });
    } else {
      await user.update({ email });
      res.json({ message: 'User profile updated successfully.' });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// // Get current user's all uploaded images
// exports.getAllImages = async (req, res) => {
//   try {
//     const images = await Image.findAll({ where: { userId: req.user.id } });
//     res.json(images);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get current user's uploaded image by image ID
// exports.getImageById = async (req, res) => {
//   try {
//     const { imageId } = req.params;
//     const image = await Image.findOne({ where: { id: imageId, userId: req.user.id } });

//     if (!image) {
//       return res.status(404).json({ error: 'Image not found.' });
//     }

//     res.json(image);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.browseImage = async (req, res) => {
  try {
    const { date, folderPath = '' } = req.query; // Query parameters: date and path
    const userIdFolder = req.user.id + "";
    let baseDir, targetDir;
    
    if (!date) {
      // const userIdFolder = req.user.id + "";
      baseDir = path.join(__dirname, '../../data/image_uploaded', userIdFolder);
      targetDir = path.resolve(baseDir); // Resolve the full path
      fs.ensureDirSync(targetDir);
    }
    else {
      // const userIdFolder = req.user.id + "";
      baseDir = path.join(__dirname, '../../data/image_uploaded', userIdFolder, date);
      targetDir = path.resolve(baseDir, folderPath); // Resolve the full path
      fs.ensureDirSync(targetDir);
    }

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Invalid folder path.' });
    }

    // Check if the directory exists before reading it
    if (!await fs.pathExists(targetDir)) {
      return res.status(404).json({ error: 'Directory not found.' });
    }

    const stat = fs.statSync(targetDir);
    if (stat.isFile()) {
      return res.status(400).json({ error: 'Path is a file, not a directory.' });
    }

    const files = await fs.readdir(targetDir);
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(targetDir, file);
        const stat = await fs.stat(filePath);
        return {
          name: file,
          isDirectory: stat.isDirectory(),
          path: path.join(folderPath, file),
        };
      })
    );

    res.json({ files: fileDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getImagePaths = async (req, res) => {
  try {
    const { path: dirPath = "" } = req.query;
    const userIdFolder = req.user.id + "";
    const baseDir = path.join(__dirname, '../../data/image_uploaded', userIdFolder);
    const targetDir = path.resolve(baseDir, dirPath); // Resolve the full path
    
    fs.ensureDirSync(targetDir);
  
    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Invalid folder path.' });
    }

    // Check if the directory exists before reading it
    if (!await fs.pathExists(targetDir)) {
      return res.status(404).json({ error: 'Directory not found.' });
    }

    const stat = fs.statSync(targetDir);
    if (stat.isFile()) {
      return res.status(400).json({ error: 'Path is a file, not a directory.' });
    }

    const filePaths = await getFilePaths(targetDir, baseDir);
    res.json({ selectAllPaths: filePaths });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

// Function to get all file paths
async function getFilePaths(dir, baseDir) {
  let results = [];
  const list = await fs.readdir(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat && stat.isDirectory()) {
        const subResults = await getFilePaths(filePath, baseDir);
        results = results.concat(subResults);
    } else {
      const relativePath = path.relative(baseDir, filePath);
      results.push(relativePath);
    }
  }

  return results;
}

exports.viewImage = async (req, res) => {
  try {
    const { date, imagePath = '' } = req.query; // Query parameters: date and folder
    let baseDir, targetDir;
    
    if (!date || !imagePath) {
      return res.status(400).json({ error: 'Missing date or imagePath query parameters.' });
    }
    else {
      const userIdFolder = req.user.id + "";
      baseDir = path.join(__dirname, '../../data/image_uploaded', userIdFolder, date);
      targetDir = path.resolve(baseDir, imagePath); // Resolve the full path
    }

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Invalid folder path.' });
    }

    // Check if the directory exists before reading it
    if (!await fs.pathExists(targetDir)) {
      return res.status(404).json({ error: 'Directory not found.' });
    }

    const stat = fs.statSync(targetDir);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Path is a directory, not an image file.' });
    }

    const mime = require('mime-types');
    const mimeType = mime.lookup(targetDir);
    if (!mimeType || !mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'The requested file is not an image.' });
    }

    // Ensure the file exists before sending it
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    res.sendFile(targetDir);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// // Upload folder with images, only accept zip, auto remove non-jpg files.
// exports.uploadImage = [
//   upload.single('folderZip'),
//   async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ error: 'No file was uploaded.' });
//       }

//       // Check if the file is a zip file
//       const mimeType = mime.lookup(req.file.originalname);
//       if (mimeType !== 'application/zip') {
//         await fs.remove(uploadPath); // Clean up the uploaded file
//         return res.status(400).json({ error: 'The uploaded file must be a zip file.' });
//       }

//       const uploadPath = req.file.path;
//       const dateFolder = new Date().toISOString().split('T')[0].replace(/-/g, '');
//       const userIdFolder = req.user.id + "";
//       const extractionPath = path.join(__dirname, '../../data/image_uploaded', userIdFolder, dateFolder);

//       // Unzip the file
//       await fs.createReadStream(uploadPath)
//         .pipe(unzipper.Extract({ path: extractionPath }))
//         .promise();
  
//       // Iterate through the extracted files
//       await cleanUpFiles(extractionPath);
  
//       // Remove the temporary zip file
//       await fs.remove(uploadPath);
  
//       res.status(201).json({ message: 'Folder upload successfully, non-jpg files will be ignored.' });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
// }];

exports.uploadImage = [
  upload.single('file'), // Handle single file uploads
  async (req, res) => {
    try {
      const { relativePath } = req.body;
      const file = req.file;

      const tempPath = path.join(__dirname, '../../temp');
      fs.ensureDirSync(tempPath);

      if (!file) {
        return res.status(400).json({ error: 'No file was uploaded.' });
      }

      // Check if file has .jpg extension
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (fileExtension !== '.jpg') {
        // Remove the uploaded file from temp directory
        await fs.remove(file.path);
        return res.status(400).json({ error: 'Only .jpg files are allowed.' });
      }

      // Check if MIME type is image/jpeg
      const mimeType = file.mimetype;
      if (mimeType !== 'image/jpeg') {
        // Remove the uploaded file from temp directory
        await fs.remove(file.path);
        return res.status(400).json({ error: 'Invalid MIME type. Only image/jpeg is allowed.' });
      }

      const userIdFolder = req.user.id.toString();
      const dateFolder = new Date().toLocaleDateString('en-CA').replace(/-/g, '');
      const basePath = path.join(__dirname, '../../data/image_uploaded', userIdFolder, dateFolder);

      // Reconstruct the folder structure using the relative path
      const targetPath = path.join(basePath, relativePath);

      // Normalize both basePath and targetPath to ensure correct comparisons
      const resolvedBase = path.resolve(basePath).toLowerCase();
      const resolvedTarget = path.resolve(targetPath).toLowerCase();
      // console.log("resolvedBase: " + resolvedBase);
      // console.log("resolvedTarget: " + resolvedTarget);

      // Check if targetPath is within basePath (prevent path traversal)
      if (!resolvedTarget.startsWith(resolvedBase)) {
        await fs.remove(file.path); // Remove the uploaded file from temp directory
        return res.status(400).json({ error: 'Invalid relativePath. Path traversal detected.' });
      }

      // Ensure the directory exists before saving
      await fs.ensureDir(path.dirname(targetPath));

      // Move the file from the temp folder to the target directory
      await fs.rename(file.path, targetPath);

      res.status(201).json({ message: 'File uploaded successfully.' });
    } catch (error) {
      console.error('Error while uploading file:', error);
      res.status(500).json({ error: error.message });
    }
  }
];


// // Function to recursively clean up non-`.jpg` files
// async function cleanUpFiles(dir) {
//   const files = await fs.readdir(dir);

//   for (const file of files) {
//     const filePath = path.join(dir, file);
//     const stat = await fs.stat(filePath);

//     if (stat.isDirectory()) {
//       // Recursively clean up subdirectories
//       await cleanUpFiles(filePath);
//     } else if (path.extname(file).toLowerCase() !== '.jpg' || mime.lookup(filePath) !== 'image/jpeg') {
//       // Remove non-`.jpg` files
//       await fs.remove(filePath);
//     }
//   }
// }

// // Delete current user's uploaded image/ folder
// exports.deleteImage = async (req, res) => {
//   try {
//     const { date, pathToDelete } = req.body; // Body parameters: date and pathToDelete
//     const userIdFolder = req.user.id + "";
//     const baseDir = path.join(__dirname, '../../data/image_uploaded', userIdFolder, date);

//     const targetDir = path.resolve(baseDir, pathToDelete); // Resolve the full path

//     // Ensure the resolved path is still within the baseDir
//     if (!targetDir.startsWith(baseDir)) {
//       return res.status(400).json({ error: 'Invalid folder path.' });
//     }

//     // Check if the target exists
//     if (await fs.pathExists(targetPath)) {
//       await fs.remove(targetPath); // Remove the file or directory

//       // Check if the date folder is now empty
//       const remainingFiles = await fs.readdir(baseDir);
//       if (remainingFiles.length === 0) {
//         await fs.remove(baseDir); // Remove the date folder if empty
//       }

//       res.json({ message: 'File or folder deleted successfully' });
//     } else {
//       res.status(404).json({ error: 'File or folder not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.runDetection = async (req, res) => {
  const userIdFolder = req.user.id + "";
  const tempPath = path.join(__dirname, '../../temp/image_detection_pending', userIdFolder);
  try {
    const AI_SERVER_PORT = process.env.AI_SERVER_PORT || 5000;
    const fetch = (await import('node-fetch')).default; // Dynamically import node-fetch

    // Terminate all running AI processes
    const terminateResponse = await fetch(`http://localhost:${AI_SERVER_PORT}/ai_api/terminate/${userIdFolder}`);
    if (!terminateResponse.ok) {
      return res.status(400).json({ error: 'Detection AI server error, please contact support.' });
    }
    await fs.remove(tempPath);

    const { selectedPaths } = req.body;
    if (!selectedPaths || !Array.isArray(selectedPaths) || selectedPaths.length === 0) {
      return res.status(400).json({ error: 'No images selected or invalid format.' });
    }

    // Copy selected image to a temp folder for detection
    for (const imagePath of selectedPaths) {
      const baseDir = path.join(__dirname, '../../data/image_uploaded', userIdFolder);
      const srcPath = path.resolve(baseDir, imagePath); // Resolve the full path
      // const srcPath = path.join(__dirname, '../../data/image_uploaded', userIdFolder, imagePath);

      // Ensure the resolved path is still within the baseDir
      if (!srcPath.startsWith(baseDir)) {
        await fs.remove(tempPath);
        return res.status(403).json({ error: 'Invalid folder path.' });
      }

      const destPath = path.join(__dirname, '../../temp/image_detection_pending', userIdFolder, imagePath);

      // Check if the source image exists
      if (await fs.pathExists(srcPath)) {
        // Ensure the destination directory exists
        await fs.ensureDir(path.dirname(destPath));

        // Copy the image
        await fs.copy(srcPath, destPath);
      } else {
        console.warn(`runDetection: File not found: ${imagePath}`);
      }

    }

    // TODO: Implement detection model integration.
    // Make a GET request to the Flask server for streaming output
    // const AI_SERVER_PORT = process.env.AI_SERVER_PORT || 5000;
    // const response = await axios({
    //   url: `http://localhost:${AI_SERVER_PORT}/ai_api/detection/${userIdFolder}`,
    //   method: 'GET',
    //   responseType: 'stream'
    // });
    
    // Dynamically import node-fetch
    // const fetch = (await import('node-fetch')).default;
    const response = await fetch(`http://localhost:${AI_SERVER_PORT}/ai_api/detection/${userIdFolder}`);

    // Check if the response is okay (status code 200)
    if (!response.ok) {
      await fs.remove(tempPath);
      return res.status(400).json({ error: 'Detection AI server error, please contact support.' });
    }

    // Set up the correct content type for the client to receive streaming data
    res.setHeader('Content-Type', 'text/html');

    // Forward data from Flask server to the client
    response.body.on('data', (chunk) => {
      res.write(chunk);
    });

    // End the response when the Flask server finishes streaming
    response.body.on('end', async () => {
      await fs.remove(tempPath);
      res.end();
    });

    // Handle any errors that occur during streaming
    response.body.on('error', async (err) => {
      console.error('Streaming error:', err);
      await fs.remove(tempPath);
      return res.status(500).end('ERROR: Detection AI model error, please contact support.');
    });

    // res.status(201).json({ message: 'TEST: All valid images copied.' });
  } catch (error) {
    await fs.remove(tempPath);
    res.status(500).json({ error: error.message });
  }
};

exports.browseDetectImage = async (req, res) => {
  try {
    const { date, folderPath = '', label: filterLabel, confLow = 0, confHigh = 1 } = req.query; // Query parameters: date, path, label, confidence low/ high
    const userIdFolder = req.user.id + "";
    let baseDir, targetDir;
    
    if (!date) {
      // const userIdFolder = req.user.id + "";
      baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder);
      targetDir = path.resolve(baseDir); // Resolve the full path
      fs.ensureDirSync(targetDir);
    }
    else {
      // const userIdFolder = req.user.id + "";
      baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder, date);
      targetDir = path.resolve(baseDir, folderPath); // Resolve the full path
      fs.ensureDirSync(targetDir);
    }

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Invalid folder path.' });
    }

    // Check if the directory exists before reading it
    if (!await fs.pathExists(targetDir)) {
      return res.status(404).json({ error: 'Directory not found.' });
    }

    const stat = fs.statSync(targetDir);
    if (stat.isFile()) {
      return res.status(400).json({ error: 'Path is a file, not a directory.' });
    }

    const files = await fs.readdir(targetDir);
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(targetDir, file);
        const stat = await fs.stat(filePath);

        // Step 1: Check if it's a directory
        if (stat.isDirectory()) {
          return { name: file, isDirectory: true, path: path.join(folderPath, file) };
        }

        // Step 2: If it's not a directory, construct the corresponding JSON path
        // Assuming filePath points to the image file
        const relativeFilePath = path.relative(
          path.join(__dirname, '../../data/image_marked'),
          filePath
        );

        // Extract the file name without the extension
        const fileNameWithoutExt = path.basename(relativeFilePath, path.extname(relativeFilePath));

        // Construct the corresponding JSON file path by replacing the base folder and appending `.json`
        const jsonFilePath = path.join(
          __dirname,
          '../../data/image_cropped_json',
          path.dirname(relativeFilePath),  // Keeps the directory structure intact
          `${fileNameWithoutExt}.json`
        );

        // Step 3: Extract label and confidence from the corresponding JSON file
        const jsonData = await extractLabelAndConfidence(jsonFilePath);
        if (!jsonData) return null; // Skip if the JSON cannot be read
        const { label, confidence } = jsonData;
        
        // // Step 4: Filter based on the query parameters (label and confidence)
        // if (
        //   (!filterLabel || label === filterLabel) &&
        //   confidence >= parseFloat(confLow) &&
        //   confidence <= parseFloat(confHigh)
        // ) {
        //   return { name: file, isDirectory: false, path: path.join(folderPath, file) };
        // }

        // Step 4: Filtering logic based on the query parameters
        const isLabelNoDetection = filterLabel === "NoDetection"; // Check if filterLabel is the string "NoDetection"
        const isLabelMatch = isLabelNoDetection ? label === null : (!filterLabel || label === filterLabel);
        
        // Apply confidence filtering only if filterLabel is not "null"
        const isConfidenceMatch = !isLabelNoDetection && confidence >= parseFloat(confLow) && confidence <= parseFloat(confHigh);

        if (isLabelMatch && (isLabelNoDetection || isConfidenceMatch)) {
          return { name: file, isDirectory: false, path: path.join(folderPath, file) };
        }
        
        return null; // Skip if the file doesn't match the filter
        
      })
    );

    // Filter out null values (files that didn't pass the filter)
    const filteredFiles = fileDetails.filter(file => file !== null);
    res.json({ files: filteredFiles });

    // res.json({ files: fileDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function extractLabelAndConfidence(filePath) {
  try {
      // Use fs-extra to read and parse JSON directly
      // const jsonPath = path.join(__dirname, filePath)
      const jsonData = await fs.readJson(filePath);
      
      // Extract the label and confidence from the first box
      const label = jsonData.boxes[0].label;
      const confidence = jsonData.boxes[0].confidence;
      
      return { label, confidence };
  } catch (error) {
      console.error('Error reading or parsing the file:', error);
      return null; // If JSON cannot be read or parsed, return null to skip this file
  }
}

exports.getDetectImagePaths = async (req, res) => {
  try {
    const { path: dirPath = "", label: filterLabel, confLow = 0, confHigh = 1 } = req.query;
    const userIdFolder = req.user.id + "";
    const baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder);
    const targetDir = path.resolve(baseDir, dirPath); // Resolve the full path
    
    fs.ensureDirSync(targetDir);
  
    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Invalid folder path.' });
    }

    // Check if the directory exists before reading it
    if (!await fs.pathExists(targetDir)) {
      return res.status(404).json({ error: 'Directory not found.' });
    }

    const stat = fs.statSync(targetDir);
    if (stat.isFile()) {
      return res.status(400).json({ error: 'Path is a file, not a directory.' });
    }

    const filePaths = await getDetectFilePaths(targetDir, baseDir, filterLabel, confLow, confHigh);

        
    res.json({ selectAllPaths: filePaths });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

exports.downloadDetectImages = async (req, res) => {
  try {
    const { label: filterLabel } = req.query;
    const userIdFolder = req.user.id + "";
    const baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder);

    fs.ensureDirSync(baseDir);
    const filePaths = await getDetectFilePaths(baseDir, baseDir, filterLabel, 0, 1);

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return res.status(400).send('No image matches the filter.');
    }
    
    // Set the response headers for the zip file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=files.zip');

    const archive = archiver('zip', {
      zlib: { level: 0 } // Sets the compression level
    });

    // Pipe archive data to the response
    archive.pipe(res);

    // Append files to the archive while maintaining the folder structure
    for (const filePath of filePaths) {
      const fullPath = path.resolve(baseDir, filePath); // Resolve the full path
      try {
        // Check if file exists using fs-extra
        await fs.access(fullPath);
        archive.file(fullPath, { name: filePath }); // Maintain folder structure in the archive
      } catch (err) {
        console.warn(`File not found: ${fullPath}`); // Log missing files
      }
    }

    // Finalize the archive (i.e., finish the zipping process)
    archive.finalize();
      // .catch(err => {
      //   console.error(err);
      //     res.status(500).send('Error creating zip file.');
      // });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

exports.downloadSelectedDetectImages = async (req, res) => {
  try {
    const userIdFolder = req.user.id + "";
    const baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder);
    const { selectedPaths } = req.body;

    // Check if selectedPaths is an array and contains at least one file path
    if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) {
      return res.status(400).send('No image paths provided.');
    }

    // Ensure the base directory exists
    fs.ensureDirSync(baseDir);

    // Set the response headers for the zip file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=files.zip');

    const archive = archiver('zip', {
      zlib: { level: 0 } // Sets the compression level
    });

    // Pipe archive data to the response
    archive.pipe(res);

    // Append files to the archive while maintaining the folder structure
    for (const filePath of selectedPaths) {
      const fullPath = path.resolve(baseDir, filePath); // Resolve the full path
      try {
        // Check if file exists using fs-extra
        await fs.access(fullPath);
        archive.file(fullPath, { name: filePath }); // Maintain folder structure in the archive
      } catch (err) {
        console.warn(`File not found: ${fullPath}`); // Log missing files
      }
    }

    // Finalize the archive (i.e., finish the zipping process)
    await archive.finalize();

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};


// Function to get all file paths
async function getDetectFilePaths(dir, baseDir, filterLabel, confLow, confHigh) {
  // console.log(`getDetectFilePaths, filterLabel: ${filterLabel}`);
  let results = [];
  const list = await fs.readdir(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat && stat.isDirectory()) {
        const subResults = await getDetectFilePaths(filePath, baseDir, filterLabel, confLow, confHigh);
        results = results.concat(subResults);
    } else {
      const relativeFilePath = path.relative(
        path.join(__dirname, '../../data/image_marked'),
        filePath
      );

      // Extract the file name without the extension
      const fileNameWithoutExt = path.basename(relativeFilePath, path.extname(relativeFilePath));

      // Construct the corresponding JSON file path by replacing the base folder and appending `.json`
      const jsonFilePath = path.join(
        __dirname,
        '../../data/image_cropped_json',
        path.dirname(relativeFilePath),  // Keeps the directory structure intact
        `${fileNameWithoutExt}.json`
      );

      // Step 3: Extract label and confidence from the corresponding JSON file
      const jsonData = await extractLabelAndConfidence(jsonFilePath);
      if (jsonData) {
        const { label, confidence } = jsonData;

        // // Step 4: Filter based on the query parameters (label and confidence)
        // if (
        //   (!filterLabel || label === filterLabel) &&
        //   confidence >= parseFloat(confLow) &&
        //   confidence <= parseFloat(confHigh)
        // ) {
        //   const relativePath = path.relative(baseDir, filePath);
        //   results.push(relativePath);
        // }

        // Step 4: Filtering logic based on the query parameters
        const isLabelNoDetection = filterLabel === "NoDetection"; // Check if filterLabel is the string "NoDetection"
        const isLabelMatch = isLabelNoDetection ? label === null : (!filterLabel || label === filterLabel);
        
        // Apply confidence filtering only if filterLabel is not "null"
        const isConfidenceMatch = !isLabelNoDetection && confidence >= parseFloat(confLow) && confidence <= parseFloat(confHigh);

        if (isLabelMatch && (isLabelNoDetection || isConfidenceMatch)) {
          const relativePath = path.relative(baseDir, filePath);
          results.push(relativePath);
        }

      }
      
    }
  }

  return results;
}

exports.viewDetectImage = async (req, res) => {
  try {
    const { date, imagePath = '' } = req.query; // Query parameters: date and folder
    let baseDir, targetDir;
    
    if (!date || !imagePath) {
      return res.status(400).json({ error: 'Missing date or imagePath query parameters.' });
    }
    else {
      const userIdFolder = req.user.id + "";
      baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder, date);
      targetDir = path.resolve(baseDir, imagePath); // Resolve the full path
    }

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Invalid folder path.' });
    }

    // Check if the directory exists before reading it
    if (!await fs.pathExists(targetDir)) {
      return res.status(404).json({ error: 'Directory not found.' });
    }

    const stat = fs.statSync(targetDir);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Path is a directory, not an image file.' });
    }

    const mime = require('mime-types');
    const mimeType = mime.lookup(targetDir);
    if (!mimeType || !mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'The requested file is not an image.' });
    }

    // Ensure the file exists before sending it
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    res.sendFile(targetDir);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.runReid = async (req, res) => {
  const userIdFolder = req.user.id + "";
  const tempImagePath = path.join(__dirname, '../../temp/image_reid_pending', userIdFolder);
  const tempJsonPath = path.join(__dirname, '../../temp/image_cropped_reid_pending', userIdFolder);
  try {
    const AI_SERVER_PORT = process.env.AI_SERVER_PORT || 5000;
    const fetch = (await import('node-fetch')).default; // Dynamically import node-fetch

    // Terminate all running AI processes
    const terminateResponse = await fetch(`http://localhost:${AI_SERVER_PORT}/ai_api/terminate/${userIdFolder}`);
    if (!terminateResponse.ok) {
      return res.status(400).json({ error: '(Terminate) Re-identification AI server error, please contact support.' });
    }
    await fs.remove(tempImagePath);
    await fs.remove(tempJsonPath);

    const { selectedPaths } = req.body;
    if (!selectedPaths || !Array.isArray(selectedPaths) || selectedPaths.length === 0) {
      return res.status(400).json({ error: 'No images selected or invalid format.' });
    }

    // Copy selected image to a temp folder for ReID
    for (const imagePath of selectedPaths) {
      const baseDir = path.join(__dirname, '../../data/image_uploaded', userIdFolder);
      const srcPath = path.resolve(baseDir, imagePath); // Resolve the full path

      // Ensure the resolved path is still within the baseDir
      if (!srcPath.startsWith(baseDir)) {
        await fs.remove(tempImagePath);
        await fs.remove(tempJsonPath);
        return res.status(403).json({ error: 'Invalid folder path.' });
      }

      const destPath = path.join(__dirname, '../../temp/image_reid_pending', userIdFolder, imagePath);

      // Check if the source image exists
      if (await fs.pathExists(srcPath)) {
        // Ensure the destination directory exists
        await fs.ensureDir(path.dirname(destPath));

        // Copy the image
        await fs.copy(srcPath, destPath);
      } else {
        console.warn(`runReid: File not found: ${imagePath}`);
      }

    }

    // Make a GET request to the Flask server for streaming output
    // const AI_SERVER_PORT = process.env.AI_SERVER_PORT || 5000;
    
    // Dynamically import node-fetch
    // const fetch = (await import('node-fetch')).default;
    const response = await fetch(`http://localhost:${AI_SERVER_PORT}/ai_api/reid/${userIdFolder}`);

    // Check if the response is okay (status code 200)
    if (!response.ok) {
      await fs.remove(tempImagePath);
      return res.status(400).json({ error: 'Re-identification AI server error, please contact support.' });
    }

    // Set up the correct content type for the client to receive streaming data
    res.setHeader('Content-Type', 'text/html');

    // Forward data from Flask server to the client
    response.body.on('data', (chunk) => {
      res.write(chunk);
    });

    // End the response when the Flask server finishes streaming
    response.body.on('end', async () => {
      await fs.remove(tempImagePath);
      res.end();
    });

    // Handle any errors that occur during streaming
    response.body.on('error', async (err) => {
      console.error('Streaming error:', err);
      await fs.remove(tempImagePath);
      return res.status(500).end('ERROR: Re-identification AI model error, please contact support.');
    });

  } catch (error) {
    await fs.remove(tempImagePath);
    res.status(500).json({ error: error.message });
  }
};

exports.browseReidImage = async (req, res) => {
  try {
    const { date, time, group_id } = req.query; // Query parameters: date, time, group_id
    const userIdFolder = req.user.id + "";
    const baseDir = path.join(__dirname, '../../data/image_reid_output', userIdFolder);
    let targetDir, browseMode;
    
    if (!date) {
      // const userIdFolder = req.user.id + "";
      // baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder);
      browseMode = "root";
      targetDir = path.resolve(baseDir); // Resolve the full path
      fs.ensureDirSync(targetDir);
    }
    else if (!time) {
      // const userIdFolder = req.user.id + "";
      // baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder);
      browseMode = "date";
      targetDir = path.resolve(baseDir, date); // Resolve the full path
      // fs.ensureDirSync(targetDir);
    }
    else if (!group_id) {
      // const userIdFolder = req.user.id + "";
      // baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder, date);
      browseMode = "time";
      const timeJson = time + ".json";
      let relDir = path.join(date, timeJson);
      targetDir = path.resolve(baseDir, relDir); // Resolve the full path
      // fs.ensureDirSync(targetDir)
      // console.log("relDir: " + relDir);
      // console.log("targetDir: " + targetDir);
    }
    else {
      // const userIdFolder = req.user.id + "";
      // baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder, date, time);
      browseMode = "group_id";
      const timeJson = time + ".json";
      let relDir = path.join(date, timeJson);
      targetDir = path.resolve(baseDir, relDir); // Resolve the full path
      // fs.ensureDirSync(targetDir);
    }

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Invalid folder path.' });
    }

    // Check if the directory exists before reading it
    if (!await fs.pathExists(targetDir)) {
      // console.log("browseMode: " + browseMode);
      return res.status(404).json({ error: 'Directory not found.' });
    }

    if (browseMode === "root") {
      const stat = fs.statSync(targetDir);
      if (stat.isFile()) {
        return res.status(400).json({ error: 'Path is a file, not a directory.' });
      }
  
      const files = await fs.readdir(targetDir);
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(targetDir, file);
          const stat = await fs.stat(filePath);
          // console.log("date: " + date);
          // console.log("file: " + file);
          return {
            name: file,
            isDirectory: stat.isDirectory(),
            path: path.join(file),
            date: file,
            time: null,
            group_id: null,
            realDate: null,
            realPath: null,
          };
        })
      );
  
      return res.status(200).json({ files: fileDetails });
    }
    else if (browseMode === "date") {
      const stat = fs.statSync(targetDir);
      if (stat.isFile()) {
        return res.status(400).json({ error: 'Path is a file, not a directory.' });
      }
  
      const files = await fs.readdir(targetDir);
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(targetDir, file);
          // const stat = await fs.stat(filePath);
          const basename = path.basename(filePath);
          const fileName = path.parse(basename).name; // Remove the extension
          // console.log("date: " + date);
          // console.log("file: " + file);
          return {
            name: fileName,
            isDirectory: true,
            path: path.join(date, fileName),
            date: date,
            time: fileName,
            group_id: null,
            realDate: null,
            realPath: null,
          };
        })
      );
  
      return res.status(200).json({ files: fileDetails });
    }
    else if (browseMode === "time") {
      const ids = await extractKeysFromJson(targetDir);
      // console.log(ids);
      const response = {
        files: ids.map(key => ({
          name: key,
          isDirectory: true,
          path: path.join(date, time, key),
          date: date,
          time: time,
          group_id: key,
          realDate: null,
          realPath: null,
        }))
      };
      return res.status(200).json(response);
    }
    else if (browseMode === "group_id") {
      // Extract values
      const imagePaths = await extractValuesForKey(targetDir, group_id);
      // Extract filenames from the paths
      // const imageNames = imagePaths.map(imagePath => path.basename(imagePath));
      const response = {
        files: imagePaths.map(key => ({
          name: path.basename(key),
          isDirectory: false,
          path: path.join(date, time, group_id, path.basename(key)),
          date: date,
          time: time,
          group_id: group_id,
          realDate: key.split(path.sep)[0],
          realPath: key.split(path.sep).slice(1).join(path.sep),
        }))
      };
      return res.status(200).json(response);
    }
    else {
      return res.status(500).json({ error: "browseReidImage: Internal error related to browseMode." });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

exports.downloadReidImages = async (req, res) => {
  try {
    const { date, time } = req.query;
    const userIdFolder = req.user.id + "";
    const baseDir = path.join(__dirname, '../../data/image_reid_output', userIdFolder);
    const baseImgDir = path.join(__dirname, '../../data/image_marked', userIdFolder);
    let targetDir;

    if (!date && !time) {
      return res.status(400).json({ error: "Missing date or time query parameters." });
    }

    const timeJson = time + ".json";
    let relDir = path.join(date, timeJson);
    targetDir = path.resolve(baseDir, relDir);

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Invalid folder path.' });
    }

    // Check if the directory exists before reading it
    if (!await fs.pathExists(targetDir)) {
      // console.log("browseMode: " + browseMode);
      return res.status(404).json({ error: 'Directory not found.' });
    }

    // Read and parse the JSON file
    const fileStructure = JSON.parse(fs.readFileSync(targetDir, 'utf-8'));

    // Set the response headers for the zip file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=files.zip');

    const archive = archiver('zip', {
      zlib: { level: 0 } // Sets the compression level
    });

    // Pipe archive data to the response
    archive.pipe(res);

    // Iterate through the folder (key) and files (value) in the JSON structure
    for (const [folder, files] of Object.entries(fileStructure)) {
      for (const filePath of files) {
        const fullPath = path.resolve(baseImgDir, filePath); // Resolve the full path
        try {
          // Check if file exists using fs-extra
          await fs.access(fullPath);
          const fileName = path.basename(filePath); // Extract file name
          archive.file(fullPath, { name: path.join(folder, fileName) }); // Add file under the respective folder in the archive
        } catch (err) {
          console.warn(`File not found: ${fullPath}`); // Log missing files
        }
      }
    }

    // Finalise the archive (i.e., finish the zipping process)
    await archive.finalize();

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

// Function to read the JSON file and extract keys
const extractKeysFromJson = async (filePath) => {
  try {
      // Read the JSON file
      const data = fs.readFileSync(filePath, 'utf8');
      const jsonObject = JSON.parse(data);

      // Extract keys into a list
    return Object.keys(jsonObject);
  } catch (error) {
      console.error('Error reading or parsing JSON file:', error);
      return [];
  }
};

// Function to read the JSON file and extract values for a specific key
const extractValuesForKey = async (filePath, key) => {
  try {
      // Read the JSON file
      const data = fs.readFileSync(filePath, 'utf8');
      const jsonObject = JSON.parse(data);

      // Extract values for the specified key
      const values = jsonObject[key];
      
      // Check if values exist and return them, or return an empty array
      return Array.isArray(values) ? values : [];
  } catch (error) {
      console.error('Error reading or parsing JSON file:', error);
      return [];
  }
};

exports.deleteReidResult = async (req, res) => {
  try {
    const { date, time } = req.query; // Query parameters: date, time
    const userIdFolder = req.user.id + "";
    const baseDir = path.join(__dirname, '../../data/image_reid_output', userIdFolder);

    if (!date || !time) {
      return res.status(400).json({ error: 'Missing one or more query parameters: date, time.' });
    }

    const timeJson = time + ".json";
    // const dateDir = path.join(baseDir, date);
    const deteleDir = path.join(date, timeJson);
    const targetDir = path.resolve(baseDir, deteleDir);

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return res.status(400).json({ error: 'Invalid path.' });
    }

    // Check if the target exists
    if (await fs.pathExists(targetDir)) {
      await fs.remove(targetDir); // Remove the file or directory

      // Check if the date folder is now empty
      const dateDir = path.join(targetDir, "..");
      const remainingFiles = await fs.readdir(dateDir);
      if (remainingFiles.length === 0) {
        await fs.remove(dateDir); // Remove the date folder if empty
      }

      res.status(200).json({ message: `ReID result (date = ${date}, time = ${time}) deleted successfully.` });
    } else {
      res.status(404).json({ error: `ReID result (date = ${date}, time = ${time}) not found.` });
    } 

  } catch (error) {
    console.error(error);
    res.status(500).json({error: error.message});
  }
}

exports.renameReidGroup = async (req, res) => {
  try {
    const { date, time, old_group_id, new_group_id } = req.query;
    const userIdFolder = req.user.id + "";
    const baseDir = path.join(__dirname, '../../data/image_reid_output', userIdFolder);
    let targetDir;

    if (!date || !time || !old_group_id || !new_group_id) {
      return res.status(400).json({ error: 'Missing one or more query parameters: date, time, old_group_id, new_group_id.' });
    }

    const timeJson = time + ".json";
    let relDir = path.join(date, timeJson);
    targetDir = path.resolve(baseDir, relDir); // Resolve the full path

    // Ensure the resolved path is still within the baseDir
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Invalid folder path.' });
    }

    // Check if the directory exists before reading it
    if (!await fs.pathExists(targetDir)) {
      return res.status(404).json({ error: 'Directory not found.' });
    }

    // Read the JSON file
    const fileData = await fs.readJson(targetDir);

    // Check if old_group_id exists
    if (!fileData.hasOwnProperty(old_group_id)) {
      return res.status(404).json({ message: `Key "${old_group_id}" does not exist in the JSON file.` });
    }

    // Check if new_group_id already exists
    if (fileData.hasOwnProperty(new_group_id)) {
      if (new_group_id === old_group_id) {
        return res.status(200).json({ message: "The new name is the same as the old name. The group name will not change. " });
      }
      return res.status(409).json({ message: `Key "${new_group_id}" already exists. Cannot have duplicate keys.` });
    }

    // Create a new object to maintain the original order of keys
    const newData = {};

    // Loop through the existing keys in fileData
    Object.keys(fileData).forEach(key => {
      // If the key is the old_group_id, add it to newData with the new_group_id
      if (key === old_group_id) {
        newData[new_group_id] = fileData[old_group_id];
      } else {
        // Otherwise, just copy the existing key-value pair
        newData[key] = fileData[key];
      }
    });

    // Write the modified JSON back to the file
    await fs.writeJson(targetDir, newData, { spaces: 4 });

    res.status(200).json({ message: `Successfully renamed from ${old_group_id} to ${new_group_id}.` });

  } catch (error) {
    console.error(error);
    res.status(500).json({error: error.message});
  }
}

exports.terminateAI = async (req, res) => {
  try {
    const userIdFolder = req.user.id + "";
    const AI_SERVER_PORT = process.env.AI_SERVER_PORT || 5000;
    const fetch = (await import('node-fetch')).default; // Dynamically import node-fetch

    // Terminate all running AI processes
    const terminateResponse = await fetch(`http://localhost:${AI_SERVER_PORT}/ai_api/terminate/${userIdFolder}`);
    if (!terminateResponse.ok) {
      return res.status(400).json({ error: '(Terminate) AI server error, please contact support.' });
    }
    res.status(200).json({ message: `AI tasks terminated.` })
  }
  catch (error) {
    console.error(error);
    res.status(500).json({error: error.message});
  }
}

// exports.viewReidImage = async (req, res) => {
//   try {
//     const { date, time, group_id, image_name = '' } = req.query; // Query parameters: date, time, group_id, image_name
//     let baseDir, targetDir;
    
//     if (!date || !time || !group_id || !image_name) {
//       return res.status(400).json({ error: 'Missing date or imagePath query parameters.' });
//     }
//     else {
//       const userIdFolder = req.user.id + "";
//       baseDir = path.join(__dirname, '../../data/image_marked', userIdFolder, date);
//       targetDir = path.resolve(baseDir, imagePath); // Resolve the full path
//     }

//     // Ensure the resolved path is still within the baseDir
//     if (!targetDir.startsWith(baseDir)) {
//       return res.status(403).json({ error: 'Invalid folder path.' });
//     }

//     // Check if the directory exists before reading it
//     if (!await fs.pathExists(targetDir)) {
//       return res.status(404).json({ error: 'Directory not found.' });
//     }

//     const stat = fs.statSync(targetDir);
//     if (stat.isDirectory()) {
//       return res.status(400).json({ error: 'Path is a directory, not an image file.' });
//     }

//     const mime = require('mime-types');
//     const mimeType = mime.lookup(targetDir);
//     if (!mimeType || !mimeType.startsWith('image/')) {
//       return res.status(400).json({ error: 'The requested file is not an image.' });
//     }

//     // Ensure the file exists before sending it
//     if (!fs.existsSync(targetDir)) {
//       return res.status(404).json({ error: 'Image not found.' });
//     }

//     res.sendFile(targetDir);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }