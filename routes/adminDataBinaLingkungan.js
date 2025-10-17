const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { sequelize } = require('../config/database');
const DataBinaLingkungan = require('../models/DataBinaLingkungan');
const { authenticateToken } = require('../middleware/auth');

// Helper aman untuk membaca kolom lampiran (bisa null/string/array)
const parseLampiranField = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  // Jika tipe lain (object), abaikan dan kembalikan array kosong
  return [];
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/data-bina-lingkungan';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `bina-lingkungan-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

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

// Get unique locations
router.get('/locations/list', authenticateToken, async (req, res) => {
  try {
    const locations = await DataBinaLingkungan.findAll({
      attributes: [
        'lokasi',
        [sequelize.fn('MAX', sequelize.col('updated_at')), 'latest_updated_at'],
        [sequelize.fn('MAX', sequelize.col('created_at')), 'latest_created_at'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { status_deleted: false },
      group: ['lokasi'],
      order: [[sequelize.fn('MAX', sequelize.col('updated_at')), 'DESC']]
    });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat lokasi'
    });
  }
});

// Get data by location
router.get('/location/:lokasi', authenticateToken, async (req, res) => {
  try {
    const { lokasi } = req.params;
    const data = await DataBinaLingkungan.findAll({
      where: { lokasi, status_deleted: false },
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching data by location:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data berdasarkan lokasi'
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

// Upload lampiran
router.post('/:id/lampiran', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }

    const data = await DataBinaLingkungan.findOne({
      where: { id, status_deleted: false }
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }

    // Prepare file data
    const fileData = req.files.map(file => ({
      originalName: file.originalname,
      storedName: file.filename,
      stored_name: file.filename, // kompatibilitas legacy
      path: file.path,
      mimeType: file.mimetype,
      size: file.size
    }));

    // Get existing lampiran (aman untuk berbagai tipe)
    let existingLampiran = parseLampiranField(data.lampiran);

    // Add new files to existing ones
    const updatedLampiran = [...existingLampiran, ...fileData];

    // Update the data with new lampiran
    await data.update({
      lampiran: JSON.stringify(updatedLampiran)
    });

    res.json({
      success: true,
      message: 'Lampiran berhasil diupload',
      data: fileData
    });
  } catch (error) {
    console.error('Error uploading lampiran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupload lampiran'
    });
  }
});

// Get lampiran
router.get('/:id/lampiran', authenticateToken, async (req, res) => {
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

    let lampiran = parseLampiranField(data.lampiran);

    res.json({
      success: true,
      data: lampiran
    });
  } catch (error) {
    console.error('Error fetching lampiran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil lampiran'
    });
  }
});

// Delete lampiran
router.delete('/:id/lampiran', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { stored_name, storedName } = req.body;

    if (!stored_name && !storedName) {
      return res.status(400).json({
        success: false,
        message: 'stored_name atau storedName diperlukan'
      });
    }

    const data = await DataBinaLingkungan.findOne({
      where: { id, status_deleted: false }
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }

    let lampiran = parseLampiranField(data.lampiran);

    // Find and remove the file
    const targetName = stored_name || storedName;
    const fileIndex = lampiran.findIndex(file => (file.stored_name === targetName) || (file.storedName === targetName));
    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan'
      });
    }

    const fileToDelete = lampiran[fileIndex];
    
    // Delete physical file
    const filePath = fileToDelete.path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from array
    lampiran.splice(fileIndex, 1);

    // Update database
    await data.update({
      lampiran: JSON.stringify(lampiran)
    });

    res.json({
      success: true,
      message: 'Lampiran berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting lampiran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus lampiran'
    });
  }
});

module.exports = router;
