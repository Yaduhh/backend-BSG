const express = require('express');
const router = express.Router();
const { DataAset, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/owner/data-aset - Ambil semua data aset dengan pagination (read-only)
router.get('/', authenticateToken, async (req, res) => {
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
    if (kategori && kategori !== 'all') {
      whereClause.kategori = kategori;
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

    // Get statistics
    const totalAset = await DataAset.count({ where: { status_deleted: false } });
    const totalProperti = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: 'PROPERTI'
      } 
    });
    const totalKendaraan = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: {
          [Op.in]: ['KENDARAAN_PRIBADI', 'KENDARAAN_OPERASIONAL', 'KENDARAAN_DISTRIBUSI']
        }
      } 
    });
    const totalElektronik = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: 'ELEKTRONIK'
      } 
    });

    res.json({
      success: true,
      data: {
        items: dataAset.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(dataAset.count / limit),
          totalItems: dataAset.count,
          itemsPerPage: parseInt(limit)
        },
        statistics: {
          totalAset,
          totalProperti,
          totalKendaraan,
          totalElektronik
        }
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

// GET /api/owner/data-aset/:id - Ambil detail data aset berdasarkan ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const dataAset = await DataAset.findOne({
      where: { 
        id: parseInt(id),
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

// GET /api/owner/data-aset/category/:category - Filter berdasarkan kategori
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;

    const whereClause = {
      status_deleted: false
    };

    if (category === 'kendaraan') {
      whereClause.kategori = {
        [Op.in]: ['KENDARAAN_PRIBADI', 'KENDARAAN_OPERASIONAL', 'KENDARAAN_DISTRIBUSI']
      };
    } else {
      whereClause.kategori = category.toUpperCase();
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
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        items: dataAset.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(dataAset.count / limit),
          totalItems: dataAset.count,
          itemsPerPage: parseInt(limit)
        }
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

// GET /api/owner/data-aset/statistics/overview - Get statistics
router.get('/statistics/overview', authenticateToken, async (req, res) => {
  try {
    const totalAset = await DataAset.count({ where: { status_deleted: false } });
    const totalProperti = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: 'PROPERTI'
      } 
    });
    const totalKendaraan = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: {
          [Op.in]: ['KENDARAAN_PRIBADI', 'KENDARAAN_OPERASIONAL', 'KENDARAAN_DISTRIBUSI']
        }
      } 
    });
    const totalElektronik = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: 'ELEKTRONIK'
      } 
    });

    // Get recent additions
    const recentAset = await DataAset.findAll({
      where: { status_deleted: false },
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalAset,
          totalProperti,
          totalKendaraan,
          totalElektronik
        },
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

module.exports = router;
