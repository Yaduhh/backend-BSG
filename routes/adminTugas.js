const express = require('express');
const router = express.Router();
const { DaftarTugas, User } = require('../models');
const { Op } = require('sequelize');
const { authenticateAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateAdmin);

// Get tasks assigned to admin (penerima_tugas)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, search } = req.query;
    const adminId = req.user.id; // Admin yang sedang login
    const offset = (page - 1) * limit;

    console.log('Admin tasks query params:', { page, limit, status, priority, search, adminId });

    // Build where clause for filters
    const whereClause = {
      penerima_tugas: adminId // Hanya tugas yang diterima oleh admin ini
    };
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (priority && priority !== 'all') {
      whereClause.skala_prioritas = priority;
    }

    console.log('Admin where clause:', whereClause);

    // Build include clause with search
    let includeClause = [
      {
        model: User,
        as: 'pemberiTugas',
        attributes: ['id', 'nama', 'email']
      },
      {
        model: User,
        as: 'penerimaTugas',
        attributes: ['id', 'nama', 'email']
      }
    ];

    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { judul_tugas: { [Op.like]: searchTerm } },
        { keterangan_tugas: { [Op.like]: searchTerm } }
      ];
      
      // Also search in related users
      includeClause = includeClause.map(include => ({
        ...include,
        where: {
          [Op.or]: [
            { nama: { [Op.like]: searchTerm } },
            { email: { [Op.like]: searchTerm } }
          ]
        },
        required: false
      }));
    }

    const tasks = await DaftarTugas.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Parse pihak_terkait and lampiran JSON
    const tasksWithParsedData = tasks.rows.map(task => {
      const taskData = task.toJSON();
      if (taskData.pihak_terkait) {
        try {
          taskData.pihak_terkait = JSON.parse(taskData.pihak_terkait);
        } catch (e) {
          taskData.pihak_terkait = [];
        }
      }
      if (taskData.lampiran) {
        try {
          taskData.lampiran = JSON.parse(taskData.lampiran);
        } catch (e) {
          taskData.lampiran = [];
        }
      }
      return taskData;
    });

    res.json({
      success: true,
      data: tasksWithParsedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(tasks.count / limit),
        totalItems: tasks.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data tugas'
    });
  }
});

// Get task statistics for admin
router.get('/stats', async (req, res) => {
  try {
    const adminId = req.user.id;

    const stats = await DaftarTugas.findAll({
      where: { penerima_tugas: adminId },
      attributes: [
        'status',
        [DaftarTugas.sequelize.fn('COUNT', DaftarTugas.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const statsMap = {
      belum: 0,
      proses: 0,
      revisi: 0,
      selesai: 0
    };

    stats.forEach(stat => {
      if (stat.status && statsMap.hasOwnProperty(stat.status)) {
        statsMap[stat.status] = parseInt(stat.dataValues.count);
      }
    });

    res.json({
      success: true,
      data: statsMap
    });
  } catch (error) {
    console.error('Error fetching admin task stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik tugas'
    });
  }
});

// Get single task detail for admin
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const task = await DaftarTugas.findOne({
      where: {
        id: id,
        penerima_tugas: adminId // Pastikan admin hanya bisa lihat tugasnya sendiri
      },
      include: [
        {
          model: User,
          as: 'pemberiTugas',
          attributes: ['id', 'nama', 'email']
        },
        {
          model: User,
          as: 'penerimaTugas',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tugas tidak ditemukan'
      });
    }

    const taskData = task.toJSON();
    
    // Parse JSON fields
    if (taskData.pihak_terkait) {
      try {
        taskData.pihak_terkait = JSON.parse(taskData.pihak_terkait);
      } catch (e) {
        taskData.pihak_terkait = [];
      }
    }
    if (taskData.lampiran) {
      try {
        taskData.lampiran = JSON.parse(taskData.lampiran);
      } catch (e) {
        taskData.lampiran = [];
      }
    }

    res.json({
      success: true,
      data: taskData
    });
  } catch (error) {
    console.error('Error fetching admin task detail:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail tugas'
    });
  }
});

// Update task status for admin
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { status, rating, catatan } = req.body;

    // Validasi status yang diizinkan
    const validStatuses = ['belum', 'proses', 'revisi', 'selesai'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }

    // Validasi rating jika ada
    if (rating !== undefined && rating !== null) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating harus berupa angka 1-5'
        });
      }
    }

    // Cari tugas yang dimiliki admin
    const task = await DaftarTugas.findOne({
      where: {
        id: id,
        penerima_tugas: adminId
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tugas tidak ditemukan'
      });
    }

    // Update data
    const updateData = {};
    if (status) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating;
    if (catatan !== undefined) updateData.catatan = catatan ? catatan.trim() : null;

    await task.update(updateData);

    res.json({
      success: true,
      message: 'Tugas berhasil diperbarui',
      data: task
    });
  } catch (error) {
    console.error('Error updating admin task:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui tugas'
    });
  }
});

module.exports = router; 