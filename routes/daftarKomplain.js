const express = require('express');
const router = express.Router();
const { DaftarKomplain, User } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { 
  sendKomplainNotification, 
  sendKomplainNewNotification, 
  sendKomplainOwnerToAdminNotification,
  sendKomplainRevisionNotification,
  sendKomplainRatingNotification
} = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');
const { uploadMultipleKomplain, compressKomplainImages, handleKomplainUploadError } = require('../middleware/uploadKomplain');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Utility function to parse lampiran data safely
const parseLampiranData = (lampiranData) => {
  if (!lampiranData) return [];
  
  // If it's already an array, return it
  if (Array.isArray(lampiranData)) return lampiranData;
  
  // If it's a string, try to parse it
  if (typeof lampiranData === 'string') {
    try {
      const parsed = JSON.parse(lampiranData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing lampiran data:', error);
      return [];
    }
  }
  
  return [];
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/komplain');
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
    // Allow all file types - no restrictions
    cb(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 20 // Maximum 20 files per upload
  }
});

// Get all complaints with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      prioritas,
      kategori,
      search,
      pelapor_id,
      penerima_komplain_id
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by priority
    if (prioritas) {
      whereClause.prioritas = prioritas;
    }

    // Filter by category
    if (kategori) {
      whereClause.kategori = kategori;
    }

    // Filter by reporter
    if (pelapor_id) {
      whereClause.pelapor_id = pelapor_id;
    }

    // Filter by responsible person
    if (penerima_komplain_id) {
      whereClause.penerima_komplain_id = penerima_komplain_id;
    }

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { judul_komplain: { [Op.like]: `%${search}%` } },
        { deskripsi_komplain: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: complaints } = await DaftarKomplain.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Parse lampiran JSON if exists
    const complaintsWithParsedLampiran = complaints.map(complaint => {
      const complaintData = complaint.toJSON();
      if (complaintData.lampiran) {
        try {
          complaintData.lampiran = JSON.parse(complaintData.lampiran);
        } catch (e) {
          complaintData.lampiran = [];
        }
      }
      if (complaintData.pihak_terkait) {
        try {
          complaintData.pihak_terkait = JSON.parse(complaintData.pihak_terkait);
        } catch (e) {
          complaintData.pihak_terkait = [];
        }
      }
      return complaintData;
    });

    res.json({
      success: true,
      data: complaintsWithParsedLampiran,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data komplain',
      error: error.message
    });
  }
});

// Get complaint by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const complaint = await DaftarKomplain.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ]
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    const complaintData = complaint.toJSON();
    
    // Parse lampiran JSON if exists
    if (complaintData.lampiran) {
      try {
        complaintData.lampiran = JSON.parse(complaintData.lampiran);
      } catch (e) {
        complaintData.lampiran = [];
      }
    }
    
    // Parse pihak_terkait JSON if exists
    if (complaintData.pihak_terkait) {
      try {
        complaintData.pihak_terkait = JSON.parse(complaintData.pihak_terkait);
      } catch (e) {
        complaintData.pihak_terkait = [];
      }
    }

    res.json({
      success: true,
      data: complaintData
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data komplain',
      error: error.message
    });
  }
});

// Create new complaint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      judul_komplain,
      deskripsi_komplain,
      kategori,
      prioritas,
      penerima_komplain_id,
      pihak_terkait,
      lampiran,
      target_selesai
    } = req.body;

    // Get user from request (assuming middleware sets req.user)
    const pelapor_id = req.user?.id;
    
    if (!pelapor_id) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi'
      });
    }

    // Validate required fields
    if (!judul_komplain || !deskripsi_komplain) {
      return res.status(400).json({
        success: false,
        message: 'Judul dan deskripsi komplain harus diisi'
      });
    }

    // Create complaint
    const complaintData = {
      judul_komplain,
      deskripsi_komplain,
      kategori: kategori || 'lainnya',
      prioritas: prioritas || 'berproses',
      status: 'menunggu',
      pelapor_id,
      penerima_komplain_id,
      pihak_terkait: pihak_terkait ? JSON.stringify(pihak_terkait) : null,
      lampiran: lampiran ? JSON.stringify(lampiran) : null,
      target_selesai: target_selesai ? new Date(target_selesai) : null
    };

    const complaint = await DaftarKomplain.create(complaintData);

    // Get complaint with user data
    const complaintWithUser = await DaftarKomplain.findByPk(complaint.id, {
      include: [
        {
          model: User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ]
    });

    const complaintResponse = complaintWithUser.toJSON();
    
    // Parse JSON fields
    if (complaintResponse.lampiran) {
      try {
        complaintResponse.lampiran = JSON.parse(complaintResponse.lampiran);
      } catch (e) {
        complaintResponse.lampiran = [];
      }
    }
    
    if (complaintResponse.pihak_terkait) {
      try {
        complaintResponse.pihak_terkait = JSON.parse(complaintResponse.pihak_terkait);
      } catch (e) {
        complaintResponse.pihak_terkait = [];
      }
    }

    // Send notifications asynchronously (don't wait for it)
    try {
      // Get wsService instance from app
      const wsService = req.app.get('wsService');
      
      // Send notifications to penanggung jawab and pihak terkait
      sendKomplainNotification(complaintResponse, complaintResponse.Pelapor, wsService)
        .then(success => {
          if (success) {
            console.log(`✅ Komplain notifications sent successfully for complaint: ${judul_komplain}`);
          } else {
            console.log(`❌ Failed to send komplain notifications for complaint: ${judul_komplain}`);
          }
        })
        .catch(error => {
          console.error('Error sending komplain notifications:', error);
        });
    } catch (notificationError) {
      console.error('Error setting up komplain notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Komplain berhasil dibuat',
      data: complaintResponse
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat komplain',
      error: error.message
    });
  }
});

// Update complaint
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      judul_komplain,
      deskripsi_komplain,
      kategori,
      prioritas,
      status,
      penerima_komplain_id,
      pihak_terkait,
      lampiran,
      target_selesai,
      tanggal_selesai,
      catatan_admin,
      rating_kepuasan,
      komentar_kepuasan
    } = req.body;

    const complaint = await DaftarKomplain.findByPk(id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Update fields
    const updateData = {};
    
    if (judul_komplain !== undefined) updateData.judul_komplain = judul_komplain;
    if (deskripsi_komplain !== undefined) updateData.deskripsi_komplain = deskripsi_komplain;
    if (kategori !== undefined) updateData.kategori = kategori;
    if (prioritas !== undefined) updateData.prioritas = prioritas;
    if (status !== undefined) updateData.status = status;
    if (penerima_komplain_id !== undefined) updateData.penerima_komplain_id = penerima_komplain_id;
    if (pihak_terkait !== undefined) updateData.pihak_terkait = pihak_terkait ? JSON.stringify(pihak_terkait) : null;
    if (lampiran !== undefined) updateData.lampiran = lampiran ? JSON.stringify(lampiran) : null;
    if (target_selesai !== undefined) updateData.target_selesai = target_selesai ? new Date(target_selesai) : null;
    if (tanggal_selesai !== undefined) updateData.tanggal_selesai = tanggal_selesai ? new Date(tanggal_selesai) : null;
    if (catatan_admin !== undefined) updateData.catatan_admin = catatan_admin;
    if (rating_kepuasan !== undefined) updateData.rating_kepuasan = rating_kepuasan;
    if (komentar_kepuasan !== undefined) updateData.komentar_kepuasan = komentar_kepuasan;

    await complaint.update(updateData);

    // Get updated complaint with user data
    const updatedComplaint = await DaftarKomplain.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ]
    });

    const complaintResponse = updatedComplaint.toJSON();
    
    // Pastikan lampiran selalu array, bahkan jika null/undefined
    if (complaintResponse.lampiran) {
      try {
        complaintResponse.lampiran = JSON.parse(complaintResponse.lampiran);
      } catch (e) {
        console.error('Error parsing lampiran in update response:', e);
        complaintResponse.lampiran = [];
      }
    } else {
      complaintResponse.lampiran = []; // Inisialisasi sebagai array kosong jika null/undefined
    }
    
    if (complaintResponse.pihak_terkait) {
      try {
        complaintResponse.pihak_terkait = JSON.parse(complaintResponse.pihak_terkait);
      } catch (e) {
        complaintResponse.pihak_terkait = [];
      }
    } else {
      complaintResponse.pihak_terkait = []; // Inisialisasi sebagai array kosong jika null/undefined
    }

    // Send notifications asynchronously based on what was updated
    try {
      const wsService = req.app.get('wsService');
      
      // Check if this is a revision request (status changed to 'ditolak' by owner)
      if (status === 'ditolak' && req.user.role === 'owner') {
        sendKomplainRevisionNotification(complaintResponse, req.user, wsService)
          .then(success => {
            if (success) {
              console.log(`✅ Revision request notification sent successfully for komplain: ${complaintResponse.judul_komplain}`);
            } else {
              console.log(`❌ Failed to send revision request notification for komplain: ${complaintResponse.judul_komplain}`);
            }
          })
          .catch(error => {
            console.error('Error sending revision request notification:', error);
          });
      }
      
      // Check if this is a rating submission (rating_kepuasan is provided by owner)
      if (rating_kepuasan && rating_kepuasan > 0 && req.user.role === 'owner') {
        sendKomplainRatingNotification(complaintResponse, req.user, rating_kepuasan, komentar_kepuasan, wsService)
          .then(success => {
            if (success) {
              console.log(`✅ Rating notification sent successfully for komplain: ${complaintResponse.judul_komplain}`);
            } else {
              console.log(`❌ Failed to send rating notification for komplain: ${complaintResponse.judul_komplain}`);
            }
          })
          .catch(error => {
            console.error('Error sending rating notification:', error);
          });
      }
    } catch (notificationError) {
      console.error('Error setting up update notifications:', notificationError);
    }

    res.json({
      success: true,
      message: 'Komplain berhasil diperbarui',
      data: complaintResponse
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui komplain',
      error: error.message
    });
  }
});

// Delete complaint
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const complaint = await DaftarKomplain.findByPk(id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    await complaint.destroy();

    res.json({
      success: true,
      message: 'Komplain berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus komplain',
      error: error.message
    });
  }
});

// Get complaint statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const totalComplaints = await DaftarKomplain.count();
    
    const statusStats = await DaftarKomplain.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const priorityStats = await DaftarKomplain.findAll({
      attributes: [
        'prioritas',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['prioritas']
    });

    const categoryStats = await DaftarKomplain.findAll({
      attributes: [
        'kategori',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['kategori']
    });

    // Get recent complaints (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentComplaints = await DaftarKomplain.count({
      where: {
        created_at: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    res.json({
      success: true,
      data: {
        total: totalComplaints,
        recent: recentComplaints,
        byStatus: statusStats,
        byPriority: priorityStats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching complaint stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik komplain',
      error: error.message
    });
  }
});

// Upload lampiran untuk komplain (owner)
router.post('/:id/upload', authenticateToken, uploadMultipleKomplain, compressKomplainImages, handleKomplainUploadError, async (req, res) => {
  try {
    const { id } = req.params;
    
    const komplain = await DaftarKomplain.findByPk(id);
    
    if (!komplain) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Check if user is the owner of this komplain
    if (komplain.pelapor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke komplain ini'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }

    // Process uploaded files
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    }));

    // Get existing lampiran using utility function
    const existingLampiran = parseLampiranData(komplain.lampiran);

    // Add new files to existing lampiran
    const updatedLampiran = [...existingLampiran, ...uploadedFiles];

    // Update komplain with new lampiran - let Sequelize handle JSON field automatically
    await komplain.update({
      lampiran: updatedLampiran, // Don't manually stringify, let Sequelize handle it
      updated_at: new Date()
    });

    // Get updated komplain data
    const updatedKomplain = await DaftarKomplain.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ]
    });

    const komplainData = updatedKomplain.toJSON();
    
    // Parse lampiran dan pihak_terkait JSON
    if (komplainData.lampiran) {
      try {
        komplainData.lampiran = JSON.parse(komplainData.lampiran);
      } catch (e) {
        komplainData.lampiran = [];
      }
    } else {
      komplainData.lampiran = [];
    }
    
    if (komplainData.pihak_terkait) {
      try {
        komplainData.pihak_terkait = JSON.parse(komplainData.pihak_terkait);
      } catch (e) {
        komplainData.pihak_terkait = [];
      }
    } else {
      komplainData.pihak_terkait = [];
    }

    res.json({
      success: true,
      message: 'Lampiran berhasil diupload',
      data: komplainData
    });
  } catch (error) {
    console.error('Error uploading lampiran:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupload lampiran',
      error: error.message
    });
  }
});

module.exports = router; 