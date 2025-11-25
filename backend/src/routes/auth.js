const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);

// Protected routes (admin only)
router.get('/users', authenticateToken, requireAdmin, authController.getUsers);
router.post('/users', authenticateToken, requireAdmin, authController.createUser);
router.put('/users/:id', authenticateToken, requireAdmin, authController.updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, authController.deleteUser);

module.exports = router;
