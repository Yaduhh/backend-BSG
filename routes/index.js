const express = require('express');
const router = express.Router();

// Import route modules
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const picMenuRoutes = require('./picMenu');
const adminProfileRoutes = require('./adminProfile');

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/pic-menu', picMenuRoutes);
router.use('/admin', adminProfileRoutes);

module.exports = router; 