const express = require('express');
const router = express.Router();
const DataSewa = require('../models/DataSewa');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/data-sewa/');
    // Pastikan folder tujuan ada, jika belum ada maka buat otomatis
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
    } catch (err) {
      // Jika gagal membuat folder, kembalikan error ke multer
      return cb(err);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'data-sewa-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    // tingkatkan batas ukuran untuk mengakomodasi video dan dokumen besar (contoh: 100MB)
    fileSize: 1000 * 10024 * 10024
  },
  fileFilter: (req, file, cb) => {
    // dukung gambar, pdf, dokumen office, txt, dan sebagian video umum
    const allowedExt = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|mp4|mov|avi|mkv|webm/;
    const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
    const allowedMime = /image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument|application\/vnd\.ms-|text\/plain|video\//;
    const mimetype = allowedMime.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed: images, pdf, office docs, txt, video.'));
    }
  }
});

// Get all rental data
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 GET /admin/data-sewa - Request received');
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
    console.error('❌ Error fetching rental data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sewa'
    });
  }
});

// Get categories
router.get('/categories/list', authenticateToken, async (req, res) => {
  try {
    console.log('📂 GET /admin/data-sewa/categories/list - Request received');
    const dataSewa = new DataSewa();
    const categories = await dataSewa.getCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar kategori'
    });
  }
});

// Get rental data by category
router.get('/category/:kategori', authenticateToken, async (req, res) => {
  try {
    console.log('🏷️ GET /admin/data-sewa/category/:kategori - Request received');
    const { kategori } = req.params;
    const dataSewa = new DataSewa();
    const data = await dataSewa.getByCategory(kategori);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching rental data by category:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sewa berdasarkan kategori'
    });
  }
});

// Get rental data by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /admin/data-sewa/:id - Request received');
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
    console.error('Error fetching rental data by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sewa'
    });
  }
});

// Create new rental data (dukung foto_aset dan lampiran multiple)
router.post('/', authenticateToken, upload.fields([
  { name: 'foto_aset', maxCount: 1 },
  { name: 'lampiran', maxCount: 50 }
]), async (req, res) => {
  try {
    console.log('🚀 POST /admin/data-sewa - Request received');
    console.log('📝 Request body:', req.body);
    console.log('📁 Files uploaded:', req.files);
    console.log('👤 User:', req.user);
    
    const {
      nama_aset,
      jenis_aset,
      jangka_waktu_sewa,
      harga_sewa,
      nama_pemilik,
      no_hp_pemilik,
      alamat_pemilik,
      mulai_sewa,
      berakhir_sewa,
      penanggung_jawab_pajak,
      kategori_sewa,
      keterangan
    } = req.body;

    // Validate required fields
    console.log('🔍 Validating fields...');
    if (!nama_aset || !jenis_aset || !jangka_waktu_sewa || !harga_sewa || 
        !nama_pemilik || !no_hp_pemilik || !alamat_pemilik || !mulai_sewa || 
        !berakhir_sewa || !kategori_sewa) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi'
      });
    }
    console.log('✅ Validation passed');

    const dataSewa = new DataSewa();
    console.log('📊 Creating sewa data...');
    // Kumpulkan semua filename dari foto_aset dan lampiran, simpan sebagai JSON array di kolom foto_aset
    const filenames = [];
    if (req.files) {
      if (req.files.foto_aset && req.files.foto_aset[0]) filenames.push(req.files.foto_aset[0].filename);
      if (req.files.lampiran && Array.isArray(req.files.lampiran)) {
        for (const f of req.files.lampiran) filenames.push(f.filename);
      }
    }
    const sewaData = {
      nama_aset,
      jenis_aset,
      jangka_waktu_sewa, // Now VARCHAR, no parsing needed
      harga_sewa, // Now VARCHAR, no parsing needed
      nama_pemilik,
      no_hp_pemilik,
      alamat_pemilik,
      mulai_sewa,
      berakhir_sewa,
      penanggung_jawab_pajak,
      foto_aset: filenames.length ? JSON.stringify(filenames) : null,
      kategori_sewa,
      keterangan,
      created_by: req.user.id
    };

    console.log('💾 Saving to database...');
    const id = await dataSewa.create(sewaData);
    console.log('✅ Data saved with ID:', id);
    
    const uploadedLampiran = filenames;
    res.status(201).json({
      success: true,
      message: 'Data sewa berhasil dibuat',
      data: { id, lampiran: uploadedLampiran }
    });
  } catch (error) {
    console.error('❌ Error creating rental data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat data sewa'
    });
  }
});

// Upload lampiran
router.post('/:id/upload', authenticateToken, upload.array('lampiran', 50), async (req, res) => {
  try {
    console.log('📁 POST /admin/data-sewa/:id/upload - Request received');
    const { id } = req.params;
    const uploadedLampiran = req.files.map(f => f.filename);
    res.json({
      success: true,
      message: 'Lampiran berhasil diupload',
      data: uploadedLampiran
    });
  } catch (error) {
    console.error('❌ Error uploading lampiran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupload lampiran'
    });
  }
});

// Delete lampiran
router.delete('/:id/lampiran/:filename', authenticateToken, async (req, res) => {
  try {
    console.log('🗑️ DELETE /admin/data-sewa/:id/lampiran/:filename - Request received');
    const { id, filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/data-sewa/', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'Lampiran berhasil dihapus'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Lampiran tidak ditemukan'
      });
    }
  } catch (error) {
    console.error('❌ Error deleting lampiran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus lampiran'
    });
  }
});

// Update rental data (dukung foto_aset dan lampiran multiple)
router.put('/:id', authenticateToken, upload.fields([
  { name: 'foto_aset', maxCount: 1 },
  { name: 'lampiran', maxCount: 50 }
]), async (req, res) => {
  try {
    console.log('🔄 PUT /admin/data-sewa/:id - Request received');
    const { id } = req.params;
    const {
      nama_aset,
      jenis_aset,
      jangka_waktu_sewa,
      harga_sewa,
      nama_pemilik,
      no_hp_pemilik,
      alamat_pemilik,
      mulai_sewa,
      berakhir_sewa,
      penanggung_jawab_pajak,
      kategori_sewa,
      keterangan
    } = req.body;

    // Validate required fields
    console.log('🔍 Validating fields for update...');
    if (!nama_aset || !jenis_aset || !jangka_waktu_sewa || !harga_sewa || 
        !nama_pemilik || !no_hp_pemilik || !alamat_pemilik || !mulai_sewa || 
        !berakhir_sewa || !kategori_sewa) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi'
      });
    }
    console.log('✅ Validation passed');

    const dataSewa = new DataSewa();
    console.log('📊 Updating sewa data...');
    // Kumpulkan semua filename upload baru
    const filenames = [];
    if (req.files) {
      if (req.files.foto_aset && req.files.foto_aset[0]) filenames.push(req.files.foto_aset[0].filename);
      if (req.files.lampiran && Array.isArray(req.files.lampiran)) {
        for (const f of req.files.lampiran) filenames.push(f.filename);
      }
    }
    const sewaData = {
      nama_aset,
      jenis_aset,
      jangka_waktu_sewa, // Now VARCHAR, no parsing needed
      harga_sewa, // Now VARCHAR, no parsing needed
      nama_pemilik,
      no_hp_pemilik,
      alamat_pemilik,
      mulai_sewa,
      berakhir_sewa,
      penanggung_jawab_pajak,
      foto_aset: filenames.length ? JSON.stringify(filenames) : req.body.foto_aset_existing,
      kategori_sewa,
      keterangan
    };

    console.log('💾 Updating database...');
    const updated = await dataSewa.update(id, sewaData);
    
    if (!updated) {
      console.log('❌ Data not found for update');
      return res.status(404).json({
        success: false,
        message: 'Data sewa tidak ditemukan'
      });
    }
    
    console.log('✅ Data updated successfully');
    const uploadedLampiran = (req.files && req.files.lampiran) ? req.files.lampiran.map(f => f.filename) : [];
    res.json({
      success: true,
      message: 'Data sewa berhasil diupdate',
      data: { lampiran: uploadedLampiran }
    });
  } catch (error) {
    console.error('❌ Error updating rental data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data sewa'
    });
  }
});

// Delete rental data
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🗑️ DELETE /admin/data-sewa/:id - Request received');
    const { id } = req.params;
    const dataSewa = new DataSewa();
    const deleted = await dataSewa.delete(id);
    
    if (!deleted) {
      console.log('❌ Data not found for deletion');
      return res.status(404).json({
        success: false,
        message: 'Data sewa tidak ditemukan'
      });
    }
    
    console.log('✅ Data deleted successfully');
    res.json({
      success: true,
      message: 'Data sewa berhasil dihapus'
    });
  } catch (error) {
    console.error('❌ Error deleting rental data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data sewa'
    });
  }
});

module.exports = router;