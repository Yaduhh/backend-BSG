const express = require('express');
const router = express.Router();
const { DataAset, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

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

    res.json({
      success: true,
      data: dataAset
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

module.exports = router;
