const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { verifySuperAdminPin } = require('../middleware/auth');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Login with PIN
exports.login = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    }

    // Check if it's super admin PIN
    if (await verifySuperAdminPin(pin)) {
      const token = generateToken('super-admin', 'admin');
      return res.json({
        success: true,
        token,
        user: {
          id: 'super-admin',
          name: 'Super Admin',
          role: 'admin',
        },
      });
    }

    // Find user by PIN (check all users)
    const users = await User.findAll({ where: { is_active: true } });
    
    let matchedUser = null;
    for (const user of users) {
      const isValidPin = await user.verifyPin(pin);
      if (isValidPin) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    const token = generateToken(matchedUser.id, matchedUser.role);

    res.json({
      success: true,
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'role', 'is_active', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Create new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, pin, role = 'user' } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ message: 'Name and PIN are required' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    }

    const user = await User.create({
      name,
      pin_hash: pin, // Will be hashed by beforeCreate hook
      role,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pin, is_active } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (is_active !== undefined) user.is_active = is_active;
    if (pin) {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
      }
      user.pin_hash = pin; // Will be hashed by beforeUpdate hook
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};
