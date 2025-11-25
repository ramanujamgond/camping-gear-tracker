const { Category, Item } = require('../models');

// GET /categories - List all categories
exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    return res.json({
      categories,
      total: categories.length
    });
  } catch (error) {
    console.error('Error listing categories:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// POST /categories - Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check if category already exists
    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ 
        message: 'Category with this name already exists',
        category: existing
      });
    }

    const category = await Category.create({ name, description });
    return res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: 'Category with this name already exists',
        error: 'Duplicate category name'
      });
    }
    
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};
