const express = require('express');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./models'); // This will also run the sync in index.js

const app = express();
app.use(cors());
app.use(cookieParser());

// Increase payload limits for JSON and URL-encoded data
app.use(express.json({ limit: '100mb' })); // Set limit for JSON
app.use(express.urlencoded({ limit: '100mb', extended: true })); // Set limit for URL-encoded data

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
