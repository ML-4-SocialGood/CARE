const express = require('express');
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

// Profile
router.get('/profile', isAuthenticated, userController.getUserProfile);
router.put('/profile', isAuthenticated, userController.updateUserProfile);

// Uploader
router.post('/images/upload', isAuthenticated, userController.uploadImage);

// Upload Image Gallery
router.get('/images/browse', isAuthenticated, userController.browseImage);
router.get('/images/view', isAuthenticated, userController.viewImage);
router.get('/images/select_all', isAuthenticated, userController.getImagePaths);
router.post('/images/download_selected', isAuthenticated, userController.downloadSelectedGalleryImages)
// router.get('/images/:imageId', isAuthenticated, userController.getImageById);
// router.delete('/images/delete', isAuthenticated, userController.deleteImage);

// Run Detection
router.post('/images/detect', isAuthenticated, userController.runDetection);

// Detection Image Gallery
router.get('/detect_images/browse', isAuthenticated, userController.browseDetectImage);
router.get('/detect_images/view', isAuthenticated, userController.viewDetectImage);
router.get('/detect_images/select_all', isAuthenticated, userController.getDetectImagePaths);

// Download Detection Images
router.get('/detect_images/download', isAuthenticated, userController.downloadDetectImages);
router.post('/detect_images/download_selected', isAuthenticated, userController.downloadSelectedDetectImages);

// Run ReID
router.post('/detect_images/reid', isAuthenticated, userController.runReid);

// ReID Image Gallery
router.get('/reid_images/browse', isAuthenticated, userController.browseReidImage);
// router.get('/reid_images/view', isAuthenticated, userController.viewReidImage);
router.delete('/reid_images/delete', isAuthenticated, userController.deleteReidResult);
router.post('/reid_images/rename', isAuthenticated, userController.renameReidGroup);

// ReID Result Download
router.get('/reid_images/download_selected', isAuthenticated, userController.downloadReidImages);

// Terminate AI Processes
router.get('/terminate_ai', isAuthenticated, userController.terminateAI);

module.exports = router;
