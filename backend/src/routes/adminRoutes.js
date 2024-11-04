const express = require('express');
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/users', isAuthenticated, isAdmin, adminController.getAllUsers);
router.get('/users/:userId', isAuthenticated, isAdmin, adminController.getUserById);
router.put('/users/:userId', isAuthenticated, isAdmin, adminController.updateUserById);
// router.get('/images', isAuthenticated, isAdmin, adminController.getAllImages);
// router.get('/users/images/:userId', isAuthenticated, isAdmin, adminController.getImagesByUserId);
// router.delete('/images/:imageId', isAuthenticated, isAdmin, adminController.deleteImageById);

module.exports = router;
