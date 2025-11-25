const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ItemImage = sequelize.define('ItemImage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  item_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'items',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'item_images',
  timestamps: true,
  underscored: true
});

module.exports = ItemImage;
