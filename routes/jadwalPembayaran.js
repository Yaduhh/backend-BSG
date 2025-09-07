const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const {
  getAllJadwalPembayaran,
  getJadwalPembayaranById,
  createJadwalPembayaran,
  updateJadwalPembayaran,
  deleteJadwalPembayaran,
  getAvailablePics,
  initializeDefaultItems
} = require('../controllers/jadwalPembayaranController');

// Middleware untuk semua routes
router.use(authenticateToken);

// Routes untuk jadwal pembayaran
router.get('/', getAllJadwalPembayaran);
router.get('/pics', getAvailablePics);
router.get('/:id', getJadwalPembayaranById);
router.post('/', createJadwalPembayaran);
router.put('/:id', updateJadwalPembayaran);
router.delete('/:id', deleteJadwalPembayaran);

// Route khusus untuk owner - initialize default items
router.post('/initialize-default', initializeDefaultItems);

module.exports = router;
