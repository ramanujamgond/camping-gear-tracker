const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TripItem = sequelize.define('TripItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trip_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'trips',
      key: 'id'
    }
  },
  item_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'items',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('taken', 'returned', 'lost', 'not_found'),
    allowNull: false,
    defaultValue: 'taken'
  },
  added_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  returned_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  added_by: {
    type: DataTypes.UUID,
    allowNull: true, // Allow null for super-admin
    references: {
      model: 'users',
      key: 'id'
    }
  },
  returned_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes_when_added: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes_when_returned: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'trip_items',
  underscored: true,
  timestamps: true
});

module.exports = TripItem;
