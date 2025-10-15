const express = require('express');
const router = express.Router();
const { DataAset, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware untuk memastikan hanya admin yang bisa akses
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/data-aset');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allow image, video, PDF, and document files
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|mp4|avi|mov|wmv|flv|mkv|webm)$/i;
    const allowedMimeTypes = /^(image\/|video\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|text\/)/;
    
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, video, PDF, and document files are allowed!'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// GET /api/admin/data-aset - Ambil semua data aset dengan pagination
router.get('/', authenticateToken, adminOnly, async (req, res) => {
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

    // Parse lampiran JSON for each item
    const itemsWithParsedLampiran = dataAset.rows.map(item => {
      const itemData = item.toJSON();
      if (itemData.lampiran) {
        try {
          // Check if it's already a JSON string or old text format
          if (itemData.lampiran.startsWith('[') || itemData.lampiran.startsWith('{')) {
            itemData.lampiran = JSON.parse(itemData.lampiran);
          } else {
            // Old format like "FOTO, FILE, VIDEO" - convert to empty array
            itemData.lampiran = [];
          }
        } catch (error) {
          console.error('Error parsing lampiran:', error);
          itemData.lampiran = [];
        }
      }
      return itemData;
    });

    res.json({
      success: true,
      data: {
        items: itemsWithParsedLampiran,
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
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/admin/data-aset/:id - Ambil detail data aset berdasarkan ID
router.get('/:id', authenticateToken, adminOnly, async (req, res) => {
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

    // Parse lampiran JSON
    const dataAsetData = dataAset.toJSON();
    if (dataAsetData.lampiran) {
      try {
        // Check if it's already a JSON string or old text format
        if (dataAsetData.lampiran.startsWith('[') || dataAsetData.lampiran.startsWith('{')) {
          dataAsetData.lampiran = JSON.parse(dataAsetData.lampiran);
        } else {
          // Old format like "FOTO, FILE, VIDEO" - convert to empty array
          dataAsetData.lampiran = [];
        }
      } catch (error) {
        console.error('Error parsing lampiran:', error);
        dataAsetData.lampiran = [];
      }
    }

    res.json({
      success: true,
      data: dataAsetData
    });
  } catch (error) {
    console.error('Error fetching data aset detail:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/admin/data-aset - Tambah data aset baru
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const {
      nama_aset,
      merk_kendaraan,
      nama_barang,
      kategori,
      no_sertifikat,
      lokasi,
      atas_nama,
      data_pembelian,
      status,
      data_pbb,
      plat_nomor,
      nomor_mesin,
      nomor_rangka,
      pajak_berlaku,
      stnk_berlaku,
      estimasi_pembayaran_pajak,
      terakhir_service,
      jadwal_service_berikutnya,
      asuransi_pakai,
      jenis_asuransi,
      asuransi_berlaku,
      penanggung_jawab,
      merk,
      model,
      serial_number,
      tahun_pembelian,
      lampiran
    } = req.body;

    // Validasi kategori
    const validKategori = ['PROPERTI', 'KENDARAAN_PRIBADI', 'KENDARAAN_OPERASIONAL', 'KENDARAAN_DISTRIBUSI', 'ELEKTRONIK'];
    if (!validKategori.includes(kategori)) {
      return res.status(400).json({
        success: false,
        message: 'Kategori tidak valid'
      });
    }

    // Validasi berdasarkan kategori
    if (kategori === 'PROPERTI' && !nama_aset) {
      return res.status(400).json({
        success: false,
        message: 'Nama aset wajib diisi untuk kategori PROPERTI'
      });
    }

    if (kategori.includes('KENDARAAN') && !merk_kendaraan) {
      return res.status(400).json({
        success: false,
        message: 'Merk kendaraan wajib diisi untuk kategori KENDARAAN'
      });
    }

    if (kategori === 'ELEKTRONIK' && !nama_barang) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang wajib diisi untuk kategori ELEKTRONIK'
      });
    }

    const newDataAset = await DataAset.create({
      nama_aset,
      merk_kendaraan,
      nama_barang,
      kategori,
      no_sertifikat,
      lokasi,
      atas_nama,
      data_pembelian,
      status,
      data_pbb,
      plat_nomor,
      nomor_mesin,
      nomor_rangka,
      pajak_berlaku,
      stnk_berlaku,
      estimasi_pembayaran_pajak,
      terakhir_service,
      jadwal_service_berikutnya,
      asuransi_pakai,
      jenis_asuransi,
      asuransi_berlaku,
      penanggung_jawab,
      merk,
      model,
      serial_number,
      tahun_pembelian,
      lampiran,
      created_by: req.user.id
    });

    // Fetch the created data with creator info
    const createdDataAset = await DataAset.findOne({
      where: { id: newDataAset.id },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Data aset berhasil ditambahkan',
      data: createdDataAset
    });
  } catch (error) {
    console.error('Error creating data aset:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/admin/data-aset/:id - Update data aset
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama_aset,
      merk_kendaraan,
      nama_barang,
      kategori,
      no_sertifikat,
      lokasi,
      atas_nama,
      data_pembelian,
      status,
      data_pbb,
      plat_nomor,
      nomor_mesin,
      nomor_rangka,
      pajak_berlaku,
      stnk_berlaku,
      estimasi_pembayaran_pajak,
      terakhir_service,
      jadwal_service_berikutnya,
      asuransi_pakai,
      jenis_asuransi,
      asuransi_berlaku,
      penanggung_jawab,
      merk,
      model,
      serial_number,
      tahun_pembelian,
      lampiran
    } = req.body;

    // Check if data aset exists
    const existingDataAset = await DataAset.findOne({
      where: {
        id: id,
        status_deleted: false
      }
    });

    if (!existingDataAset) {
      return res.status(404).json({
        success: false,
        message: 'Data aset tidak ditemukan'
      });
    }

    // Validasi kategori
    const validKategori = ['PROPERTI', 'KENDARAAN_PRIBADI', 'KENDARAAN_OPERASIONAL', 'KENDARAAN_DISTRIBUSI', 'ELEKTRONIK'];
    if (kategori && !validKategori.includes(kategori)) {
      return res.status(400).json({
        success: false,
        message: 'Kategori tidak valid'
      });
    }

    // Validasi berdasarkan kategori
    const finalKategori = kategori || existingDataAset.kategori;
    if (finalKategori === 'PROPERTI' && !nama_aset) {
      return res.status(400).json({
        success: false,
        message: 'Nama aset wajib diisi untuk kategori PROPERTI'
      });
    }

    if (finalKategori.includes('KENDARAAN') && !merk_kendaraan) {
      return res.status(400).json({
        success: false,
        message: 'Merk kendaraan wajib diisi untuk kategori KENDARAAN'
      });
    }

    if (finalKategori === 'ELEKTRONIK' && !nama_barang) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang wajib diisi untuk kategori ELEKTRONIK'
      });
    }

    // Update data aset
    await existingDataAset.update({
      nama_aset,
      merk_kendaraan,
      nama_barang,
      kategori,
      no_sertifikat,
      lokasi,
      atas_nama,
      data_pembelian,
      status,
      data_pbb,
      plat_nomor,
      nomor_mesin,
      nomor_rangka,
      pajak_berlaku,
      stnk_berlaku,
      estimasi_pembayaran_pajak,
      terakhir_service,
      jadwal_service_berikutnya,
      asuransi_pakai,
      jenis_asuransi,
      asuransi_berlaku,
      penanggung_jawab,
      merk,
      model,
      serial_number,
      tahun_pembelian,
      lampiran
    });

    // Fetch the updated data with creator info
    const updatedDataAset = await DataAset.findOne({
      where: { id: id },
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
      message: 'Data aset berhasil diperbarui',
      data: updatedDataAset
    });
  } catch (error) {
    console.error('Error updating data aset:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/admin/data-aset/:id - Soft delete data aset
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const dataAset = await DataAset.findOne({
      where: {
        id: id,
        status_deleted: false
      }
    });

    if (!dataAset) {
      return res.status(404).json({
        success: false,
        message: 'Data aset tidak ditemukan'
      });
    }

    // Soft delete
    await dataAset.update({
      status_deleted: true
    });

    res.json({
      success: true,
      message: 'Data aset berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting data aset:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/admin/data-aset/category/:category - Filter berdasarkan kategori
router.get('/category/:category', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 50, search } = req.query;
    
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      status_deleted: false,
      kategori: category
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
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/admin/data-aset/statistics - Get statistics
router.get('/statistics/overview', authenticateToken, adminOnly, async (req, res) => {
  try {
    const totalAset = await DataAset.count({ where: { status_deleted: false } });
    const totalProperti = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: 'PROPERTI'
      } 
    });
    const totalKendaraanPribadi = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: 'KENDARAAN_PRIBADI'
      } 
    });
    const totalKendaraanOperasional = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: 'KENDARAAN_OPERASIONAL'
      } 
    });
    const totalKendaraanDistribusi = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: 'KENDARAAN_DISTRIBUSI'
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
        totalAset,
        totalProperti,
        totalKendaraanPribadi,
        totalKendaraanOperasional,
        totalKendaraanDistribusi,
        totalElektronik,
        totalKendaraan: totalKendaraanPribadi + totalKendaraanOperasional + totalKendaraanDistribusi
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/admin/data-aset/:id/upload - Upload lampiran untuk data aset
router.post('/:id/upload', authenticateToken, adminOnly, upload.array('lampiran', 10), async (req, res) => {
  try {
    const { id } = req.params;

    const dataAset = await DataAset.findByPk(id);
    
    if (!dataAset) {
      return res.status(404).json({
        success: false,
        message: 'Data aset tidak ditemukan'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }

    // Process uploaded files
    const uploadedFiles = req.files.map(file => {
      // Convert absolute path to relative path for web access
      const relativePath = file.path.replace(path.join(__dirname, '../'), '').replace(/\\/g, '/');
      
      return {
        filename: file.filename,
        originalname: file.originalname,
        path: relativePath,
        size: file.size,
        mimetype: file.mimetype
      };
    });

    // Get existing lampiran
    let existingLampiran = [];
    if (dataAset.lampiran) {
      try {
        // Check if it's already a JSON string or old text format
        if (dataAset.lampiran.startsWith('[') || dataAset.lampiran.startsWith('{')) {
          existingLampiran = JSON.parse(dataAset.lampiran);
        } else {
          // Old format like "FOTO, FILE, VIDEO" - convert to empty array
          existingLampiran = [];
        }
      } catch (error) {
        console.error('Error parsing existing lampiran:', error);
        existingLampiran = [];
      }
    }

    // Add new files to existing lampiran
    const updatedLampiran = [...existingLampiran, ...uploadedFiles];

    // Update data aset with new lampiran
    await dataAset.update({
      lampiran: JSON.stringify(updatedLampiran),
      updated_at: new Date()
    });

    // Get updated data aset
    const updatedDataAset = await DataAset.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        }
      ]
    });

    // Parse lampiran JSON
    const dataAsetData = updatedDataAset.toJSON();
    if (dataAsetData.lampiran) {
      try {
        // Check if it's already a JSON string or old text format
        if (dataAsetData.lampiran.startsWith('[') || dataAsetData.lampiran.startsWith('{')) {
          dataAsetData.lampiran = JSON.parse(dataAsetData.lampiran);
        } else {
          // Old format like "FOTO, FILE, VIDEO" - convert to empty array
          dataAsetData.lampiran = [];
        }
      } catch (error) {
        console.error('Error parsing lampiran in response:', error);
        dataAsetData.lampiran = [];
      }
    }

    res.json({
      success: true,
      message: 'Lampiran berhasil diupload',
      data: dataAsetData
    });

  } catch (error) {
    console.error('Error uploading lampiran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupload lampiran',
      error: error.message
    });
  }
});

// DELETE /api/admin/data-aset/:id/lampiran/:fileIndex - Delete specific lampiran file
router.delete('/:id/lampiran/:fileIndex', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id, fileIndex } = req.params;
    const index = parseInt(fileIndex);

    const dataAset = await DataAset.findByPk(id);
    
    if (!dataAset) {
      return res.status(404).json({
        success: false,
        message: 'Data aset tidak ditemukan'
      });
    }

    let lampiranArray = [];
    if (dataAset.lampiran) {
      try {
        // Check if it's already a JSON string or old text format
        if (dataAset.lampiran.startsWith('[') || dataAset.lampiran.startsWith('{')) {
          lampiranArray = JSON.parse(dataAset.lampiran);
        } else {
          // Old format like "FOTO, FILE, VIDEO" - convert to empty array
          lampiranArray = [];
        }
      } catch (error) {
        console.error('Error parsing lampiran:', error);
        return res.status(400).json({
          success: false,
          message: 'Format lampiran tidak valid'
        });
      }
    }

    if (index < 0 || index >= lampiranArray.length) {
      return res.status(400).json({
        success: false,
        message: 'Index file tidak valid'
      });
    }

    // Get file info before deletion
    const fileToDelete = lampiranArray[index];
    
    // Remove file from array
    lampiranArray.splice(index, 1);

    // Update data aset
    await dataAset.update({
      lampiran: JSON.stringify(lampiranArray),
      updated_at: new Date()
    });

    // Delete physical file
    try {
      const filePath = path.join(__dirname, '..', fileToDelete.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Continue even if physical file deletion fails
    }

    res.json({
      success: true,
      message: 'File lampiran berhasil dihapus',
      data: {
        id: dataAset.id,
        lampiran: lampiranArray
      }
    });

  } catch (error) {
    console.error('Error deleting lampiran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus file lampiran',
      error: error.message
    });
  }
});

module.exports = router;
