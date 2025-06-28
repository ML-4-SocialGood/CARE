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

// Function to list all routes
function listRoutes(app) {
    console.log('Registered Routes:');
    app._router.stack.forEach(function (middleware) {
        if (middleware.route) { // Routes registered directly on the app
            console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
        } else if (middleware.name === 'router') { // Routes defined using express.Router()
            middleware.handle.stack.forEach(function (handler) {
                if (handler.route) {
                    console.log(`${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`);
                }
            });
        }
    });
}

// Call the function to list routes
listRoutes(app);

module.exports = app;
