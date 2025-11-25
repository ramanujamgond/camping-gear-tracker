const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');

// Export all items to PDF (authenticated users only)
router.get('/pdf', authenticateToken, exportController.exportToPDF);

module.exports = router;
