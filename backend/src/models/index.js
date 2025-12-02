const Item = require('./Item');
const ItemImage = require('./ItemImage');
const Category = require('./Category');
const User = require('./User');
const Trip = require('./Trip');
const TripItem = require('./TripItem');

// Item <-> ItemImage associations
Item.hasMany(ItemImage, { 
  foreignKey: 'item_id', 
  as: 'images',
  onDelete: 'CASCADE'
});

ItemImage.belongsTo(Item, { 
  foreignKey: 'item_id',
  as: 'item'
});

// Item <-> Category associations (Many-to-Many)
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

// Trip <-> User associations
Trip.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Trip, {
  foreignKey: 'created_by',
  as: 'trips'
});

// Trip <-> TripItem associations
Trip.hasMany(TripItem, {
  foreignKey: 'trip_id',
  as: 'trip_items',
  onDelete: 'CASCADE'
});

TripItem.belongsTo(Trip, {
  foreignKey: 'trip_id',
  as: 'trip'
});

// TripItem <-> Item associations
TripItem.belongsTo(Item, {
  foreignKey: 'item_id',
  as: 'item'
});

Item.hasMany(TripItem, {
  foreignKey: 'item_id',
  as: 'trip_items'
});

// TripItem <-> User associations (who added/returned)
TripItem.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'adder'
});

TripItem.belongsTo(User, {
  foreignKey: 'returned_by',
  as: 'returner'
});

module.exports = {
  Item,
  ItemImage,
  Category,
  User,
  Trip,
  TripItem
};
