const express = require('express');
const { body, validationResult } = require('express-validator');
const { sequelize, Op } = require('../config/database');
const User = require('../models/User');
const router = express.Router();

// Middleware untuk validasi error
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/users - Get all users (dengan pagination dan filter)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role, search } = req.query;
    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {
      status_deleted: false
    };
    
    if (status) whereClause.status = status;
    if (role) whereClause.role = role;
    if (search) {
      whereClause[Op.or] = [
        { nama: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const users = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: users.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(users.count / limit),
        total_items: users.count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/users/admin - Get admin users only
router.get('/admin', async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    const whereClause = {
      role: 'admin',
      status_deleted: false
    };
    
    if (status) whereClause.status = status;
    
    const users = await User.findAll({
      where: whereClause,
      order: [['nama', 'ASC']]
    });
    
    console.log(`🔍 Found ${users.length} admin users`);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.id,
        status_deleted: false
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/users - Create new user
router.post('/', [
  body('nama').trim().isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),
  body('username').trim().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username hanya boleh huruf, angka, dan underscore'),
  body('email').isEmail().normalizeEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').isIn(['owner', 'admin', 'leader', 'divisi']).withMessage('Role tidak valid'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Status tidak valid'),
  handleValidationErrors
], async (req, res) => {
  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: req.body.username },
          { email: req.body.email }
        ],
        status_deleted: false
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username atau email sudah terdaftar'
      });
    }
    
    const user = await User.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', [
  body('nama').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),
  body('username').optional().trim().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username hanya boleh huruf, angka, dan underscore'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email tidak valid'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').optional().isIn(['owner', 'admin', 'leader', 'divisi']).withMessage('Role tidak valid'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Status tidak valid'),
  handleValidationErrors
], async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.id,
        status_deleted: false
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if username or email already exists (excluding current user)
    if (req.body.username || req.body.email) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: req.body.username || user.username },
            { email: req.body.email || user.email }
          ],
          id: { [Op.ne]: req.params.id },
          status_deleted: false
        }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username atau email sudah terdaftar'
        });
      }
    }
    
    await user.update(req.body);
    
    res.json({
      success: true,
      message: 'User berhasil diupdate',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/users/:id - Soft delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.id,
        status_deleted: false
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.update({ status_deleted: true });
    
    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PATCH /api/users/:id/training - Update training status
router.patch('/:id/training', [
  body('training_dasar').optional().isBoolean().withMessage('training_dasar harus boolean'),
  body('training_leadership').optional().isBoolean().withMessage('training_leadership harus boolean'),
  body('training_skill').optional().isBoolean().withMessage('training_skill harus boolean'),
  body('training_lanjutan').optional().isBoolean().withMessage('training_lanjutan harus boolean'),
  handleValidationErrors
], async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.id,
        status_deleted: false
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const trainingFields = ['training_dasar', 'training_leadership', 'training_skill', 'training_lanjutan'];
    const updateData = {};
    
    trainingFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    await user.update(updateData);
    
    res.json({
      success: true,
      message: 'Training status berhasil diupdate',
      data: user
    });
  } catch (error) {
    console.error('Error updating training status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 