const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the username is already taken
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Check if the email is already taken
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email is already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully. Awaiting admin approval.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    if (!user.isAuth) {
      return res.status(403).json({ error: 'User is not authorised. Please wait for admin approval.' });
    }

    const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Set the JWT token as an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true, // Prevents JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent only over HTTPS in production
    });

    res.status(200).json({ id: user.id, isAdmin: user.isAdmin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({ message: 'User logged out successfully' });
};

exports.checkAuth = async (req, res) => {
  if (!req.cookies.token) {
    return res.status(401).json({ authenticated: false, userId: null, isAdmin: false });
  }
  try {
    const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    return res.status(200).json({ authenticated: true, userId: decoded.id, isAdmin: decoded.isAdmin });
  } catch (error) {
    return res.status(401).json({ authenticated: false, userId: null, isAdmin: false });
  }
}
