const express = require('express');
const router = express.Router();
const { DaftarTugas, User } = require('../models');
const { Op } = require('sequelize');
const { sendTaskNotification } = require('../services/notificationService');

// Get all tasks with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, search } = req.query;
    const offset = (page - 1) * limit;

    console.log('Received query params:', { page, limit, status, priority, search }); // Debug log

    // Build where clause for filters
    const whereClause = {};
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (priority && priority !== 'all') {
      whereClause.skala_prioritas = priority;
    }

    console.log('Where clause:', whereClause); // Debug log

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
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await DaftarTugas.findByPk(req.params.id, {
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
        message: 'Task not found'
      });
    }

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

    res.json({
      success: true,
      data: taskData
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const {
      judul_tugas,
      pemberi_tugas,
      penerima_tugas,
      pihak_terkait,
      skala_prioritas,
      target_selesai,
      keterangan_tugas,
      lampiran
    } = req.body;

    // Validate required fields
    if (!judul_tugas || !pemberi_tugas || !penerima_tugas || !target_selesai || !keterangan_tugas) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate skala_prioritas
    const validPriorities = ['mendesak', 'penting', 'berproses'];
    if (!validPriorities.includes(skala_prioritas)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skala_prioritas'
      });
    }

    // Validate rating if provided
    if (req.body.rating !== undefined) {
      const rating = parseInt(req.body.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
    }

    // Check if users exist
    const pemberiUser = await User.findByPk(pemberi_tugas);
    const penerimaUser = await User.findByPk(penerima_tugas);

    if (!pemberiUser || !penerimaUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Prepare data
    const taskData = {
      judul_tugas,
      pemberi_tugas,
      penerima_tugas,
      skala_prioritas,
      target_selesai: new Date(target_selesai),
      keterangan_tugas,
      status: 'belum',
      rating: req.body.rating ? parseInt(req.body.rating) : null,
      catatan: req.body.catatan || null
    };

    // Handle pihak_terkait (JSON array)
    if (pihak_terkait && Array.isArray(pihak_terkait)) {
      taskData.pihak_terkait = JSON.stringify(pihak_terkait);
    }

    // Handle lampiran (JSON array)
    if (lampiran && Array.isArray(lampiran)) {
      taskData.lampiran = JSON.stringify(lampiran);
    }

    const newTask = await DaftarTugas.create(taskData);

    // Fetch the created task with user data
    const createdTask = await DaftarTugas.findByPk(newTask.id, {
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

    const taskDataResponse = createdTask.toJSON();
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

    // Send notifications asynchronously (don't wait for it)
    try {
      // Get wsService instance from app
      const wsService = req.app.get('wsService');
      
      // Send notifications to penerima tugas and pihak terkait
      sendTaskNotification(taskDataResponse, pemberiUser, wsService)
        .then(success => {
          if (success) {
            console.log(`✅ Task notifications sent successfully for task: ${judul_tugas}`);
          } else {
            console.log(`❌ Failed to send task notifications for task: ${judul_tugas}`);
          }
        })
        .catch(error => {
          console.error('Error sending task notifications:', error);
        });
    } catch (notificationError) {
      console.error('Error setting up task notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: taskDataResponse
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await DaftarTugas.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const {
      judul_tugas,
      penerima_tugas,
      pihak_terkait,
      skala_prioritas,
      target_selesai,
      keterangan_tugas,
      lampiran,
      status,
      rating,
      catatan
    } = req.body;

    // Validate skala_prioritas if provided
    if (skala_prioritas) {
      const validPriorities = ['mendesak', 'penting', 'berproses'];
      if (!validPriorities.includes(skala_prioritas)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid skala_prioritas'
        });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['belum', 'proses', 'revisi', 'selesai'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }
    }

    // Validate rating if provided
    if (rating !== undefined) {
      const ratingValue = parseInt(rating);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
    }

    // Check if penerima_tugas exists if provided
    if (penerima_tugas) {
      const penerimaUser = await User.findByPk(penerima_tugas);
      if (!penerimaUser) {
        return res.status(400).json({
          success: false,
          message: 'Invalid penerima_tugas ID'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (judul_tugas) updateData.judul_tugas = judul_tugas;
    if (penerima_tugas) updateData.penerima_tugas = penerima_tugas;
    if (skala_prioritas) updateData.skala_prioritas = skala_prioritas;
    if (target_selesai) updateData.target_selesai = new Date(target_selesai);
    if (keterangan_tugas) updateData.keterangan_tugas = keterangan_tugas;
    if (status) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating > 0 ? parseInt(rating) : null;
    if (catatan !== undefined) updateData.catatan = catatan.trim() || null;

    // Handle pihak_terkait
    if (pihak_terkait !== undefined) {
      if (Array.isArray(pihak_terkait)) {
        updateData.pihak_terkait = JSON.stringify(pihak_terkait);
      } else {
        updateData.pihak_terkait = null;
      }
    }

    // Handle lampiran
    if (lampiran !== undefined) {
      if (Array.isArray(lampiran)) {
        updateData.lampiran = JSON.stringify(lampiran);
      } else {
        updateData.lampiran = null;
      }
    }

    await task.update(updateData);

    // Fetch updated task with user data
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

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: taskDataResponse
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await DaftarTugas.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get tasks by user (as penerima_tugas)
router.get('/user/:userId', async (req, res) => {
  try {
    const tasks = await DaftarTugas.findAll({
      where: {
        penerima_tugas: req.params.userId
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
      ],
      order: [['created_at', 'DESC']]
    });

    // Parse JSON fields
    const tasksWithParsedData = tasks.map(task => {
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
      data: tasksWithParsedData
    });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 