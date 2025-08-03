const express = require('express');
const router = express.Router();
const KeuanganPoskas = require('../models/KeuanganPoskas');
const { authenticateToken } = require('../middleware/auth');

// Get all keuangan poskas (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getAll();
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by user ID
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is admin or accessing their own data
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getByUserId(userId);
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas by user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by date range
router.get('/date-range/:startDate/:endDate', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getByDateRange(startDate, endDate);
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by month
router.get('/month/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getByMonth(year, month);
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas by month:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search keuangan poskas
router.get('/search/:searchTerm', authenticateToken, async (req, res) => {
  try {
    const { searchTerm } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.search(searchTerm);
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error searching keuangan poskas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get summary/statistics
router.get('/summary/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const summary = await KeuanganPoskas.getSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting keuangan poskas summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by ID (harus di akhir karena catch-all)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const keuanganPoskas = await KeuanganPoskas.getById(id);
    
    if (!keuanganPoskas) {
      return res.status(404).json({
        success: false,
        message: 'Keuangan poskas not found'
      });
    }

    // Check if user is admin or the owner of the data
    if (req.user.role !== 'admin' && req.user.id !== keuanganPoskas.id_user) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new keuangan poskas
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tanggal_poskas, isi_poskas } = req.body;
    
    // Validate required fields
    if (!tanggal_poskas || !isi_poskas) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal poskas and isi poskas are required'
      });
    }

    const data = {
      id_user: req.user.id,
      tanggal_poskas,
      isi_poskas
    };

    const newKeuanganPoskas = await KeuanganPoskas.create(data);
    
    res.status(201).json({
      success: true,
      message: 'Keuangan poskas created successfully',
      data: newKeuanganPoskas
    });
  } catch (error) {
    console.error('Error creating keuangan poskas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update keuangan poskas
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal_poskas, isi_poskas } = req.body;
    
    // Validate required fields
    if (!tanggal_poskas || !isi_poskas) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal poskas and isi poskas are required'
      });
    }

    // Check if keuangan poskas exists and user has permission
    const existingKeuanganPoskas = await KeuanganPoskas.getById(id);
    if (!existingKeuanganPoskas) {
      return res.status(404).json({
        success: false,
        message: 'Keuangan poskas not found'
      });
    }

    // Check if user is admin or the owner of the data
    if (req.user.role !== 'admin' && req.user.id !== existingKeuanganPoskas.id_user) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedData = {
      tanggal_poskas,
      isi_poskas
    };

    const updatedKeuanganPoskas = await KeuanganPoskas.update(id, updatedData);
    
    res.json({
      success: true,
      message: 'Keuangan poskas updated successfully',
      data: updatedKeuanganPoskas
    });
  } catch (error) {
    console.error('Error updating keuangan poskas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete keuangan poskas (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if keuangan poskas exists and user has permission
    const existingKeuanganPoskas = await KeuanganPoskas.getById(id);
    if (!existingKeuanganPoskas) {
      return res.status(404).json({
        success: false,
        message: 'Keuangan poskas not found'
      });
    }

    // Check if user is admin or the owner of the data
    if (req.user.role !== 'admin' && req.user.id !== existingKeuanganPoskas.id_user) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await KeuanganPoskas.delete(id);
    
    res.json({
      success: true,
      message: 'Keuangan poskas deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting keuangan poskas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 