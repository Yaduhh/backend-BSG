const express = require('express');
const router = express.Router();
const { DaftarTugas, User } = require('../models');
const { Op } = require('sequelize');
const { authenticateAdmin } = require('../middleware/auth');
const { 
  sendTaskStatusUpdateNotification,
  sendTaskCompletionNotification 
} = require('../services/notificationService');

// Apply authentication middleware to all routes
router.use(authenticateAdmin);

// Get tasks assigned to admin (penerima_tugas) or related
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, search, scope } = req.query;
    const adminId = req.user.id; // Admin yang sedang login
    const offset = (page - 1) * limit;

    console.log('Admin tasks query params:', { page, limit, status, priority, search, adminId, scope });

    // Build where clause for filters
    const whereClause = {};
    
    // Default: hanya tugas yang diterima oleh admin ini
    // scope=assigned_or_related -> tugas dimana admin adalah penerima ATAU pihak terkait
    if (scope !== 'assigned_or_related') {
      whereClause.penerima_tugas = adminId;
    }
    
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
      } else {
        taskData.pihak_terkait = [];
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

    // Filter berdasarkan scope jika assigned_or_related
    let filteredTasks = tasksWithParsedData;
    if (scope === 'assigned_or_related') {
      filteredTasks = tasksWithParsedData.filter(task => {
        // Check if user is penerima_tugas
        const isAssigned = task.penerima_tugas === adminId;
        
        // Check if user is in pihak_terkait
        let isRelated = false;
        if (task.pihak_terkait && Array.isArray(task.pihak_terkait)) {
          isRelated = task.pihak_terkait.some(x => {
            if (typeof x === 'number') return x === adminId;
            if (typeof x === 'string') {
              const num = parseInt(x, 10);
              return !Number.isNaN(num) && num === adminId;
            }
            return false;
          });
        }
        
        return isAssigned || isRelated;
      });
    }

    // Fetch user data for pihak_terkait
    const tasksWithPihakTerkait = await Promise.all(
      filteredTasks.map(async (task) => {
        if (task.pihak_terkait && task.pihak_terkait.length > 0) {
          try {
            const pihakTerkaitUsers = await User.findAll({
              where: { id: { [Op.in]: task.pihak_terkait } },
              attributes: ['id', 'nama', 'email']
            });
            task.pihak_terkait_users = pihakTerkaitUsers;
          } catch (e) {
            task.pihak_terkait_users = [];
          }
        } else {
          task.pihak_terkait_users = [];
        }
        return task;
      })
    );

    res.json({
      success: true,
      data: tasksWithPihakTerkait,
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

    // Get all tasks to check for pihak_terkait
    const allTasks = await DaftarTugas.findAll({
      attributes: ['id', 'penerima_tugas', 'status', 'pihak_terkait']
    });

    // Count tasks grouped by status
    const statsMap = {
      belum: 0,
      proses: 0,
      revisi: 0,
      selesai: 0
    };

    allTasks.forEach(task => {
      const taskData = task.toJSON();
      
      // Check if admin is penerima_tugas
      const isAssigned = taskData.penerima_tugas === adminId;
      
      // Check if admin is in pihak_terkait
      let isRelated = false;
      let pihak_terkait = [];
      if (taskData.pihak_terkait) {
        try {
          pihak_terkait = JSON.parse(taskData.pihak_terkait);
        } catch (e) {
          pihak_terkait = [];
        }
      }
      
      isRelated = pihak_terkait.some(x => {
        if (typeof x === 'number') return x === adminId;
        if (typeof x === 'string') {
          const num = parseInt(x, 10);
          return !Number.isNaN(num) && num === adminId;
        }
        return false;
      });
      
      // Only count if admin is assigned OR related
      if (isAssigned || isRelated) {
        const status = taskData.status;
        if (status && statsMap.hasOwnProperty(status)) {
          statsMap[status] = (statsMap[status] || 0) + 1;
        }
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

    // First, get task without strict where clause to check access
    const task = await DaftarTugas.findOne({
      where: {
        id: id
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
    } else {
      taskData.pihak_terkait = [];
    }
    if (taskData.lampiran) {
      try {
        taskData.lampiran = JSON.parse(taskData.lampiran);
      } catch (e) {
        taskData.lampiran = [];
      }
    }

    // Check if admin has access (is penerima OR in pihak_terkait)
    const isAssigned = taskData.penerima_tugas === adminId;
    let isRelated = false;
    
    if (taskData.pihak_terkait && Array.isArray(taskData.pihak_terkait)) {
      isRelated = taskData.pihak_terkait.some(x => {
        if (typeof x === 'number') return x === adminId;
        if (typeof x === 'string') {
          const num = parseInt(x, 10);
          return !Number.isNaN(num) && num === adminId;
        }
        return false;
      });
    }
    
    // Check access permission
    if (!isAssigned && !isRelated) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke tugas ini'
      });
    }

    // Fetch user data for pihak_terkait
    if (taskData.pihak_terkait && taskData.pihak_terkait.length > 0) {
      try {
        const pihakTerkaitUsers = await User.findAll({
          where: { id: { [Op.in]: taskData.pihak_terkait } },
          attributes: ['id', 'nama', 'email']
        });
        taskData.pihak_terkait_users = pihakTerkaitUsers;
      } catch (e) {
        taskData.pihak_terkait_users = [];
      }
    } else {
      taskData.pihak_terkait_users = [];
    }

    // Add user's role in this task (penerima or pihak_terkait)
    taskData.user_role_in_task = isAssigned ? 'penerima' : 'pihak_terkait';

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

    // Cari tugas (harus penerima tugas untuk bisa update)
    const task = await DaftarTugas.findOne({
      where: {
        id: id
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tugas tidak ditemukan'
      });
    }

    // Check if user is penerima tugas
    const isPenerima = task.penerima_tugas === adminId;
    
    if (!isPenerima) {
      return res.status(403).json({
        success: false,
        message: 'Hanya penerima tugas yang dapat menyelesaikan tugas ini'
      });
    }

    // Update data
    const updateData = {};
    if (status) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating;
    if (catatan !== undefined) updateData.catatan = catatan ? catatan.trim() : null;
    
    // Handle lampiran - append to existing
    if (lampiran !== undefined) {
      if (Array.isArray(lampiran) && lampiran.length > 0) {
        // Get existing lampiran
        let existingLampiran = [];
        if (task.lampiran) {
          try {
            if (typeof task.lampiran === 'string') {
              existingLampiran = JSON.parse(task.lampiran);
            } else if (Array.isArray(task.lampiran)) {
              existingLampiran = task.lampiran;
            }
          } catch (e) {
            existingLampiran = [];
          }
        }
        
        // Combine existing with new (append new to existing)
        const combinedLampiran = [...existingLampiran, ...lampiran];
        updateData.lampiran = JSON.stringify(combinedLampiran);
      } else {
        // If empty array, keep existing lampiran
        const existingLampiran = task.lampiran;
        updateData.lampiran = existingLampiran;
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
        
        // Get current user (admin who updated the task)
        const currentUser = req.user || { id: 1, nama: 'Admin' }; // Fallback if no user context
        
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
    console.error('Error updating admin task:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui tugas'
    });
  }
});

module.exports = router; 