const express = require('express');
const router = express.Router();
const picKategoriController = require('../controllers/picKategoriController');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

// Get all PIC kategori assignments
router.get('/', authenticateToken, picKategoriController.getAllPicKategori);

// Get available PICs
router.get('/available-pics', authenticateToken, picKategoriController.getAvailablePics);

// Update PIC for a category
router.put('/:kategori', authenticateToken, picKategoriController.updatePicKategori);

module.exports = router;
