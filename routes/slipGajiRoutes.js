const express = require('express');
const router = express.Router();
const slipGajiController = require('../controllers/slipGajiController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Admin routes
router.get('/', slipGajiController.getAllSlipGaji);
router.get('/:id', slipGajiController.getSlipGajiById);
router.post('/', slipGajiController.createSlipGaji);
router.put('/:id', slipGajiController.updateSlipGaji);
router.delete('/:id', slipGajiController.deleteSlipGaji);

// User routes
router.get('/user/my-slips', slipGajiController.getSlipGajiByUser);

module.exports = router;