const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { createCategoryValidation } = require('../middleware/validation');

router.get('/', categoryController.listCategories);
router.post('/', createCategoryValidation, categoryController.createCategory);

module.exports = router;
