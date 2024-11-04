const { DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
const User = require('./user');

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
});

// Define associations here if not already defined
User.hasMany(Image, { as: 'images', foreignKey: 'userId' });
Image.belongsTo(User, { foreignKey: 'userId' });

module.exports = Image;
