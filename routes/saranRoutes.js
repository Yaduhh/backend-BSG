const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllSaran,
  getAllSaranForOwner,
  getSaranById,
  createSaran,
  updateSaran,
  deleteSaran
} = require('../controllers/saranController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/saran - Get all saran (admin only)
router.get('/', getAllSaran);

// GET /api/saran/owner - Get all saran for owner (all admin saran)
router.get('/owner', getAllSaranForOwner);

// GET /api/saran/:id - Get saran by ID
router.get('/:id', getSaranById);

// POST /api/saran - Create new saran
router.post('/', createSaran);

// PUT /api/saran/:id - Update saran
router.put('/:id', updateSaran);

// DELETE /api/saran/:id - Soft delete saran
router.delete('/:id', deleteSaran);

module.exports = router;
