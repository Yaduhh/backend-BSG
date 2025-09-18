const express = require('express');
const router = express.Router();
const {
  getAllLeaders,
  getAllDivisis,
  createLeaderAccess,
  updateLeaderAccess,
  deleteLeaderAccess,
  getLeaderAccessByUserId,
  getLeaderAccessByDivisiId
} = require('../controllers/leaderAccessController');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get all leaders with their divisi access
router.get('/', getAllLeaders);

// Get all divisis
router.get('/divisis', getAllDivisis);

// Create leader access
router.post('/', createLeaderAccess);

// Update leader access
router.put('/:id', updateLeaderAccess);

// Delete leader access
router.delete('/:id', deleteLeaderAccess);

// Get leader access by user ID
router.get('/user/:userId', getLeaderAccessByUserId);

// Get leader access by divisi ID
router.get('/divisi/:divisiId', getLeaderAccessByDivisiId);

module.exports = router;
