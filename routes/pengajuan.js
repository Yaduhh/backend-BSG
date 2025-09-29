const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pengajuanController = require('../controllers/pengajuanController');

// GET /api/pengajuan
router.get('/', authenticateToken, pengajuanController.list);

// GET /api/pengajuan/:id
router.get('/:id', authenticateToken, pengajuanController.getById);

// POST /api/pengajuan
router.post('/', authenticateToken, pengajuanController.create);

// PUT /api/pengajuan/:id
router.put('/:id', authenticateToken, pengajuanController.update);

// DELETE /api/pengajuan/:id
router.delete('/:id', authenticateToken, pengajuanController.delete);

// PUT /api/pengajuan/:id/status
router.put('/:id/status', authenticateToken, pengajuanController.updateStatus);

module.exports = router;
