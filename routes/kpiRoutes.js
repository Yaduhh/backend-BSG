const express = require('express');
const router = express.Router();
const { kpiController } = require('../controllers/kpiController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// KPI Routes
router.get('/', kpiController.getAllKPIs);
router.get('/category/:category', kpiController.getKPIsByCategory);
router.get('/leader/:userId', kpiController.getKPIsByLeaderDivision);
router.get('/:id', kpiController.getKPIById);
router.post('/', kpiController.createKPI);
router.put('/:id', kpiController.updateKPI);
router.delete('/:id', kpiController.deleteKPI);

module.exports = router;
