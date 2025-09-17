const express = require('express');
const router = express.Router();
const {
  getAllDivisions,
  getDepartmentsByDivision,
  getPositionsByDepartment,
  getCompleteJobdeskStructure,
  getUserJobdeskStructure,
  createDepartment,
  createPosition,
  updateDepartment,
  updatePosition,
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

// Get jobdesk structure based on user's division
router.get('/user-structure', getUserJobdeskStructure);

// POST routes
router.post('/departments', createDepartment);
router.post('/positions', createPosition);

// PUT routes
router.put('/departments/:id', updateDepartment);
router.put('/positions/:id', updatePosition);

// DELETE routes
router.delete('/departments/:id', deleteDepartment);
router.delete('/positions/:id', deletePosition);

module.exports = router;
