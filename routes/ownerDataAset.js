const express = require('express');
const router = express.Router();
const { DataAset, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

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

// GET /api/owner/data-aset - Ambil semua data aset (read-only preview)
router.get('/', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      kategori,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      status_deleted: false
    };

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { nama_aset: { [Op.like]: searchTerm } },
        { merk_kendaraan: { [Op.like]: searchTerm } },
        { nama_barang: { [Op.like]: searchTerm } },
        { atas_nama: { [Op.like]: searchTerm } },
        { penanggung_jawab: { [Op.like]: searchTerm } },
        { lokasi: { [Op.like]: searchTerm } }
      ];
    }

    // Add kategori filter if provided
    if (kategori && kategori.trim()) {
      whereClause.kategori = kategori.trim();
    }

    const dataAset = await DataAset.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        items: dataAset.rows,
        totalItems: dataAset.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(dataAset.count / limit),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching data aset:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/owner/data-aset/:id - Ambil data aset berdasarkan ID (read-only preview)
router.get('/:id', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const dataAset = await DataAset.findOne({
      where: {
        id: id,
        status_deleted: false
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        }
      ]
    });

    if (!dataAset) {
      return res.status(404).json({
        success: false,
        message: 'Data aset tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: dataAset
    });
  } catch (error) {
    console.error('Error fetching data aset by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/owner/data-aset/category/:category - Ambil data aset berdasarkan kategori (read-only preview)
router.get('/category/:category', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const dataAset = await DataAset.findAndCountAll({
      where: {
        kategori: category,
        status_deleted: false
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        items: dataAset.rows,
        totalItems: dataAset.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(dataAset.count / limit),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching data aset by category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/owner/data-aset/statistics/overview - Ambil statistik data aset (read-only preview)
router.get('/statistics/overview', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const totalAset = await DataAset.count({
      where: { status_deleted: false }
    });

    const kategoriStats = await DataAset.findAll({
      attributes: [
        'kategori',
        [DataAset.sequelize.fn('COUNT', DataAset.sequelize.col('id')), 'count']
      ],
      where: { status_deleted: false },
      group: ['kategori'],
      raw: true
    });

    const recentAset = await DataAset.findAll({
      where: { status_deleted: false },
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'nama_aset', 'merk_kendaraan', 'nama_barang', 'kategori', 'created_at']
    });

    res.json({
      success: true,
      data: {
        totalAset,
        kategoriStats,
        recentAset
      }
    });
  } catch (error) {
    console.error('Error fetching data aset statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/owner/data-aset/category-summary - Ambil ringkasan per kategori (read-only preview)
router.get('/category-summary', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const kategoriSummary = await DataAset.findAll({
      attributes: [
        'kategori',
        [DataAset.sequelize.fn('COUNT', DataAset.sequelize.col('id')), 'count'],
        [DataAset.sequelize.fn('MAX', DataAset.sequelize.col('created_at')), 'lastCreated'],
        [DataAset.sequelize.fn('MAX', DataAset.sequelize.col('updated_at')), 'lastUpdated']
      ],
      where: { status_deleted: false },
      group: ['kategori'],
      order: [[DataAset.sequelize.fn('COUNT', DataAset.sequelize.col('id')), 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: kategoriSummary
    });
  } catch (error) {
    console.error('Error fetching category summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/owner/data-aset/export/:format - Export data aset (read-only preview)
router.get('/export/:format', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { format } = req.params;
    const { kategori } = req.query;

    let whereClause = { status_deleted: false };
    if (kategori && kategori.trim()) {
      whereClause.kategori = kategori.trim();
    }

    const dataAset = await DataAset.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['nama', 'username']
        }
      ],
      order: [['kategori', 'ASC'], ['created_at', 'DESC']]
    });

    if (format === 'pdf') {
      // For now, return JSON data. PDF generation can be implemented later
      res.json({
        success: true,
        message: 'PDF export feature will be implemented soon',
        data: dataAset
      });
    } else {
      res.json({
        success: true,
        data: dataAset
      });
    }
  } catch (error) {
    console.error('Error exporting data aset:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;