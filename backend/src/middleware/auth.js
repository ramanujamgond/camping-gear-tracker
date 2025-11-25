const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle super admin (doesn't exist in database)
    if (decoded.userId === 'super-admin') {
      req.user = {
        id: 'super-admin',
        name: 'Super Admin',
        role: 'admin',
      };
      return next();
    }
    
    // Handle regular users
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      role: user.role,
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Verify super admin PIN
const verifySuperAdminPin = async (pin) => {
  const superAdminPin = process.env.SUPER_ADMIN_PIN;
  return pin === superAdminPin;
};

module.exports = {
  authenticateToken,
  requireAdmin,
  verifySuperAdminPin,
};
