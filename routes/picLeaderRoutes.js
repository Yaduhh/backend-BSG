const express = require('express');
const router = express.Router();
const {
  getAllPicLeaders,
  getPicLeaderById,
  getPicLeadersByUserId,
  createPicLeader,
  updatePicLeader,
  deletePicLeader,
  toggleStatusAktif
} = require('../controllers/picLeaderController');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get all PIC leader menus
router.get('/', getAllPicLeaders);

// Get PIC leader menu by ID
router.get('/:id', getPicLeaderById);

// Get PIC leader menus by user ID
router.get('/user/:userId', getPicLeadersByUserId);

// Create new PIC leader menu
router.post('/', createPicLeader);

// Update PIC leader menu
router.put('/:id', updatePicLeader);

// Soft delete PIC leader menu
router.delete('/:id', deletePicLeader);

// Toggle status aktif PIC leader menu
router.patch('/:id/toggle-status', toggleStatusAktif);

module.exports = router;
