const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AnekaSurat = require('../models/AnekaSurat');
const { authenticateToken } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/aneka-surat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'aneka-surat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file gambar, PDF, dan dokumen yang diperbolehkan!'));
    }
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const data = await AnekaSurat.getAll();
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching aneka surat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data aneka surat'
    });
  }
});

router.get('/document-types', authenticateToken, async (req, res) => {
  try {
    const types = await AnekaSurat.getDocumentTypes();
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Error fetching document types:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil jenis dokumen'
    });
  }
});

// Keep the old endpoint for backward compatibility
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const types = await AnekaSurat.getDocumentTypes();
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Error fetching document types:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil jenis dokumen'
    });
  }
});

router.get('/type/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const data = await AnekaSurat.getByType(type);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching aneka surat by type:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data aneka surat'
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await AnekaSurat.getById(id);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching aneka surat by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data aneka surat'
    });
  }
});

router.post('/', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { jenis_dokumen, judul_dokumen } = req.body;
    const id_user = req.user.id;
    
    if (!jenis_dokumen || !judul_dokumen) {
      return res.status(400).json({
        success: false,
        message: 'Jenis dokumen dan judul dokumen harus diisi'
      });
    }
    
    let lampiran = [];
    if (req.files && req.files.length > 0) {
      lampiran = req.files.map(file => ({
        file_path: `uploads/aneka-surat/${file.filename}`,
        file_name: file.originalname,
        upload_date: new Date().toISOString()
      }));
    }
    
    const insertId = await AnekaSurat.create({
      jenis_dokumen,
      judul_dokumen,
      lampiran: JSON.stringify(lampiran),
      id_user
    });
    
    res.status(201).json({
      success: true,
      message: 'Data aneka surat berhasil ditambahkan',
      data: { id: insertId }
    });
  } catch (error) {
    console.error('Error creating aneka surat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data aneka surat'
    });
  }
});

router.put('/:id', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { jenis_dokumen, judul_dokumen, existing_files } = req.body;
    
    if (!jenis_dokumen || !judul_dokumen) {
      return res.status(400).json({
        success: false,
        message: 'Jenis dokumen dan judul dokumen harus diisi'
      });
    }
    
    let lampiran = [];
    
    if (existing_files) {
      try {
        lampiran = JSON.parse(existing_files);
      } catch (e) {
        lampiran = [];
      }
    }
    
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => ({
        file_path: `uploads/aneka-surat/${file.filename}`,
        file_name: file.originalname,
        upload_date: new Date().toISOString()
      }));
      lampiran = [...lampiran, ...newFiles];
    }
    
    const updated = await AnekaSurat.update(id, {
      jenis_dokumen,
      judul_dokumen,
      lampiran: JSON.stringify(lampiran)
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Data aneka surat berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating aneka surat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data aneka surat'
    });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AnekaSurat.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Data aneka surat berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting aneka surat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data aneka surat'
    });
  }
});

// Download attachment endpoint
router.get('/:id/download/:filename', authenticateToken, async (req, res) => {
  try {
    const { id, filename } = req.params;
    const data = await AnekaSurat.getById(id);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    const filePath = path.join(__dirname, '../uploads/aneka-surat', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan'
      });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengunduh file'
    });
  }
});

module.exports = router;
