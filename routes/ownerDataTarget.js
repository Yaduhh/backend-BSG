const express = require('express');
const router = express.Router();
const { DataTarget, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op, fn, col } = require('sequelize');
const PDFDocument = require('pdfkit');

// Middleware untuk memastikan hanya owner yang bisa akses
const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Owner only.'
    });
  }
  next();
};

// GET /api/owner/data-target - Ambil semua data target dengan pagination (read-only)
router.get('/', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
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
        { nama_target: { [Op.like]: searchTerm } }
      ];
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
    const totalTarget = await DataTarget.count({ where: { status_deleted: false } });
    const totalNominal = await DataTarget.sum('target_nominal', {
      where: { 
        status_deleted: false
      }
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

// GET /api/owner/data-target/:id - Ambil data target by ID (read-only)
router.get('/:id', authenticateToken, ownerOnly, async (req, res) => {
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

// GET /api/owner/data-target/export/pdf - Export data target ke PDF (read-only)
router.get('/export/pdf', authenticateToken, ownerOnly, async (req, res) => {
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

// GET /api/owner/data-target/statistics/overview - Get statistics (read-only)
router.get('/statistics/overview', authenticateToken, ownerOnly, async (req, res) => {
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
