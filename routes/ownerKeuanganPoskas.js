const express = require('express');
const router = express.Router();
const KeuanganPoskas = require('../models/KeuanganPoskas');
const { authenticateToken } = require('../middleware/auth');

// Get all keuangan poskas (owner only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getAll();
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by user ID (owner only)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getByUserId(userId);
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas by user ID for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by date range (owner only)
router.get('/date-range/:startDate/:endDate', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getByDateRange(startDate, endDate);
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas by date range for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by month (owner only)
router.get('/month/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getByMonth(year, month);
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas by month for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by ID for detail (owner only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getById(id);
    
    if (!keuanganPoskas) {
      return res.status(404).json({
        success: false,
        message: 'Keuangan POSKAS not found'
      });
    }
    
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas by ID for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get monthly summary statistics (owner only)
router.get('/stats/monthly/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const monthlyData = await KeuanganPoskas.getByMonth(year, month);
    
    // Calculate statistics
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let jumlahTransaksi = monthlyData.length;
    
    monthlyData.forEach(item => {
      if (item.jenis_transaksi === 'pemasukan') {
        totalPemasukan += parseFloat(item.jumlah || 0);
      } else if (item.jenis_transaksi === 'pengeluaran') {
        totalPengeluaran += parseFloat(item.jumlah || 0);
      }
    });
    
    const saldoBersih = totalPemasukan - totalPengeluaran;
    
    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        total_pemasukan: totalPemasukan,
        total_pengeluaran: totalPengeluaran,
        saldo_bersih: saldoBersih,
        jumlah_transaksi: jumlahTransaksi,
        detail_transaksi: monthlyData
      }
    });
  } catch (error) {
    console.error('Error getting monthly stats for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get yearly summary (owner only)
router.get('/stats/yearly/:year', authenticateToken, async (req, res) => {
  try {
    const { year } = req.params;
    
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const yearlyData = await KeuanganPoskas.getByYear(year);
    
    // Calculate yearly statistics
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let jumlahTransaksi = yearlyData.length;
    
    // Group by month for monthly breakdown
    const monthlyBreakdown = {};
    
    yearlyData.forEach(item => {
      const month = new Date(item.tanggal).getMonth() + 1; // 1-12
      
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = {
          pemasukan: 0,
          pengeluaran: 0,
          transaksi: 0
        };
      }
      
      if (item.jenis_transaksi === 'pemasukan') {
        totalPemasukan += parseFloat(item.jumlah || 0);
        monthlyBreakdown[month].pemasukan += parseFloat(item.jumlah || 0);
      } else if (item.jenis_transaksi === 'pengeluaran') {
        totalPengeluaran += parseFloat(item.jumlah || 0);
        monthlyBreakdown[month].pengeluaran += parseFloat(item.jumlah || 0);
      }
      
      monthlyBreakdown[month].transaksi++;
    });
    
    const saldoBersih = totalPemasukan - totalPengeluaran;
    
    res.json({
      success: true,
      data: {
        year: parseInt(year),
        total_pemasukan: totalPemasukan,
        total_pengeluaran: totalPengeluaran,
        saldo_bersih: saldoBersih,
        jumlah_transaksi: jumlahTransaksi,
        monthly_breakdown: monthlyBreakdown
      }
    });
  } catch (error) {
    console.error('Error getting yearly stats for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
