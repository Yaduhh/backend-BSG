const express = require('express');
const router = express.Router();
const {
  getAllDivisions,
  getCategoriesByDivision,
  getCompleteSopStructure,
  createCategory,
  createStep,
  updateCategory,
  updateStep,
  deleteCategory,
  deleteStep,
  getSopByUserDivisi,
  getSopByDivisi
} = require('../controllers/sopController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET routes
router.get('/divisions', getAllDivisions);
router.get('/divisions/:divisiId/categories', getCategoriesByDivision);
router.get('/structure', getCompleteSopStructure);

// POST routes
router.post('/categories', createCategory);
router.post('/steps', createStep);

// PUT routes
router.put('/categories/:id', updateCategory);
router.put('/steps/:id', updateStep);

// DELETE routes
router.delete('/categories/:id', deleteCategory);
router.delete('/steps/:id', deleteStep);

// SOP by divisi routes
router.get('/user-divisi', getSopByUserDivisi);
router.get('/divisi/:divisiId', getSopByDivisi);

module.exports = router;
