const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const DataSupplier = require('../models/DataSupplier');

// Get all suppliers with optional filtering
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { category, divisi, search } = req.query;
    let suppliers = [];

    if (search) {
      suppliers = await DataSupplier.search(search);
    } else if (category) {
      suppliers = await DataSupplier.getByCategory(category);
    } else if (divisi) {
      suppliers = await DataSupplier.getByDivision(divisi);
    } else {
      suppliers = await DataSupplier.getAll();
    }

    // Get statistics
    const stats = await DataSupplier.getStats();

    res.json({
      success: true,
      data: suppliers,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data supplier'
    });
  }
});

// Get supplier by ID
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await DataSupplier.getById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data supplier'
    });
  }
});

// Create new supplier
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      kategori_supplier,
      divisi,
      nama_supplier,
      no_hp_supplier,
      tanggal_kerjasama,
      npwp,
      alamat,
      keterangan
    } = req.body;

    // Validation
    if (!kategori_supplier || !divisi || !nama_supplier || !no_hp_supplier || !tanggal_kerjasama || !alamat) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi kecuali NPWP dan keterangan'
      });
    }

    const supplierData = {
      kategori_supplier,
      divisi,
      nama_supplier,
      no_hp_supplier,
      tanggal_kerjasama,
      npwp,
      alamat,
      keterangan,
      created_by: req.user.id
    };

    const supplierId = await DataSupplier.create(supplierData);

    res.status(201).json({
      success: true,
      message: 'Supplier berhasil ditambahkan',
      data: { id: supplierId }
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan supplier'
    });
  }
});

// Update supplier
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kategori_supplier,
      divisi,
      nama_supplier,
      no_hp_supplier,
      tanggal_kerjasama,
      npwp,
      alamat,
      keterangan
    } = req.body;

    // Check if supplier exists
    const existingSupplier = await DataSupplier.getById(id);
    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier tidak ditemukan'
      });
    }

    // Validation
    if (!kategori_supplier || !divisi || !nama_supplier || !no_hp_supplier || !tanggal_kerjasama || !alamat) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi kecuali NPWP dan keterangan'
      });
    }

    const supplierData = {
      kategori_supplier,
      divisi,
      nama_supplier,
      no_hp_supplier,
      tanggal_kerjasama,
      npwp,
      alamat,
      keterangan
    };

    const updated = await DataSupplier.update(id, supplierData);

    if (updated) {
      res.json({
        success: true,
        message: 'Supplier berhasil diperbarui'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Gagal memperbarui supplier'
      });
    }
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui supplier'
    });
  }
});

// Delete supplier (soft delete)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier exists
    const existingSupplier = await DataSupplier.getById(id);
    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier tidak ditemukan'
      });
    }

    const deleted = await DataSupplier.delete(id);

    if (deleted) {
      res.json({
        success: true,
        message: 'Supplier berhasil dihapus'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Gagal menghapus supplier'
      });
    }
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus supplier'
    });
  }
});

// Get supplier statistics
router.get('/stats/summary', authenticateAdmin, async (req, res) => {
  try {
    const stats = await DataSupplier.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat statistik supplier'
    });
  }
});

module.exports = router;
