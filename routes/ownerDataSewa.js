const express = require('express');
const router = express.Router();
const DataSewa = require('../models/DataSewa');
const { authenticateToken } = require('../middleware/auth');

// Middleware untuk memastikan hanya owner yang bisa akses
const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Owner only.'
    });
  }
  next();
};

// Get all rental data (read-only preview) - sama persis dengan admin tapi endpoint owner
router.get('/', authenticateToken, ownerOnly, async (req, res) => {
  try {
    console.log('📋 GET /owner/data-sewa - Request received');
    console.log('👤 User:', req.user);
    
    const dataSewa = new DataSewa();
    console.log('🔍 Calling dataSewa.getAll()...');
    const data = await dataSewa.getAll();
    
    console.log('📊 Data retrieved:', data);
    console.log('📊 Data length:', data ? data.length : 'null/undefined');
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('❌ Error fetching owner rental data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sewa'
    });
  }
});

// Get categories (read-only preview) - sama persis dengan admin tapi endpoint owner
router.get('/categories/list', authenticateToken, ownerOnly, async (req, res) => {
  try {
    console.log('📂 GET /owner/data-sewa/categories/list - Request received');
    const dataSewa = new DataSewa();
    const categories = await dataSewa.getCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching owner categories:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar kategori'
    });
  }
});

// Get rental data by category (read-only preview) - sama persis dengan admin tapi endpoint owner
router.get('/category/:kategori', authenticateToken, ownerOnly, async (req, res) => {
  try {
    console.log('🏷️ GET /owner/data-sewa/category/:kategori - Request received');
    const { kategori } = req.params;
    const dataSewa = new DataSewa();
    const data = await dataSewa.getByCategory(kategori);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching owner rental data by category:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sewa berdasarkan kategori'
    });
  }
});

// Get rental data by ID (read-only preview) - sama persis dengan admin tapi endpoint owner
router.get('/:id', authenticateToken, ownerOnly, async (req, res) => {
  try {
    console.log('🔍 GET /owner/data-sewa/:id - Request received');
    const { id } = req.params;
    const dataSewa = new DataSewa();
    const data = await dataSewa.getById(id);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data sewa tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching owner rental data by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sewa'
    });
  }
});

// Get statistics (read-only preview) - sama persis dengan admin tapi endpoint owner
router.get('/statistics/overview', authenticateToken, ownerOnly, async (req, res) => {
  try {
    console.log('📊 GET /owner/data-sewa/statistics/overview - Request received');
    const dataSewa = new DataSewa();
    const stats = await dataSewa.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching owner statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik data sewa'
    });
  }
});

// Search rental data (read-only preview) - sama persis dengan admin tapi endpoint owner
router.get('/search', authenticateToken, ownerOnly, async (req, res) => {
  try {
    console.log('🔍 GET /owner/data-sewa/search - Request received');
    const { q } = req.query;
    const dataSewa = new DataSewa();
    const data = await dataSewa.search(q);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error searching owner rental data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mencari data sewa'
    });
  }
});

// Export rental data (read-only preview) - sama persis dengan admin tapi endpoint owner
router.get('/export/:format', authenticateToken, ownerOnly, async (req, res) => {
  try {
    console.log('📤 GET /owner/data-sewa/export/:format - Request received');
    const { format } = req.params;
    const dataSewa = new DataSewa();
    
    if (format === 'pdf') {
      const pdfBuffer = await dataSewa.exportToPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=data-sewa.pdf');
      res.send(pdfBuffer);
    } else if (format === 'excel') {
      const excelBuffer = await dataSewa.exportToExcel();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=data-sewa.xlsx');
      res.send(excelBuffer);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Format tidak didukung'
      });
    }
  } catch (error) {
    console.error('Error exporting owner rental data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengekspor data sewa'
    });
  }
});

module.exports = router;
