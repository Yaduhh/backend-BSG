const express = require('express');
const router = express.Router();
const { Pengumuman, User } = require('../models');
const { Op } = require('sequelize');

// Get all pengumuman with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, prioritas, search } = req.query;
    const offset = (page - 1) * limit;

    console.log('Received query params:', { page, limit, status, prioritas, search }); // Debug log

    // Build where clause for filters
    const whereClause = {};
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (prioritas && prioritas !== 'all') {
      whereClause.prioritas = prioritas;
    }

    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { judul: { [Op.like]: searchTerm } },
        { konten: { [Op.like]: searchTerm } }
      ];
    }

    // Only show active and current announcements by default
    if (!whereClause.status) {
      whereClause.status = 'aktif';
    }

    // Only show announcements that are still valid (current date between tanggal_berlaku_dari and tanggal_berlaku_sampai)
    const currentDate = new Date();
    whereClause.tanggal_berlaku_dari = {
      [Op.lte]: currentDate
    };
    
    // If tanggal_berlaku_sampai is null, it means the announcement is permanent
    whereClause[Op.or] = [
      { tanggal_berlaku_sampai: null },
      { tanggal_berlaku_sampai: { [Op.gte]: currentDate } }
    ];

    console.log('Where clause:', whereClause); // Debug log

    const pengumuman = await Pengumuman.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'penulis',
          attributes: ['id', 'nama', 'email']
        }
      ],
      order: [['prioritas', 'ASC'], ['created_at', 'DESC']], // High priority first, then newest
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const pengumumanWithParsedData = pengumuman.rows.map(item => {
      return item.toJSON();
    });

    res.json({
      success: true,
      data: pengumumanWithParsedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(pengumuman.count / limit),
        totalItems: pengumuman.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pengumuman:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pengumuman by ID
router.get('/:id', async (req, res) => {
  try {
    const pengumuman = await Pengumuman.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'penulis',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    if (!pengumuman) {
      return res.status(404).json({
        success: false,
        message: 'Pengumuman not found'
      });
    }

    const pengumumanData = pengumuman.toJSON();

    res.json({
      success: true,
      data: pengumumanData
    });
  } catch (error) {
    console.error('Error fetching pengumuman:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new pengumuman
router.post('/', async (req, res) => {
  try {
    const {
      judul,
      konten,
      penulis_id,
      prioritas,
      tanggal_berlaku_dari,
      tanggal_berlaku_sampai
    } = req.body;

    // Validate required fields
    if (!judul || !konten || !penulis_id || !tanggal_berlaku_dari) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: judul, konten, penulis_id, tanggal_berlaku_dari'
      });
    }

    // Validate prioritas
    const validPriorities = ['tinggi', 'sedang', 'rendah'];
    if (prioritas && !validPriorities.includes(prioritas)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prioritas. Must be: tinggi, sedang, or rendah'
      });
    }

    // Check if penulis exists
    const penulis = await User.findByPk(penulis_id);
    if (!penulis) {
      return res.status(400).json({
        success: false,
        message: 'Invalid penulis_id'
      });
    }

    // Validate dates
    const tanggalDari = new Date(tanggal_berlaku_dari);
    let tanggalSampai = null;
    
    if (tanggal_berlaku_sampai) {
      tanggalSampai = new Date(tanggal_berlaku_sampai);
      if (tanggalSampai <= tanggalDari) {
        return res.status(400).json({
          success: false,
          message: 'tanggal_berlaku_sampai must be after tanggal_berlaku_dari'
        });
      }
    }

    // Prepare data
    const pengumumanData = {
      judul,
      konten,
      penulis_id,
      prioritas: prioritas || 'sedang',
      tanggal_berlaku_dari: tanggalDari,
      tanggal_berlaku_sampai: tanggalSampai,
      status: 'aktif'
    };



    const newPengumuman = await Pengumuman.create(pengumumanData);

    // Fetch the created pengumuman with user data
    const createdPengumuman = await Pengumuman.findByPk(newPengumuman.id, {
      include: [
        {
          model: User,
          as: 'penulis',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    const pengumumanResponse = createdPengumuman.toJSON();

    res.status(201).json({
      success: true,
      message: 'Pengumuman created successfully',
      data: pengumumanResponse
    });
  } catch (error) {
    console.error('Error creating pengumuman:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update pengumuman
router.put('/:id', async (req, res) => {
  try {
    const pengumuman = await Pengumuman.findByPk(req.params.id);
    
    if (!pengumuman) {
      return res.status(404).json({
        success: false,
        message: 'Pengumuman not found'
      });
    }

    const {
      judul,
      konten,
      prioritas,
      tanggal_berlaku_dari,
      tanggal_berlaku_sampai,
      status
    } = req.body;

    // Validate prioritas if provided
    if (prioritas) {
      const validPriorities = ['tinggi', 'sedang', 'rendah'];
      if (!validPriorities.includes(prioritas)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid prioritas. Must be: tinggi, sedang, or rendah'
        });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['aktif', 'non_aktif'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: aktif or non_aktif'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (judul) updateData.judul = judul;
    if (konten) updateData.konten = konten;
    if (prioritas) updateData.prioritas = prioritas;
    if (status) updateData.status = status;
    
    if (tanggal_berlaku_dari) {
      updateData.tanggal_berlaku_dari = new Date(tanggal_berlaku_dari);
    }
    
    if (tanggal_berlaku_sampai !== undefined) {
      updateData.tanggal_berlaku_sampai = tanggal_berlaku_sampai ? new Date(tanggal_berlaku_sampai) : null;
    }

    // Validate dates if both are provided
    if (updateData.tanggal_berlaku_dari && updateData.tanggal_berlaku_sampai) {
      if (updateData.tanggal_berlaku_sampai <= updateData.tanggal_berlaku_dari) {
        return res.status(400).json({
          success: false,
          message: 'tanggal_berlaku_sampai must be after tanggal_berlaku_dari'
        });
      }
    }



    await pengumuman.update(updateData);

    // Fetch updated pengumuman with user data
    const updatedPengumuman = await Pengumuman.findByPk(pengumuman.id, {
      include: [
        {
          model: User,
          as: 'penulis',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    const pengumumanResponse = updatedPengumuman.toJSON();

    res.json({
      success: true,
      message: 'Pengumuman updated successfully',
      data: pengumumanResponse
    });
  } catch (error) {
    console.error('Error updating pengumuman:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete pengumuman
router.delete('/:id', async (req, res) => {
  try {
    const pengumuman = await Pengumuman.findByPk(req.params.id);
    
    if (!pengumuman) {
      return res.status(404).json({
        success: false,
        message: 'Pengumuman not found'
      });
    }

    await pengumuman.destroy();

    res.json({
      success: true,
      message: 'Pengumuman deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pengumuman:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pengumuman count
router.get('/count/active', async (req, res) => {
  try {
    const currentDate = new Date();
    
    const count = await Pengumuman.count({
      where: {
        status: 'aktif',
        tanggal_berlaku_dari: {
          [Op.lte]: currentDate
        },
        [Op.or]: [
          { tanggal_berlaku_sampai: null },
          { tanggal_berlaku_sampai: { [Op.gte]: currentDate } }
        ]
      }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error counting pengumuman:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
