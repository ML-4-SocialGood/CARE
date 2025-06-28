const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

// Uploader
router.post('/images/upload', userController.uploadImage);

// Upload Image Gallery
router.get('/images/browse', userController.browseImage);
router.get('/images/view', userController.viewImage);
router.get('/images/select_all', userController.getImagePaths);
router.post('/images/download_selected', userController.downloadSelectedGalleryImages)

// Run Detection
router.post('/images/detect', userController.runDetection);

// Detection Image Gallery
router.get('/detect_images/browse', userController.browseDetectImage);
router.get('/detect_images/view', userController.viewDetectImage);
router.get('/detect_images/select_all', userController.getDetectImagePaths);

// Download Detection Images
router.get('/detect_images/download', userController.downloadDetectImages);
router.post('/detect_images/download_selected', userController.downloadSelectedDetectImages);

// Run ReID
router.post('/detect_images/reid', userController.runReid);

// ReID Image Gallery
router.get('/reid_images/browse', userController.browseReidImage);
router.delete('/reid_images/delete', userController.deleteReidResult);
router.post('/reid_images/rename', userController.renameReidGroup);

// ReID Result Download
router.get('/reid_images/download_selected', userController.downloadReidImages);

// Terminate AI Processes
router.get('/terminate_ai', userController.terminateAI);

module.exports = router;
