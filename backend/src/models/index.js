const Item = require('./Item');
const ItemImage = require('./ItemImage');
const Category = require('./Category');
const User = require('./User');

// Define associations
Item.hasMany(ItemImage, { 
  foreignKey: 'item_id', 
  as: 'images',
  onDelete: 'CASCADE'
});

ItemImage.belongsTo(Item, { 
  foreignKey: 'item_id',
  as: 'item'
});

// Many-to-Many: Items <-> Categories
Item.belongsToMany(Category, {
  through: 'item_categories',
  foreignKey: 'item_id',
  otherKey: 'category_id',
  as: 'categories'
});

Category.belongsToMany(Item, {
  through: 'item_categories',
  foreignKey: 'category_id',
  otherKey: 'item_id',
  as: 'items'
});

module.exports = {
  Item,
  ItemImage,
  Category,
  User
};
