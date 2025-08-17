const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
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

// POST /api/auth/login - Login user
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username diperlukan'),
  body('password').notEmpty().withMessage('Password diperlukan'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Cari user berdasarkan username atau email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: username }
        ],
        status_deleted: false,
        status: 'active'
      }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }
    
    // Verifikasi password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'bosgil_group',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    // Update last login
    await user.update({ updated_at: new Date() });
    
    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: user.toJSON(),
        token: token
      }
    });
    
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', async (req, res) => {
  try {
    // Untuk JWT, logout dilakukan di client dengan menghapus token
    res.json({
      success: true,
      message: 'Logout berhasil'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bosgil_group');
    
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        status_deleted: false,
        status: 'active'
      }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: user.toJSON()
    });
    
  } catch (error) {
    console.error('Error getting user info:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/auth/verify - Verify token validity
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bosgil_group');
    
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        status_deleted: false,
        status: 'active'
      }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Token valid',
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Error verifying token:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 