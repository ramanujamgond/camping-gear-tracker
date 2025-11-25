const { Item, ItemImage, Category } = require('../models');
const { Op } = require('sequelize');

// GET /items/:qr_code_id - Check if item exists
exports.getItemByQr = async (req, res) => {
  try {
    const { qr_code_id } = req.params;
    
    const item = await Item.findOne({
      where: { qr_code_id },
      include: [
        {
          model: ItemImage,
          as: 'images',
          order: [['is_primary', 'DESC'], ['created_at', 'ASC']]
        },
        {
          model: Category,
          as: 'categories',
          through: { attributes: [] }
        }
      ]
    });

    if (!item) {
      return res.status(404).json({ 
        message: 'Item not found, ready to create',
        qr_code_id 
      });
    }

    return res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// POST /items - Create new item
exports.createItem = async (req, res) => {
  try {
    const { qr_code_id, name, description, category_ids } = req.body;

    // Check if QR code already exists
    const existing = await Item.findOne({ where: { qr_code_id } });
    if (existing) {
      return res.status(409).json({ 
        message: 'Item with this QR code already exists',
        item: existing
      });
    }

    // Validate categories exist if provided
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const categories = await Category.findAll({
        where: { id: { [Op.in]: category_ids } }
      });
      
      if (categories.length !== category_ids.length) {
        return res.status(400).json({ 
          message: 'One or more category IDs are invalid',
          found: categories.length,
          requested: category_ids.length
        });
      }
    }

    // Create item
    const newItem = await Item.create({
      qr_code_id,
      name,
      description
    });

    // Add categories if provided
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const categories = await Category.findAll({
        where: { id: { [Op.in]: category_ids } }
      });
      await newItem.setCategories(categories);
    }

    // Fetch complete item with associations
    const item = await Item.findByPk(newItem.id, {
      include: [
        { model: ItemImage, as: 'images' },
        { model: Category, as: 'categories', through: { attributes: [] } }
      ]
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: 'Item with this QR code already exists',
        error: 'Duplicate QR code'
      });
    }
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// PUT /items/:id - Update item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_ids } = req.body;

    // Check if at least one field is provided
    if (!name && description === undefined && !category_ids) {
      return res.status(400).json({ 
        message: 'At least one field (name, description, or category_ids) must be provided' 
      });
    }

    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Validate categories exist if provided
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const categories = await Category.findAll({
        where: { id: { [Op.in]: category_ids } }
      });
      
      if (categories.length !== category_ids.length) {
        return res.status(400).json({ 
          message: 'One or more category IDs are invalid',
          found: categories.length,
          requested: category_ids.length
        });
      }
    }

    // Update fields
    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    await item.save();

    // Update categories if provided
    if (category_ids && Array.isArray(category_ids)) {
      const categories = await Category.findAll({
        where: { id: { [Op.in]: category_ids } }
      });
      await item.setCategories(categories);
    }

    // Fetch updated item
    const updatedItem = await Item.findByPk(id, {
      include: [
        { model: ItemImage, as: 'images' },
        { model: Category, as: 'categories', through: { attributes: [] } }
      ]
    });

    return res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// DELETE /items/:id - Delete item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByPk(id, {
      include: [{ model: ItemImage, as: 'images' }]
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Delete associated images from disk
    if (item.images && item.images.length > 0) {
      const fs = require('fs').promises;
      const path = require('path');
      
      for (const image of item.images) {
        const filePath = path.join(__dirname, '../../', image.image_url);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.warn(`Failed to delete file: ${filePath}`, err.message);
          // Continue with deletion even if file doesn't exist
        }
      }
    }

    // Delete item (cascade will delete images and category associations)
    await item.destroy();

    return res.json({ 
      message: 'Item deleted successfully',
      deleted_item_id: id,
      deleted_images_count: item.images ? item.images.length : 0
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// GET /items - List all items (with pagination)
exports.listItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = search ? {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { qr_code_id: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await Item.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { 
          model: ItemImage, 
          as: 'images',
          where: { is_primary: true },
          required: false
        },
        { 
          model: Category, 
          as: 'categories', 
          through: { attributes: [] } 
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      items: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error listing items:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
