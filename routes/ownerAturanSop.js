const express = require('express');
const router = express.Router();
const Aturan = require('../models/Aturan');
const {
  getCompleteSopStructure
} = require('../controllers/sopController');
const { authenticateToken } = require('../middleware/auth');

const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Owner only.'
    });
  }
  next();
};

// Get all aturan for owner (read-only)
router.get('/aturan', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { q } = req.query;
    const data = q ? await Aturan.search(q) : await Aturan.getAll();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching owner aturan:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal memuat aturan' });
  }
});

// Get aturan by ID for owner (read-only)
router.get('/aturan/:id', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const item = await Aturan.getById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Aturan tidak ditemukan' });
    res.json({ success: true, data: item });
  } catch (err) {
    console.error('Error fetching owner aturan by ID:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal memuat aturan' });
  }
});

// Get complete SOP structure for owner (read-only)
router.get('/sop/structure', authenticateToken, ownerOnly, getCompleteSopStructure);

module.exports = router;
