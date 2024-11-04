const bcrypt = require('bcryptjs');
const { User, Image } = require('../models');

// Get all users with optional authorization filter
exports.getAllUsers = async (req, res) => {
  try {
    const { isAuth } = req.query;
    const whereClause = isAuth && isAuth !== 'all' ? { isAuth: isAuth === 'true' } : {};
    const users = await User.findAll({ where: whereClause });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user profile by user ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user profile by user ID (Email, isAdmin, isAuth)
exports.updateUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    const { email, password, isAdmin, isAuth } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (email) {
      const existingUserByEmail = await User.findOne({ where: { email } });
      if (existingUserByEmail) {
        if (existingUserByEmail.id !== userIdInt) {
          return res.status(400).json({ message: 'Email is already taken.' });
        }
      }
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await user.update({ email, password: hashedPassword, isAdmin, isAuth });
      res.json({ message: `User ${userId} profile updated successfully.` });
    } else {
      await user.update({ email, isAdmin, isAuth });
      res.json({ message: `User ${userId} profile updated successfully.` });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all uploaded images by all users
exports.getAllImages = async (req, res) => {
  try {
    const images = await Image.findAll();
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get uploaded images by user ID
exports.getImagesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const images = await Image.findAll({ where: { userId } });

    if (!images) {
      return res.status(404).json({ error: 'Images not found.' });
    }

    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete uploaded image by image ID
exports.deleteImageById = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await Image.findByPk(imageId);

    if (!image) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    // Delete the file from the filesystem
    const filePath = path.join('imageUpload', image.filename);
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await image.destroy();
    res.json({ message: 'Image deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
