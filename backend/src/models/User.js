const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  pin_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

// Hash PIN before saving
User.beforeCreate(async (user) => {
  if (user.pin_hash) {
    user.pin_hash = await bcrypt.hash(user.pin_hash, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('pin_hash')) {
    user.pin_hash = await bcrypt.hash(user.pin_hash, 10);
  }
});

// Method to verify PIN
User.prototype.verifyPin = async function(pin) {
  return await bcrypt.compare(pin, this.pin_hash);
};

module.exports = User;
