const { validationResult, body, param, query } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Item validation rules
const createItemValidation = [
  body('qr_code_id')
    .trim()
    .notEmpty().withMessage('QR code ID is required')
    .isLength({ min: 3, max: 100 }).withMessage('QR code ID must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9-_]+$/).withMessage('QR code ID can only contain letters, numbers, hyphens, and underscores'),
  
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  
  body('category_ids')
    .optional()
    .isArray().withMessage('Category IDs must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const allValid = value.every(id => uuidRegex.test(id));
        if (!allValid) {
          throw new Error('All category IDs must be valid UUIDs');
        }
      }
      return true;
    }),
  
  validate
];

const updateItemValidation = [
  param('id')
    .isUUID().withMessage('Invalid item ID format'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  
  body('category_ids')
    .optional()
    .isArray().withMessage('Category IDs must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const allValid = value.every(id => uuidRegex.test(id));
        if (!allValid) {
          throw new Error('All category IDs must be valid UUIDs');
        }
      }
      return true;
    }),
  
  validate
];

const getItemByQrValidation = [
  param('qr_code_id')
    .trim()
    .notEmpty().withMessage('QR code ID is required')
    .isLength({ min: 3, max: 100 }).withMessage('Invalid QR code ID length'),
  
  validate
];

const listItemsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Search query too long'),
  
  validate
];

// Category validation rules
const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s-_]+$/).withMessage('Category name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  validate
];

// Image validation rules
const uploadImagesValidation = [
  param('id')
    .isUUID().withMessage('Invalid item ID format'),
  
  body('is_primary')
    .optional()
    .isIn(['true', 'false']).withMessage('is_primary must be "true" or "false"'),
  
  validate
];

const deleteImageValidation = [
  param('id')
    .isUUID().withMessage('Invalid image ID format'),
  
  validate
];

const deleteItemValidation = [
  param('id')
    .isUUID().withMessage('Invalid item ID format'),
  
  validate
];

module.exports = {
  validate,
  createItemValidation,
  updateItemValidation,
  getItemByQrValidation,
  listItemsValidation,
  createCategoryValidation,
  uploadImagesValidation,
  deleteImageValidation,
  deleteItemValidation
};
