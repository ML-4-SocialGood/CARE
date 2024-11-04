require('dotenv').config();
const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../configs/dbConfig');

const User = require('./user');
const Image = require('./image');
const { isAdmin } = require('../middlewares/authMiddleware');


// Sync all models with the database
sequelize.sync()
  .then(async () => {
    const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME;
    const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL;
    const DEFAULT_ADMIN_PASSWORD = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 10);
    const adminData = { username: DEFAULT_ADMIN_USERNAME, email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD, isAdmin: true, isAuth: true };

    const [user, created] = await User.findOrCreate({
      where: { username: adminData.username },
      defaults: adminData,
    });
    if (created) {
      console.log('Default admin created.')
    }
    console.log('Database synced successfully');
  })
  .catch(error => {
    console.error('Error syncing database:', error);
  });

const db = {
  sequelize,
  Sequelize,
  User,
  // Admin,
  Image
};

// Export the db object containing all models and Sequelize connection
module.exports = db;
