const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ownerPengajuanController = require('../controllers/ownerPengajuanController');

// GET /api/owner/pengajuan
router.get('/', authenticateToken, ownerPengajuanController.list);

// GET /api/owner/pengajuan/:id
router.get('/:id', authenticateToken, ownerPengajuanController.getById);

module.exports = router;
