const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllAnekaGrafik,
  getAnekaGrafikByCategory,
  getAnekaGrafikById,
  createAnekaGrafik,
  updateAnekaGrafik,
  deleteAnekaGrafik
} = require('../controllers/anekaGrafikController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all aneka grafik
router.get('/', getAllAnekaGrafik);

// Get aneka grafik by category
router.get('/category/:category', getAnekaGrafikByCategory);

// Get aneka grafik by ID
router.get('/:id', getAnekaGrafikById);

// Create new aneka grafik
router.post('/', createAnekaGrafik);

// Update aneka grafik
router.put('/:id', updateAnekaGrafik);

// Delete aneka grafik
router.delete('/:id', deleteAnekaGrafik);

module.exports = router;
