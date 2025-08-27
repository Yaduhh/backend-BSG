const express = require('express');
const router = express.Router();
const { kpiController } = require('../controllers/kpiController');

// Middleware untuk authentication (bisa ditambahkan nanti)
// const { authenticateToken } = require('../middleware/auth');

// KPI Routes
router.get('/', kpiController.getAllKPIs);
router.get('/category/:category', kpiController.getKPIsByCategory);
router.get('/:id', kpiController.getKPIById);
router.post('/', kpiController.createKPI);
router.put('/:id', kpiController.updateKPI);
router.delete('/:id', kpiController.deleteKPI);

module.exports = router;
