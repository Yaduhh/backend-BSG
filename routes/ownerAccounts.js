const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ownerAccountsController = require('../controllers/ownerAccountsController');

// GET /api/owner/accounts
router.get('/', authenticateToken, ownerAccountsController.list);

// PUT /api/owner/accounts/:id/status
router.put('/:id/status', authenticateToken, ownerAccountsController.updateStatus);

// DELETE /api/owner/accounts/:id
router.delete('/:id', authenticateToken, ownerAccountsController.deleteAccount);

module.exports = router;
