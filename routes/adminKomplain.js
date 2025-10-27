const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

const { DaftarKomplain } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

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
    fileSize: 100 * 1024 * 1024, // 100MB limit untuk video dan dokumen
    files: 20 // Maximum 20 files per upload
  }
});

// Middleware untuk kompresi gambar komplain
const compressKomplainImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const compressedFiles = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      // Check if file is an image
      if (file.mimetype && file.mimetype.startsWith('image/')) {
        try {
          // Read the uploaded file
          const fileBuffer = fs.readFileSync(file.path);
          
          // Generate compressed filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const compressedFilename = `compressed-${uniqueSuffix}.jpg`;
          const compressedPath = path.join(path.dirname(file.path), compressedFilename);
          
          // Compress and resize image using Sharp
          await sharp(fileBuffer)
            .rotate() // Auto-rotate based on EXIF orientation
            .resize(1200, 1200, { // Resize to max 1200x1200 pixels
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ 
              quality: 85, // 85% quality
              progressive: true,
              mozjpeg: true
            })
            .toFile(compressedPath);
          
          // Delete original file
          fs.unlinkSync(file.path);
          
          // Update file info with compressed version
          file.filename = compressedFilename;
          file.path = compressedPath;
          file.size = fs.statSync(compressedPath).size;
          file.mimetype = 'image/jpeg'; // Always JPEG after compression
          
          compressedFiles.push(file);
        } catch (compressError) {
          console.error(`Error compressing image ${file.originalname}:`, compressError);
          // Keep original file if compression fails
          compressedFiles.push(file);
        }
      } else {
        // Keep non-image files as is
        compressedFiles.push(file);
      }
    }
    
    // Update req.files with processed files
    req.files = compressedFiles;
    next();
  } catch (error) {
    console.error('Error in compressKomplainImages middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengkompres gambar komplain'
    });
  }
};

// Get all komplain for admin/owner
// Default: hanya komplain yang ditugaskan ke user (assigned)
// Gunakan ?scope=all untuk melihat semua komplain
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const scope = (req.query.scope || '').toString().toLowerCase();
    const userId = req.user.id;
    const where = {};

    // Default: hanya assigned ke user
    // scope=all -> semua komplain
    // scope=related -> hanya komplain dimana user termasuk pihak_terkait
    // scope=assigned_or_related -> komplain assigned ke user ATAU user termasuk pihak_terkait
    const needAll = scope === 'all' || scope === 'related' || scope === 'assigned_or_related';
    if (!needAll) {
      // assigned only (default)
      where.penerima_komplain_id = userId;
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

    // Parse lampiran dan pihak_terkait JSON serta lakukan filter sesuai scope
    const parsed = komplain.map(complaint => {
      const complaintData = complaint.toJSON();
      // Parse lampiran robust (handle double-encoded)
      if (complaintData.lampiran) {
        try {
          let val = complaintData.lampiran;
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch {}
            if (typeof val === 'string') {
              try { val = JSON.parse(val); } catch {}
            }
          }
          if (!Array.isArray(val)) val = [];
          complaintData.lampiran = val;
        } catch {
          complaintData.lampiran = [];
        }
      }
      // Parse pihak_terkait robust (handle double-encoded)
      if (complaintData.pihak_terkait) {
        try {
          let val = complaintData.pihak_terkait;
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch {}
            if (typeof val === 'string') {
              try { val = JSON.parse(val); } catch {}
            }
          }
          if (!Array.isArray(val)) val = [];
          complaintData.pihak_terkait = val;
        } catch {
          complaintData.pihak_terkait = [];
        }
      }
      return complaintData;
    });

    let filtered = parsed;
    if (scope === 'related') {
      filtered = parsed.filter(item => {
        const pt = item?.pihak_terkait;
        if (!Array.isArray(pt)) return false;
        return pt.some(x => {
          if (typeof x === 'number') return x === userId;
          if (typeof x === 'string') {
            const num = parseInt(x, 10);
            return !Number.isNaN(num) && num === userId;
          }
          if (x && typeof x === 'object') {
            return x.id === userId || x.user_id === userId || x.UserId === userId;
          }
          return false;
        });
      });
    } else if (scope === 'assigned_or_related') {
      filtered = parsed.filter(item => {
        const assigned = (item?.penerima_komplain_id === userId) || (item?.PenerimaKomplain?.id === userId);
        let related = false;
        const pt = item?.pihak_terkait;
        if (Array.isArray(pt)) {
          related = pt.some(x => {
            if (typeof x === 'number') return x === userId;
            if (typeof x === 'string') {
              const num = parseInt(x, 10);
              return !Number.isNaN(num) && num === userId;
            }
            if (x && typeof x === 'object') {
              return x.id === userId || x.user_id === userId || x.UserId === userId;
            }
            return false;
          });
        }
        return assigned || related;
      });
    }

    res.json({
      success: true,
      message: 'Data komplain berhasil diambil',
      data: filtered
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
    
    // Parse lampiran using utility function
    komplainData.lampiran = parseLampiranData(komplainData.lampiran);
    
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
    // Parse lampiran using utility function
    komplainData.lampiran = parseLampiranData(komplainData.lampiran);
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
    // Parse lampiran using utility function
    komplainData.lampiran = parseLampiranData(komplainData.lampiran);
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
router.post('/:id/upload', authenticateToken, requireAdmin, upload.array('lampiran', 20), compressKomplainImages, async (req, res) => {
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

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }

    // Add new files to existing lampiran (append, not replace)
    const newFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Get existing lampiran using utility function
    const existingLampiran = parseLampiranData(komplain.lampiran);

    // Add new files to existing lampiran
    const updatedLampiran = [...existingLampiran, ...newFiles];

    // Update komplain with new lampiran, catatan_admin, and status selesai
    // Let Sequelize handle JSON field automatically (don't manually stringify)
    const updateData = {
      lampiran: updatedLampiran, // Don't manually stringify, let Sequelize handle it
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
    
    // Parse lampiran using utility function
    komplainData.lampiran = parseLampiranData(komplainData.lampiran);
    
    if (komplainData.pihak_terkait) {
      try {
        komplainData.pihak_terkait = JSON.parse(komplainData.pihak_terkait);
      } catch (e) {
        komplainData.pihak_terkait = [];
      }
    } else {
      komplainData.pihak_terkait = [];
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
    // Parse lampiran using utility function
    komplainData.lampiran = parseLampiranData(komplainData.lampiran);
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

// Error handling middleware untuk multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar. Maksimal ukuran adalah 100MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Terlalu banyak file. Maksimal 20 file per upload.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Field file tidak diharapkan.'
      });
    }
  }
  
  if (error.message === 'Only image, video, PDF, and document files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Hanya file gambar, video, PDF, dan dokumen yang diperbolehkan!'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Error uploading file komplain'
  });
});

module.exports = router; 