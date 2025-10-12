const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

const { DaftarKomplain } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  sendKomplainStatusUpdateNotification,
  sendKomplainCompletionNotification,
  sendKomplainAdminNoteNotification,
  sendKomplainRejectedNotification,
  sendKomplainReprocessedNotification
} = require('../services/notificationService');

// Middleware untuk memastikan user adalah admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang dapat mengakses endpoint ini.'
    });
  }
  next();
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/komplain';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allow image, video, PDF, and document files
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|mp4|avi|mov|wmv|flv|mkv|webm)$/i;
    const allowedMimeTypes = /^(image\/|video\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|text\/)/;
    
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, video, PDF, and document files are allowed!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit untuk video
  }
});

// Get all komplain for admin/owner
// Default: hanya komplain yang ditugaskan ke user (assigned)
// Gunakan ?scope=all untuk melihat semua komplain
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const scope = (req.query.scope || '').toString().toLowerCase();
    const where = {};
    if (scope !== 'all') {
      // Filter komplain berdasarkan penerima_komplain_id yang sesuai dengan user yang sedang login
      where.penerima_komplain_id = req.user.id;
    }

    const komplain = await DaftarKomplain.findAll({
      where,
      include: [
        {
          model: require('../models').User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: require('../models').User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Parse lampiran dan pihak_terkait JSON seperti owner
    const komplainWithParsedData = komplain.map(complaint => {
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
      message: 'Data komplain berhasil diambil',
      data: komplainWithParsedData
    });
  } catch (error) {
    console.error('Error fetching komplain for admin/owner:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data komplain'
    });
  }
});

// Get komplain detail for admin/owner
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const komplain = await DaftarKomplain.findByPk(id, {
      include: [
        {
          model: require('../models').User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: require('../models').User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ]
    });

    if (!komplain) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Parse lampiran dan pihak_terkait JSON seperti owner
    const komplainData = komplain.toJSON();
    if (komplainData.lampiran) {
      try {
        komplainData.lampiran = JSON.parse(komplainData.lampiran);
      } catch (e) {
        komplainData.lampiran = [];
      }
    }
    if (komplainData.pihak_terkait) {
      try {
        komplainData.pihak_terkait = JSON.parse(komplainData.pihak_terkait);
      } catch (e) {
        komplainData.pihak_terkait = [];
      }
    }

    res.json({
      success: true,
      message: 'Detail komplain berhasil diambil',
      data: komplainData
    });
  } catch (error) {
    console.error('Error fetching komplain detail for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail komplain'
    });
  }
});

// Update komplain status
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validasi status
    const validStatuses = ['menunggu', 'diproses', 'selesai', 'ditolak'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid. Status yang diperbolehkan: menunggu, diproses, selesai, ditolak'
      });
    }

    const komplain = await DaftarKomplain.findByPk(id);
    
    if (!komplain) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Update status
    await komplain.update({
      status: status,
      updated_at: new Date()
    });

    // Ambil data yang sudah diupdate
    const updatedKomplain = await DaftarKomplain.findByPk(id, {
      include: [
        {
          model: require('../models').User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: require('../models').User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ]
    });

    // Parse lampiran dan pihak_terkait JSON seperti owner
    const komplainData = updatedKomplain.toJSON();
    if (komplainData.lampiran) {
      try {
        komplainData.lampiran = JSON.parse(komplainData.lampiran);
      } catch (e) {
        komplainData.lampiran = [];
      }
    }
    if (komplainData.pihak_terkait) {
      try {
        komplainData.pihak_terkait = JSON.parse(komplainData.pihak_terkait);
      } catch (e) {
        komplainData.pihak_terkait = [];
      }
    }

    // Send notification asynchronously (don't wait for it)
    try {
      // Get wsService instance from app
      const wsService = req.app.get('wsService');
      
      // Send notification to pelapor (owner) about status update
      sendKomplainStatusUpdateNotification(komplainData, req.user, wsService)
        .then(success => {
          if (success) {
            console.log(`✅ Status update notification sent successfully for komplain: ${komplainData.judul_komplain}`);
          } else {
            console.log(`❌ Failed to send status update notification for komplain: ${komplainData.judul_komplain}`);
          }
        })
        .catch(error => {
          console.error('Error sending status update notification:', error);
        });

      // Send special notification if status is rejected
      if (status === 'ditolak') {
        sendKomplainRejectedNotification(komplainData, req.user, wsService)
          .then(success => {
            if (success) {
              console.log(`✅ Rejection notification sent successfully for komplain: ${komplainData.judul_komplain}`);
            } else {
              console.log(`❌ Failed to send rejection notification for komplain: ${komplainData.judul_komplain}`);
            }
          })
          .catch(error => {
            console.error('Error sending rejection notification:', error);
          });
      }

      // Send special notification if status is reprocessed (from ditolak to diproses)
      if (status === 'diproses') {
        // Check if previous status was ditolak
        const previousStatus = komplain.status;
        if (previousStatus === 'ditolak') {
          sendKomplainReprocessedNotification(komplainData, req.user, wsService)
            .then(success => {
              if (success) {
                console.log(`✅ Reprocessed notification sent successfully for komplain: ${komplainData.judul_komplain}`);
              } else {
                console.log(`❌ Failed to send reprocessed notification for komplain: ${komplainData.judul_komplain}`);
              }
            })
            .catch(error => {
              console.error('Error sending reprocessed notification:', error);
            });
        }
      }
    } catch (notificationError) {
      console.error('Error setting up status update notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Status komplain berhasil diperbarui',
      data: komplainData
    });
  } catch (error) {
    console.error('Error updating komplain status:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status komplain'
    });
  }
});

// Get komplain statistics for admin
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalKomplain = await DaftarKomplain.count();
    const pendingKomplain = await DaftarKomplain.count({
      where: { status: 'menunggu' }
    });
    const prosesKomplain = await DaftarKomplain.count({
      where: { status: 'diproses' }
    });
    const selesaiKomplain = await DaftarKomplain.count({
      where: { status: 'selesai' }
    });

    // Komplain dalam 7 hari terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentKomplain = await DaftarKomplain.count({
      where: {
        created_at: {
          [require('sequelize').Op.gte]: sevenDaysAgo
        }
      }
    });

    res.json({
      success: true,
      message: 'Statistik komplain berhasil diambil',
      data: {
        total: totalKomplain,
        pending: pendingKomplain,
        proses: prosesKomplain,
        selesai: selesaiKomplain,
        recent: recentKomplain
      }
    });
  } catch (error) {
    console.error('Error fetching komplain stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik komplain'
    });
  }
});

// Add admin note to komplain
router.put('/:id/note', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan_admin } = req.body;

    if (!catatan_admin || catatan_admin.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Catatan admin tidak boleh kosong'
      });
    }

    const komplain = await DaftarKomplain.findByPk(id);
    
    if (!komplain) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Update catatan admin
    await komplain.update({
      catatan_admin: catatan_admin.trim(),
      updated_at: new Date()
    });

    // Ambil data yang sudah diupdate
    const updatedKomplain = await DaftarKomplain.findByPk(id, {
      include: [
        {
          model: require('../models').User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: require('../models').User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ]
    });

    // Parse lampiran dan pihak_terkait JSON seperti owner
    const komplainData = updatedKomplain.toJSON();
    if (komplainData.lampiran) {
      try {
        komplainData.lampiran = JSON.parse(komplainData.lampiran);
      } catch (e) {
        komplainData.lampiran = [];
      }
    }
    if (komplainData.pihak_terkait) {
      try {
        komplainData.pihak_terkait = JSON.parse(komplainData.pihak_terkait);
      } catch (e) {
        komplainData.pihak_terkait = [];
      }
    }

    // Send notification asynchronously (don't wait for it)
    try {
      // Get wsService instance from app
      const wsService = req.app.get('wsService');
      
      // Send notification to pelapor (owner) about admin note
      sendKomplainAdminNoteNotification(komplainData, req.user, wsService)
        .then(success => {
          if (success) {
            console.log(`✅ Admin note notification sent successfully for komplain: ${komplainData.judul_komplain}`);
          } else {
            console.log(`❌ Failed to send admin note notification for komplain: ${komplainData.judul_komplain}`);
          }
        })
        .catch(error => {
          console.error('Error sending admin note notification:', error);
        });
    } catch (notificationError) {
      console.error('Error setting up admin note notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Catatan admin berhasil ditambahkan',
      data: komplainData
    });
  } catch (error) {
    console.error('Error adding admin note:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan catatan admin'
    });
  }
});

// Upload lampiran untuk komplain
router.post('/:id/upload', authenticateToken, requireAdmin, upload.array('lampiran', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan_admin } = req.body;

    const komplain = await DaftarKomplain.findByPk(id);
    
    if (!komplain) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Add new files to lampiran (ganti lampiran lama dengan yang baru)
    const newFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    const updatedLampiran = newFiles; // Ganti dengan file baru saja

    // Update komplain with new lampiran, catatan_admin, and status selesai
    const updateData = {
      lampiran: JSON.stringify(updatedLampiran),
      status: 'selesai', // Otomatis selesai setelah upload
      tanggal_selesai: new Date(), // Update tanggal_selesai dengan waktu upload
      updated_at: new Date(),
      catatan_admin: catatan_admin.trim() // Catatan admin wajib ada
    };

    await komplain.update(updateData);

    // Get updated komplain data
    const updatedKomplain = await DaftarKomplain.findByPk(id, {
      include: [
        {
          model: require('../models').User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: require('../models').User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ]
    });

    // Parse lampiran dan pihak_terkait JSON seperti owner
    const komplainData = updatedKomplain.toJSON();
    if (komplainData.lampiran) {
      try {
        // Pastikan lampiran adalah array yang valid
        if (typeof komplainData.lampiran === 'string') {
          komplainData.lampiran = JSON.parse(komplainData.lampiran);
        } else if (Array.isArray(komplainData.lampiran)) {
          // Sudah dalam bentuk array, tidak perlu parsing lagi
        } else {
          komplainData.lampiran = [];
        }
      } catch (e) {
        console.error('Error parsing lampiran in response:', e);
        komplainData.lampiran = [];
      }
    }
    if (komplainData.pihak_terkait) {
      try {
        komplainData.pihak_terkait = JSON.parse(komplainData.pihak_terkait);
      } catch (e) {
        komplainData.pihak_terkait = [];
      }
    }

    // Send notification asynchronously (don't wait for it)
    try {
      // Get wsService instance from app
      const wsService = req.app.get('wsService');
      
      // Send notification to pelapor (owner) about komplain completion
      sendKomplainCompletionNotification(komplainData, req.user, wsService)
        .then(success => {
          if (success) {
            console.log(`✅ Completion notification sent successfully for komplain: ${komplainData.judul_komplain}`);
          } else {
            console.log(`❌ Failed to send completion notification for komplain: ${komplainData.judul_komplain}`);
          }
        })
        .catch(error => {
          console.error('Error sending completion notification:', error);
        });
    } catch (notificationError) {
      console.error('Error setting up completion notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Lampiran berhasil diupload dan status komplain selesai',
      data: komplainData
    });
  } catch (error) {
    console.error('Error uploading lampiran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal upload lampiran'
    });
  }
});

// Update catatan admin untuk komplain
router.put('/:id/catatan', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan_admin } = req.body;

    if (!catatan_admin || catatan_admin.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Catatan admin tidak boleh kosong'
      });
    }

    const komplain = await DaftarKomplain.findByPk(id);
    
    if (!komplain) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Update catatan admin
    await komplain.update({
      catatan_admin: catatan_admin.trim(),
      updated_at: new Date()
    });

    // Ambil data yang sudah diupdate
    const updatedKomplain = await DaftarKomplain.findByPk(id, {
      include: [
        {
          model: require('../models').User,
          as: 'Pelapor',
          attributes: ['id', 'nama', 'email', 'role']
        },
        {
          model: require('../models').User,
          as: 'PenerimaKomplain',
          attributes: ['id', 'nama', 'email', 'role']
        }
      ]
    });

    // Parse lampiran dan pihak_terkait JSON seperti owner
    const komplainData = updatedKomplain.toJSON();
    if (komplainData.lampiran) {
      try {
        komplainData.lampiran = JSON.parse(komplainData.lampiran);
      } catch (e) {
        komplainData.lampiran = [];
      }
    }
    if (komplainData.pihak_terkait) {
      try {
        komplainData.pihak_terkait = JSON.parse(komplainData.pihak_terkait);
      } catch (e) {
        komplainData.pihak_terkait = [];
      }
    }

    res.json({
      success: true,
      message: 'Catatan admin berhasil diperbarui',
      data: komplainData
    });
  } catch (error) {
    console.error('Error updating catatan admin:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui catatan admin'
    });
  }
});

module.exports = router; 