const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ownerLaporanKeuanganController = require('../controllers/ownerLaporanKeuanganController');

// GET /api/owner/laporan-keuangan
router.get('/', authenticateToken, ownerLaporanKeuanganController.list);

// GET /api/owner/laporan-keuangan/statistics
router.get('/statistics', authenticateToken, ownerLaporanKeuanganController.getStatistics);

// GET /api/owner/laporan-keuangan/:id
router.get('/:id', authenticateToken, ownerLaporanKeuanganController.getById);

module.exports = router;
