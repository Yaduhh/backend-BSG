const express = require('express');
const router = express.Router();
const {
  getAllDivisions,
  getDepartmentsByDivision,
  getPositionsByDepartment,
  getCompleteJobdeskStructure,
  createDivision,
  createDepartment,
  createPosition,
  updateDivision,
  updateDepartment,
  updatePosition,
  deleteDivision,
  deleteDepartment,
  deletePosition
} = require('../controllers/jobdeskController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET routes
router.get('/divisions', getAllDivisions);
router.get('/divisions/:divisiId/departments', getDepartmentsByDivision);
router.get('/departments/:departmentId/positions', getPositionsByDepartment);
router.get('/structure', getCompleteJobdeskStructure);

// POST routes
router.post('/divisions', createDivision);
router.post('/departments', createDepartment);
router.post('/positions', createPosition);

// PUT routes
router.put('/divisions/:id', updateDivision);
router.put('/departments/:id', updateDepartment);
router.put('/positions/:id', updatePosition);

// DELETE routes
router.delete('/divisions/:id', deleteDivision);
router.delete('/departments/:id', deleteDepartment);
router.delete('/positions/:id', deletePosition);

module.exports = router;
