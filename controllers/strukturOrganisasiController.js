const { StrukturOrganisasi } = require('../models');
const { sequelize } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Alternative import method - initialize with sequelize
const StrukturOrganisasiModel = require('../models/StrukturOrganisasi')(sequelize);

// Configure multer for struktur organisasi uploads
const strukturStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const strukturDir = path.join(__dirname, '../uploads/struktur-organisasi');
    if (!fs.existsSync(strukturDir)) {
      fs.mkdirSync(strukturDir, { recursive: true });
    }
    cb(null, strukturDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'struktur-' + uniqueSuffix + ext);
  }
});

const strukturUpload = multer({
  storage: strukturStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Get all struktur organisasi
const getAllStruktur = async (req, res) => {
  try {
    const [results] = await sequelize.query(
      'SELECT * FROM struktur_organisasi ORDER BY created_at DESC LIMIT 1',
      { type: sequelize.QueryTypes.SELECT }
    );
    const struktur = results;
    

    res.json({
      success: true,
      data: struktur
    });
  } catch (error) {
    console.error('❌ Error getting struktur organisasi:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data struktur organisasi',
      error: error.message
    });
  }
};

// Get struktur by ID
const getStrukturById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 ===== GET STRUKTUR BY ID =====', id);
    
    const struktur = await StrukturOrganisasi.findByPk(id);

    if (!struktur) {
      return res.status(404).json({
        success: false,
        message: 'Struktur organisasi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: struktur
    });
  } catch (error) {
    console.error('❌ Error getting struktur by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data struktur organisasi',
      error: error.message
    });
  }
};

// Create new struktur
const createStruktur = async (req, res) => {
  try {
    const { judul, deskripsi } = req.body;
    const userId = req.user?.id;
    let foto = null;

    // Handle uploaded file
    if (req.file) {
      const relativePath = path.relative(
        path.join(__dirname, '../uploads'),
        req.file.path
      );
      foto = relativePath.replace(/\\/g, '/');
    }

    // Use raw query for now
    const [results] = await sequelize.query(
      'INSERT INTO struktur_organisasi (judul, deskripsi, foto, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      {
        replacements: [judul, deskripsi, foto, userId, userId],
        type: sequelize.QueryTypes.INSERT
      }
    );


    res.status(201).json({
      success: true,
      message: 'Struktur organisasi berhasil dibuat',
      data: {
        id: results,
        judul,
        deskripsi,
        foto,
        created_by: userId,
        updated_by: userId
      }
    });
  } catch (error) {
    console.error('❌ Error creating struktur:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat struktur organisasi',
      error: error.message
    });
  }
};

// Update struktur
const updateStruktur = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, deskripsi } = req.body;
    const userId = req.user?.id;
    let foto = null;

    // Handle uploaded file
    if (req.file) {
      const relativePath = path.relative(
        path.join(__dirname, '../uploads'),
        req.file.path
      );
      foto = relativePath.replace(/\\/g, '/');
    }

    // Check if struktur exists
    const [existing] = await sequelize.query(
      'SELECT * FROM struktur_organisasi WHERE id = ?',
      {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Struktur organisasi tidak ditemukan'
      });
    }

    // Update struktur
    if (foto) {
      // Update with new foto
      await sequelize.query(
        'UPDATE struktur_organisasi SET judul = ?, deskripsi = ?, foto = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        {
          replacements: [judul, deskripsi, foto, userId, id],
          type: sequelize.QueryTypes.UPDATE
        }
      );
    } else {
      // Update without changing foto
      await sequelize.query(
        'UPDATE struktur_organisasi SET judul = ?, deskripsi = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        {
          replacements: [judul, deskripsi, userId, id],
          type: sequelize.QueryTypes.UPDATE
        }
      );
    }


    res.json({
      success: true,
      message: 'Struktur organisasi berhasil diperbarui',
      data: {
        id: parseInt(id),
        judul,
        deskripsi,
        foto: foto || existing.foto,
        updated_by: userId
      }
    });
  } catch (error) {
    console.error('❌ Error updating struktur:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui struktur organisasi',
      error: error.message
    });
  }
};

// Delete struktur
const deleteStruktur = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 ===== DELETE STRUKTUR ORGANISASI =====', id);

    const struktur = await StrukturOrganisasi.findByPk(id);

    if (!struktur) {
      return res.status(404).json({
        success: false,
        message: 'Struktur organisasi tidak ditemukan'
      });
    }

    await struktur.destroy();

    console.log('✅ Struktur deleted successfully:', id);

    res.json({
      success: true,
      message: 'Struktur organisasi berhasil dihapus'
    });
  } catch (error) {
    console.error('❌ Error deleting struktur:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus struktur organisasi',
      error: error.message
    });
  }
};

module.exports = {
  getAllStruktur,
  getStrukturById,
  createStruktur,
  updateStruktur,
  deleteStruktur,
  strukturUpload
};
