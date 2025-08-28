const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const DataBinaLingkungan = require('../models/DataBinaLingkungan');
const { authenticateToken } = require('../middleware/auth');

// Get all data bina lingkungan
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', lokasi = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { status_deleted: false };
    
    if (search) {
      whereClause = {
        ...whereClause,
        [sequelize.Op.or]: [
          { nama: { [sequelize.Op.like]: `%${search}%` } },
          { jabatan: { [sequelize.Op.like]: `%${search}%` } },
          { lokasi: { [sequelize.Op.like]: `%${search}%` } }
        ]
      };
    }

    if (lokasi) {
      whereClause.lokasi = lokasi;
    }

    const { count, rows } = await DataBinaLingkungan.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        items: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching data bina lingkungan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data bina lingkungan'
    });
  }
});

// Get data by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await DataBinaLingkungan.findOne({
      where: { id, status_deleted: false }
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching data bina lingkungan by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data'
    });
  }
});

// Create new data
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { lokasi, jabatan, nama, no_hp, alamat, nominal } = req.body;

    if (!lokasi || !jabatan || !nama || !no_hp || !alamat || !nominal) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }

    const newData = await DataBinaLingkungan.create({
      lokasi,
      jabatan,
      nama,
      no_hp,
      alamat,
      nominal
    });

    res.status(201).json({
      success: true,
      message: 'Data bina lingkungan berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Error creating data bina lingkungan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data'
    });
  }
});

// Update data
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { lokasi, jabatan, nama, no_hp, alamat, nominal } = req.body;

    const data = await DataBinaLingkungan.findOne({
      where: { id, status_deleted: false }
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }

    await data.update({
      lokasi,
      jabatan,
      nama,
      no_hp,
      alamat,
      nominal
    });

    res.json({
      success: true,
      message: 'Data bina lingkungan berhasil diupdate',
      data
    });
  } catch (error) {
    console.error('Error updating data bina lingkungan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data'
    });
  }
});

// Delete data (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await DataBinaLingkungan.findOne({
      where: { id, status_deleted: false }
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }

    await data.update({ status_deleted: true });

    res.json({
      success: true,
      message: 'Data bina lingkungan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting data bina lingkungan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data'
    });
  }
});

// Get unique locations with latest timestamp
router.get('/locations/list', authenticateToken, async (req, res) => {
  try {
    const locations = await DataBinaLingkungan.findAll({
      where: { status_deleted: false },
      attributes: [
        'lokasi',
        [sequelize.fn('MAX', sequelize.col('updated_at')), 'latest_updated_at'],
        [sequelize.fn('MAX', sequelize.col('created_at')), 'latest_created_at']
      ],
      group: ['lokasi'],
      raw: true
    });

    // Transform data to include both location and latest timestamp
    const locationList = locations.map(item => ({
      lokasi: item.lokasi,
      latest_updated_at: item.latest_updated_at,
      latest_created_at: item.latest_created_at
    }));

    res.json({
      success: true,
      data: locationList
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar lokasi'
    });
  }
});

// Get data by location
router.get('/location/:lokasi', authenticateToken, async (req, res) => {
  try {
    const { lokasi } = req.params;
    const data = await DataBinaLingkungan.findAll({
      where: { lokasi, status_deleted: false },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching data by location:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data lokasi'
    });
  }
});

module.exports = router;
