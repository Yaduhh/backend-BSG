const express = require('express');
const router = express.Router();
const { DataTarget, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

// GET /api/admin/data-target/years - Ambil daftar tahun yang tersedia (berdasarkan created_at)
router.get('/years', authenticateToken, adminOnly, async (req, res) => {
  try {
    const rows = await DataTarget.findAll({
      attributes: [[fn('YEAR', col('created_at')), 'year']],
      where: { status_deleted: false },
      group: [fn('YEAR', col('created_at'))],
      order: [[fn('YEAR', col('created_at')), 'DESC']]
    });

    const years = rows.map(r => ({ year: parseInt(r.get('year')) })).filter(y => !isNaN(y.year));

    res.json({ success: true, data: years });
  } catch (error) {
    console.error('Error fetching years for data target:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// GET /api/admin/data-target - Ambil semua data target dengan pagination (mendukung filter tahun)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      sortBy = 'created_at',
      sortOrder = 'DESC',
      year
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
        { nama_target: { [Op.like]: searchTerm } }
      ];
    }

    // Tambah filter tahun jika dikirim (berdasarkan created_at)
    if (year) {
      const y = parseInt(year, 10);
      if (!isNaN(y)) {
        // Use Op.and with a Sequelize.where condition on YEAR(created_at)
        const yearCondition = Sequelize.where(fn('YEAR', col('DataTarget.created_at')), y);
        whereClause[Op.and] = [ ...(whereClause[Op.and] || []), yearCondition ];
      }
    }

    const dataTarget = await DataTarget.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'nama', 'username']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get statistics
    const totalTarget = await DataTarget.count({ where: whereClause });
    const totalNominal = await DataTarget.sum('target_nominal', {
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        items: dataTarget.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(dataTarget.count / limit),
          totalItems: dataTarget.count,
          itemsPerPage: parseInt(limit)
        },
        statistics: {
          totalTarget,
          totalNominal: totalNominal || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching data target:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/admin/data-target/:id - Ambil data target by ID
router.get('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const dataTarget = await DataTarget.findOne({
      where: { 
        id: id,
        status_deleted: false
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'nama', 'username']
        }
      ]
    });

    if (!dataTarget) {
      return res.status(404).json({
        success: false,
        message: 'Data target tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: dataTarget
    });
  } catch (error) {
    console.error('Error fetching data target by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/admin/data-target - Buat data target baru
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const {
      nama_target,
      target_nominal
    } = req.body;

    // Validation
    if (!nama_target || !target_nominal) {
      return res.status(400).json({
        success: false,
        message: 'Nama target dan target nominal harus diisi'
      });
    }

    // Check if nama_target already exists
    const existingTarget = await DataTarget.findOne({
      where: {
        nama_target: nama_target,
        status_deleted: false
      }
    });

    if (existingTarget) {
      return res.status(400).json({
        success: false,
        message: 'Target dengan nama yang sama sudah ada'
      });
    }

    const newDataTarget = await DataTarget.create({
      nama_target,
      target_nominal: parseFloat(target_nominal),
      created_by: req.user.id
    });

    const createdTarget = await DataTarget.findOne({
      where: { id: newDataTarget.id },
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
      message: 'Data target berhasil dibuat',
      data: createdTarget
    });
  } catch (error) {
    console.error('Error creating data target:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/admin/data-target/:id - Update data target
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama_target,
      target_nominal
    } = req.body;

    const dataTarget = await DataTarget.findOne({
      where: { 
        id: id,
        status_deleted: false
      }
    });

    if (!dataTarget) {
      return res.status(404).json({
        success: false,
        message: 'Data target tidak ditemukan'
      });
    }

    // Check if nama_target already exists (excluding current record)
    if (nama_target) {
      const existingTarget = await DataTarget.findOne({
        where: {
          nama_target: nama_target,
          id: { [Op.ne]: id },
          status_deleted: false
        }
      });

      if (existingTarget) {
        return res.status(400).json({
          success: false,
          message: 'Target dengan nama yang sama sudah ada'
        });
      }
    }

    // Update fields
    const updateData = {};
    if (nama_target) updateData.nama_target = nama_target;
    if (target_nominal) updateData.target_nominal = parseFloat(target_nominal);
    
    updateData.updated_by = req.user.id;

    await dataTarget.update(updateData);

    const updatedTarget = await DataTarget.findOne({
      where: { id: id },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'nama', 'username']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Data target berhasil diupdate',
      data: updatedTarget
    });
  } catch (error) {
    console.error('Error updating data target:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/admin/data-target/:id - Soft delete data target
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const dataTarget = await DataTarget.findOne({
      where: { 
        id: id,
        status_deleted: false
      }
    });

    if (!dataTarget) {
      return res.status(404).json({
        success: false,
        message: 'Data target tidak ditemukan'
      });
    }

    await dataTarget.update({
      status_deleted: true,
      updated_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Data target berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting data target:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/admin/data-target/export/pdf - Export data target ke PDF
router.get('/export/pdf', authenticateToken, adminOnly, async (req, res) => {
  try {
    // Build where clause
    const whereClause = {
      status_deleted: false
    };

    const dataTarget = await DataTarget.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['nama']
        }
      ],
      order: [['nama_target', 'ASC']]
    });

    // Create PDF
    const doc = new PDFDocument();
    const filename = `data_target_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(18).text('DATA TARGET', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`DI UPDATE PADA: ${req.user.nama}`, { align: 'center' });
    doc.moveDown(1);

    // Table header
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidth = 200;
    const rowHeight = 25;

    // Draw table headers
    doc.rect(tableLeft, tableTop, colWidth, rowHeight).stroke();
    doc.text('NAMA TARGET', tableLeft + 10, tableTop + 8);
    
    doc.rect(tableLeft + colWidth, tableTop, colWidth, rowHeight).stroke();
    doc.text('TARGET NOMINAL', tableLeft + colWidth + 10, tableTop + 8);

    // Draw table rows
    let currentY = tableTop + rowHeight;
    let totalNominal = 0;

    dataTarget.forEach((target, index) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      doc.rect(tableLeft, currentY, colWidth, rowHeight).stroke();
      doc.text(target.nama_target, tableLeft + 10, currentY + 8);
      
      doc.rect(tableLeft + colWidth, currentY, colWidth, rowHeight).stroke();
      const nominalText = `Rp ${target.target_nominal.toLocaleString('id-ID')}`;
      doc.text(nominalText, tableLeft + colWidth + 10, currentY + 8);

      totalNominal += parseFloat(target.target_nominal);
      currentY += rowHeight;
    });

    // Total row
    doc.rect(tableLeft, currentY, colWidth, rowHeight).stroke();
    doc.text('TOTAL', tableLeft + 10, currentY + 8);
    
    doc.rect(tableLeft + colWidth, currentY, colWidth, rowHeight).stroke();
    const totalText = `Rp ${totalNominal.toLocaleString('id-ID')}`;
    doc.text(totalText, tableLeft + colWidth + 10, currentY + 8);

    doc.end();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/admin/data-target/statistics/overview - Get statistics
router.get('/statistics/overview', authenticateToken, adminOnly, async (req, res) => {
  try {
    const totalTarget = await DataTarget.count({ where: { status_deleted: false } });
    const totalNominal = await DataTarget.sum('target_nominal', {
      where: { 
        status_deleted: false
      }
    });

    res.json({
      success: true,
      data: {
        totalTarget,
        totalNominal: totalNominal || 0
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
