const express = require('express');
const router = express.Router();
const {
  getAllDivisions,
  getCategoriesByDivision,
  getCompleteSopStructure,
  createDivision,
  createCategory,
  createStep,
  updateDivision,
  updateCategory,
  updateStep,
  deleteDivision,
  deleteCategory,
  deleteStep
} = require('../controllers/sopController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET routes
router.get('/divisions', getAllDivisions);
router.get('/divisions/:divisiId/categories', getCategoriesByDivision);
router.get('/structure', getCompleteSopStructure);

// POST routes
router.post('/divisions', createDivision);
router.post('/categories', createCategory);
router.post('/steps', createStep);

// PUT routes
router.put('/divisions/:id', updateDivision);
router.put('/categories/:id', updateCategory);
router.put('/steps/:id', updateStep);

// DELETE routes
router.delete('/divisions/:id', deleteDivision);
router.delete('/categories/:id', deleteCategory);
router.delete('/steps/:id', deleteStep);

module.exports = router;
