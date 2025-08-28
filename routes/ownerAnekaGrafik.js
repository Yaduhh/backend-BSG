const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllAnekaGrafik,
  getAnekaGrafikByCategory,
  getAnekaGrafikById,
  getStats
} = require('../controllers/anekaGrafikController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all aneka grafik (read-only)
router.get('/', getAllAnekaGrafik);

// Get statistics (read-only) - must be before /:id route
router.get('/stats/overview', getStats);

// Get aneka grafik by category (read-only)
router.get('/category/:category', getAnekaGrafikByCategory);

// Get aneka grafik by ID (read-only)
router.get('/:id', getAnekaGrafikById);

module.exports = router;
