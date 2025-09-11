const express = require('express');
const router = express.Router();
const {
  getAllStruktur,
  getStrukturById,
  createStruktur,
  updateStruktur,
  deleteStruktur,
  strukturUpload
} = require('../controllers/strukturOrganisasiController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/struktur-organisasi - Get all struktur organisasi
router.get('/', getAllStruktur);

// GET /api/struktur-organisasi/:id - Get struktur by ID
router.get('/:id', getStrukturById);

// POST /api/struktur-organisasi - Create new struktur (Admin only)
router.post('/', strukturUpload.single('foto'), createStruktur);

// PUT /api/struktur-organisasi/:id - Update struktur (Admin only)
router.put('/:id', strukturUpload.single('foto'), updateStruktur);

// DELETE /api/struktur-organisasi/:id - Delete struktur (Admin only)
router.delete('/:id', deleteStruktur);

module.exports = router;
