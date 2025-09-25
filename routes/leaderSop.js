const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { SdmData, SdmJabatan, SdmDivisi } = require('../models');
const { getSopByDivisi, getSopByUserDivisi } = require('../controllers/sopController');

// Readonly: get SOP terkait leader (by user divisi)
router.get('/list', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ success: false, message: 'Access denied. Leader only.' });
    }
    // Reuse controller:
    req.query.userId = req.user.id;
    return getSopByUserDivisi(req, res, next);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Optional: get SOP by specific divisi id (still readonly)
router.get('/divisi/:divisiId', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'leader') {
    return res.status(403).json({ success: false, message: 'Access denied. Leader only.' });
  }
  return getSopByDivisi(req, res, next);
});

module.exports = router;


