const express = require('express');
const router = express.Router();
const { DaftarTugas, User } = require('../models');
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { 
  sendTaskStatusUpdateNotification,
  sendTaskCompletionNotification 
} = require('../services/notificationService');

// Helper: case-insensitive role check
function hasRole(req, allowedRoles = []) {
  const role = String(req.user?.role || '').toLowerCase();
  return allowedRoles.includes(role);
}

// Get tasks assigned to leader (penerima_tugas)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Leader only.'
      });
    }

    const { page = 1, limit = 20, status, priority, search } = req.query;
    const leaderId = req.user.id; // Leader yang sedang login
    const offset = (page - 1) * limit;

    console.log('Leader tasks query params:', { page, limit, status, priority, search, leaderId });

    // Build where clause for filters
    const whereClause = {
      penerima_tugas: leaderId // Hanya tugas yang diterima oleh leader ini
    };
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (priority && priority !== 'all') {
      whereClause.skala_prioritas = priority;
    }

    console.log('Leader where clause:', whereClause);

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
      
      // Keep include clause as is - don't modify it for search
      // The search will be handled by the main whereClause
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
    console.error('Error fetching leader tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data tugas'
    });
  }
});

// Get task statistics for leader
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Leader only.'
      });
    }

    const leaderId = req.user.id;

    const stats = await DaftarTugas.findAll({
      where: { penerima_tugas: leaderId },
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
    console.error('Error fetching leader task stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik tugas'
    });
  }
});

// Get single task detail for leader
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Leader only.'
      });
    }

    const { id } = req.params;
    const leaderId = req.user.id;

    const task = await DaftarTugas.findOne({
      where: {
        id: id,
        penerima_tugas: leaderId // Pastikan leader hanya bisa lihat tugasnya sendiri
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
    console.error('Error fetching leader task detail:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail tugas'
    });
  }
});

// Update task status for leader
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Leader only.'
      });
    }

    const { id } = req.params;
    const leaderId = req.user.id;
    const { status, rating, catatan, lampiran, completed_at } = req.body;

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

    // Validasi lampiran wajib jika status selesai
    if (status === 'selesai') {
      if (!lampiran || !Array.isArray(lampiran) || lampiran.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lampiran wajib diisi saat menyelesaikan tugas'
        });
      }
    }

    // Cari tugas yang dimiliki leader
    const task = await DaftarTugas.findOne({
      where: {
        id: id,
        penerima_tugas: leaderId
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
    
    // Handle lampiran
    if (lampiran !== undefined) {
      if (Array.isArray(lampiran) && lampiran.length > 0) {
        updateData.lampiran = JSON.stringify(lampiran);
      } else {
        updateData.lampiran = null;
      }
    }
    
    // Handle completed_at
    if (completed_at) updateData.completed_at = new Date(completed_at);

    // Get old status for comparison
    const oldStatus = task.status;
    
    await task.update(updateData);

    // Fetch updated task with user data and parse JSON fields
    const updatedTask = await DaftarTugas.findByPk(task.id, {
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

    const taskDataResponse = updatedTask.toJSON();
    
    // Parse JSON fields
    if (taskDataResponse.pihak_terkait) {
      try {
        taskDataResponse.pihak_terkait = JSON.parse(taskDataResponse.pihak_terkait);
      } catch (e) {
        taskDataResponse.pihak_terkait = [];
      }
    }
    if (taskDataResponse.lampiran) {
      try {
        taskDataResponse.lampiran = JSON.parse(taskDataResponse.lampiran);
      } catch (e) {
        taskDataResponse.lampiran = [];
      }
    }

    // Send notifications if status changed
    if (status && status !== oldStatus) {
      try {
        // Get wsService instance from app
        const wsService = req.app.get('wsService');
        
        // Get current user (leader who updated the task)
        const currentUser = req.user || { id: 1, nama: 'Leader' }; // Fallback if no user context
        
        if (status === 'selesai') {
          // Send completion notification to pemberi tugas (owner)
          sendTaskCompletionNotification(taskDataResponse, currentUser, wsService)
            .then(success => {
              if (success) {
                console.log(`✅ Task completion notification sent for task: ${taskDataResponse.judul_tugas}`);
              } else {
                console.log(`❌ Failed to send task completion notification for task: ${taskDataResponse.judul_tugas}`);
              }
            })
            .catch(error => {
              console.error('Error sending task completion notification:', error);
            });
        } else {
          // Send status update notification to pemberi tugas (owner)
          sendTaskStatusUpdateNotification(taskDataResponse, currentUser, wsService)
            .then(success => {
              if (success) {
                console.log(`✅ Task status update notification sent for task: ${taskDataResponse.judul_tugas}`);
              } else {
                console.log(`❌ Failed to send task status update notification for task: ${taskDataResponse.judul_tugas}`);
              }
            })
            .catch(error => {
              console.error('Error sending task status update notification:', error);
            });
        }
      } catch (notificationError) {
        console.error('Error setting up task status notifications:', notificationError);
      }
    }

    res.json({
      success: true,
      message: 'Tugas berhasil diperbarui',
      data: taskDataResponse
    });
  } catch (error) {
    console.error('Error updating leader task:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui tugas'
    });
  }
});

module.exports = router;
