const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { DaftarKomplain } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  sendKomplainStatusUpdateNotification,
  sendKomplainCompletionNotification,
  sendKomplainLeaderNoteNotification,
  sendKomplainRejectedNotification,
  sendKomplainReprocessedNotification
} = require('../services/notificationService');

// Utility function to safely parse lampiran data
const parseLampiranData = (lampiranData) => {
  if (!lampiranData) return [];
  
  try {
    // If already an array, return as is
    if (Array.isArray(lampiranData)) {
      return lampiranData;
    }
    
    // If it's a string, try to parse it
    if (typeof lampiranData === 'string') {
      let parsed = JSON.parse(lampiranData);
      
      // Handle double encoding case
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      
      // Ensure it's an array
      return Array.isArray(parsed) ? parsed : [];
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing lampiran data:', error);
    return [];
  }
};

// Middleware untuk memastikan user adalah leader
const requireLeader = (req, res, next) => {
  if (req.user.role !== 'leader') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya leader yang dapat mengakses endpoint ini.'
    });
  }
  next();
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
    fileSize: 100 * 1024 * 1024, // 100MB limit - increased for large files
    files: 20 // Maximum 20 files per upload
  }
});

// Get all komplain for leader
router.get('/', authenticateToken, requireLeader, async (req, res) => {
  try {
    // Filter komplain berdasarkan penerima_komplain_id yang sesuai dengan leader yang sedang login
    const komplain = await DaftarKomplain.findAll({
      where: {
        penerima_komplain_id: req.user.id
      },
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

    // Parse lampiran dan pihak_terkait JSON - Sequelize JSON fields should already be parsed
    const komplainWithParsedData = komplain.map(complaint => {
      const complaintData = complaint.toJSON();
      
      // Handle lampiran using utility function
      complaintData.lampiran = parseLampiranData(complaintData.lampiran);
      
      // Handle pihak_terkait - Sequelize JSON field should already be parsed
      if (complaintData.pihak_terkait) {
        try {
          if (Array.isArray(complaintData.pihak_terkait)) {
            complaintData.pihak_terkait = complaintData.pihak_terkait;
          } else if (typeof complaintData.pihak_terkait === 'string') {
            complaintData.pihak_terkait = JSON.parse(complaintData.pihak_terkait);
          } else {
            complaintData.pihak_terkait = [];
          }
        } catch (e) {
          console.error('Error parsing pihak_terkait in list:', e);
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
    console.error('Error fetching komplain for leader:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data komplain'
    });
  }
});

// Get komplain detail for leader
router.get('/:id', authenticateToken, requireLeader, async (req, res) => {
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

    // Check if leader is the recipient of this komplain
    if (komplain.penerima_komplain_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke komplain ini'
      });
    }

    const komplainData = komplain.toJSON();
    
    // Parse JSON fields using utility function
    komplainData.lampiran = parseLampiranData(komplainData.lampiran);
    
    if (komplainData.pihak_terkait) {
      try {
        if (Array.isArray(komplainData.pihak_terkait)) {
          komplainData.pihak_terkait = komplainData.pihak_terkait;
        } else if (typeof komplainData.pihak_terkait === 'string') {
          komplainData.pihak_terkait = JSON.parse(komplainData.pihak_terkait);
        } else {
          komplainData.pihak_terkait = [];
        }
      } catch (e) {
        console.error('Error parsing pihak_terkait in detail:', e);
        komplainData.pihak_terkait = [];
      }
    }

    res.json({
      success: true,
      message: 'Detail komplain berhasil diambil',
      data: komplainData
    });
  } catch (error) {
    console.error('Error fetching komplain detail for leader:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail komplain'
    });
  }
});

// Add leader note to komplain
router.post('/:id/catatan', authenticateToken, requireLeader, async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan_leader } = req.body;

    if (!catatan_leader) {
      return res.status(400).json({
        success: false,
        message: 'Catatan leader harus diisi'
      });
    }

    const komplain = await DaftarKomplain.findByPk(id);

    if (!komplain) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Check if leader is the recipient of this komplain
    if (komplain.penerima_komplain_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke komplain ini'
      });
    }

    // Update komplain with leader note
    await komplain.update({
      catatan_leader: catatan_leader,
      updated_at: new Date()
    });

    // Send notification
    await sendKomplainLeaderNoteNotification(komplain.pelapor_id, komplain.id, catatan_leader);

    res.json({
      success: true,
      message: 'Catatan leader berhasil ditambahkan',
      data: komplain
    });
  } catch (error) {
    console.error('Error adding leader note:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan catatan leader'
    });
  }
});

// Update komplain status for leader
router.put('/:id/status', authenticateToken, requireLeader, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status harus diisi'
      });
    }

    const validStatuses = ['menunggu', 'diproses', 'selesai', 'ditolak'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }

    const komplain = await DaftarKomplain.findByPk(id);

    if (!komplain) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Check if leader is the recipient of this komplain
    if (komplain.penerima_komplain_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke komplain ini'
      });
    }

    // Update komplain status
    await komplain.update({
      status: status,
      updated_at: new Date()
    });

    // Send notification based on status
    if (status === 'selesai') {
      await sendKomplainCompletionNotification(komplain.pelapor_id, komplain.id);
    } else if (status === 'ditolak') {
      await sendKomplainRejectedNotification(komplain.pelapor_id, komplain.id);
    } else if (status === 'diproses') {
      await sendKomplainReprocessedNotification(komplain.pelapor_id, komplain.id);
    } else {
      await sendKomplainStatusUpdateNotification(komplain.pelapor_id, komplain.id, status);
    }

    res.json({
      success: true,
      message: 'Status komplain berhasil diperbarui',
      data: komplain
    });
  } catch (error) {
    console.error('Error updating komplain status for leader:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status komplain'
    });
  }
});

// Get komplain statistics for leader
router.get('/stats', authenticateToken, requireLeader, async (req, res) => {
  try {
    const leaderId = req.user.id;

    const stats = await DaftarKomplain.findAll({
      where: {
        penerima_komplain_id: leaderId
      },
      attributes: [
        'status',
        [require('../models').sequelize.fn('COUNT', require('../models').sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const formattedStats = {
      total: 0,
      menunggu: 0,
      diproses: 0,
      selesai: 0,
      ditolak: 0
    };

    stats.forEach(stat => {
      formattedStats[stat.status] = parseInt(stat.dataValues.count);
      formattedStats.total += parseInt(stat.dataValues.count);
    });

    res.json({
      success: true,
      message: 'Statistik komplain berhasil diambil',
      data: formattedStats
    });
  } catch (error) {
    console.error('Error fetching komplain stats for leader:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik komplain'
    });
  }
});

// Upload lampiran untuk komplain leader
router.post('/:id/lampiran', authenticateToken, requireLeader, upload.array('lampiran', 20), async (req, res) => {
  try {
    console.log('🔍 [leaderKomplain] Upload request received');
    console.log('🔍 [leaderKomplain] User ID:', req.user.id);
    console.log('🔍 [leaderKomplain] Komplain ID:', req.params.id);
    console.log('🔍 [leaderKomplain] Files count:', req.files ? req.files.length : 0);
    console.log('🔍 [leaderKomplain] Request body:', req.body);

    const { id } = req.params;
    const { catatan_leader } = req.body;

    const komplain = await DaftarKomplain.findByPk(id);

    if (!komplain) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Check if leader is the recipient of this komplain
    if (komplain.penerima_komplain_id !== req.user.id) {
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
    console.log('🔍 [leaderKomplain] Processing uploaded files...');
    const uploadedFiles = req.files.map((file, index) => {
      console.log(`🔍 [leaderKomplain] File ${index + 1}:`, {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        destination: file.destination
      });

      return {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      };
    });

    // Get existing lampiran using utility function
    const existingLampiran = parseLampiranData(komplain.lampiran);

    // Add new files to existing lampiran
    const updatedLampiran = [...existingLampiran, ...uploadedFiles];
    console.log('🔍 [leaderKomplain] Updated lampiran count:', updatedLampiran.length);

    // Update komplain with new lampiran - Sequelize JSON field handles stringify automatically
    console.log('🔍 [leaderKomplain] Updating database...');
    await komplain.update({
      lampiran: updatedLampiran, // Don't manually stringify, let Sequelize handle it
      catatan_leader: catatan_leader || komplain.catatan_leader,
      updated_at: new Date()
    });
    console.log('✅ [leaderKomplain] Database updated successfully');

    // Send notification
    console.log('🔍 [leaderKomplain] Sending notification...');
    console.log('🔍 [leaderKomplain] pelapor_id:', komplain.pelapor_id);
    console.log('🔍 [leaderKomplain] komplain_id:', komplain.id);
    console.log('🔍 [leaderKomplain] catatan_leader:', catatan_leader || 'Lampiran baru ditambahkan');
    
    if (komplain.pelapor_id && komplain.id) {
      await sendKomplainLeaderNoteNotification(komplain.pelapor_id, komplain.id, catatan_leader || 'Lampiran baru ditambahkan');
    } else {
      console.error('💥 [leaderKomplain] Missing pelapor_id or komplain_id for notification');
    }

    res.json({
      success: true,
      message: 'Lampiran berhasil diupload',
      data: {
        komplain: komplain,
        uploadedFiles: uploadedFiles
      }
    });
  } catch (error) {
    console.error('❌ [leaderKomplain] Error uploading lampiran:', error);
    console.error('❌ [leaderKomplain] Error stack:', error.stack);
    console.error('❌ [leaderKomplain] Error name:', error.name);
    console.error('❌ [leaderKomplain] Error message:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Gagal upload lampiran',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update catatan leader untuk komplain
router.put('/:id/catatan', authenticateToken, requireLeader, async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan_leader } = req.body;

    if (!catatan_leader) {
      return res.status(400).json({
        success: false,
        message: 'Catatan leader harus diisi'
      });
    }

    const komplain = await DaftarKomplain.findByPk(id);

    if (!komplain) {
      return res.status(404).json({
        success: false,
        message: 'Komplain tidak ditemukan'
      });
    }

    // Check if leader is the recipient of this komplain
    if (komplain.penerima_komplain_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke komplain ini'
      });
    }

    // Update komplain with leader note
    await komplain.update({
      catatan_leader: catatan_leader,
      updated_at: new Date()
    });

    // Send notification
    await sendKomplainLeaderNoteNotification(komplain.pelapor_id, komplain.id, catatan_leader);

    res.json({
      success: true,
      message: 'Catatan leader berhasil diperbarui',
      data: komplain
    });
  } catch (error) {
    console.error('Error updating catatan leader:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui catatan leader'
    });
  }
});

// Error handling middleware for multer errors
router.use((err, req, res, next) => {
  console.error("❌ [leaderKomplain] Upload error middleware triggered");
  console.error("❌ [leaderKomplain] Error:", err);
  console.error("❌ [leaderKomplain] Error name:", err.name);
  console.error("❌ [leaderKomplain] Error message:", err.message);

  if (err instanceof multer.MulterError) {
    console.error("❌ [leaderKomplain] Multer error code:", err.code);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File terlalu besar. Maksimal ukuran file adalah 100MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Terlalu banyak file. Maksimal 20 file per upload.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Field file tidak diharapkan.",
      });
    }
  }

  // Handle other upload errors
  if (err.message && err.message.includes("File type")) {
    return res.status(400).json({
      success: false,
      message: "Tipe file tidak didukung.",
    });
  }

  // Generic error handler
  console.error("❌ [leaderKomplain] Unhandled upload error:", err);
  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan saat mengupload file.",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;

