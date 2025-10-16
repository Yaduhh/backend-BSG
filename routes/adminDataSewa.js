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

// Multer config: izinkan gambar, video, dan dokumen umum, dengan limit lebih besar (50MB)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB per file
  },
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype || '';
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');
    const isPdf = mime.includes('pdf');
    const isDoc = mime.includes('msword') || mime.includes('officedocument');
    const isSheet = mime.includes('spreadsheet');
    const isPresentation = mime.includes('presentation');
    const isText = mime.startsWith('text/');

    if (isImage || isVideo || isPdf || isDoc || isSheet || isPresentation || isText) {
      return cb(null, true);
    }
    return cb(new Error('File type not supported for data sewa'));
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

// Create new rental data
// Terima field: 'foto_aset' (single) dan 'lampiran' (multiple) untuk kompatibilitas frontend
router.post('/', authenticateToken, upload.fields([
  { name: 'foto_aset', maxCount: 1 },
  { name: 'lampiran', maxCount: 10 }
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
    // Kumpulkan semua filename dari 'foto_aset' dan 'lampiran'
    const fileNames = [];
    if (req.files && req.files.foto_aset) {
      req.files.foto_aset.forEach(f => fileNames.push(f.filename));
    }
    if (req.files && req.files.lampiran) {
      req.files.lampiran.forEach(f => fileNames.push(f.filename));
    }
    const fotoAsetValue = fileNames.length > 0 ? JSON.stringify(fileNames) : null;
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
      // Simpan semua lampiran sebagai JSON string di kolom foto_aset
      foto_aset: fotoAsetValue,
      kategori_sewa,
      keterangan,
      created_by: req.user.id
    };

    console.log('💾 Saving to database...');
    const id = await dataSewa.create(sewaData);
    console.log('✅ Data saved with ID:', id);
    
    res.status(201).json({
      success: true,
      message: 'Data sewa berhasil dibuat',
      data: { id }
    });
  } catch (error) {
    console.error('❌ Error creating rental data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat data sewa'
    });
  }
});

// Update rental data
router.put('/:id', authenticateToken, upload.fields([
  { name: 'foto_aset', maxCount: 1 },
  { name: 'lampiran', maxCount: 10 }
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
    // Gabungkan file baru; jika tidak ada file baru, pakai existing dari body.
    let fotoAsetValue = null;
    const fileNames = [];
    if (req.files && req.files.foto_aset) {
      req.files.foto_aset.forEach(f => fileNames.push(f.filename));
    }
    if (req.files && req.files.lampiran) {
      req.files.lampiran.forEach(f => fileNames.push(f.filename));
    }
    if (fileNames.length > 0) {
      fotoAsetValue = JSON.stringify(fileNames);
    } else if (typeof req.body.foto_aset_existing !== 'undefined') {
      // Tetap simpan apa adanya (bisa single filename atau JSON array string)
      fotoAsetValue = req.body.foto_aset_existing || null;
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
      foto_aset: fotoAsetValue,
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
    res.json({
      success: true,
      message: 'Data sewa berhasil diupdate'
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