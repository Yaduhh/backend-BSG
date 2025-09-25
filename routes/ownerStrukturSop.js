const express = require('express');
const router = express.Router();
const {
  getAllStruktur
} = require('../controllers/strukturOrganisasiController');
const {
  getCompleteJobdeskStructure
} = require('../controllers/jobdeskController');
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

// Get struktur organisasi for owner (read-only)
router.get('/struktur-organisasi', authenticateToken, ownerOnly, getAllStruktur);

// Get complete jobdesk structure for owner (read-only)
router.get('/jobdesk/complete-structure', authenticateToken, ownerOnly, getCompleteJobdeskStructure);

module.exports = router;
