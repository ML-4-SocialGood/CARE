const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// User routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/logout', authController.logout);
router.get('/checkauth', authController.checkAuth);

// Admin routes
// router.post('/admin/auth/register', authController.registerAdmin);
// router.post('/admin/auth/login', authController.loginAdmin);
// router.post('/admin/auth/logout', authController.logout);

module.exports = router;
