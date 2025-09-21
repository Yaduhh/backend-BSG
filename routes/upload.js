const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { uploadMultiple, handleUploadError } = require("../middleware/upload");
const { authenticateToken } = require("../middleware/auth");
const { VideoManage } = require('../models');

// Configure storage for POSKAS images
const poskasStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");
    const poskasDir = path.join(uploadsDir, "poskas");

    // Create poskas directory if it doesn't exist
    if (!require("fs").existsSync(poskasDir)) {
      require("fs").mkdirSync(poskasDir, { recursive: true });
    }

    cb(null, poskasDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "poskas-" + uniqueSuffix + ext);
  },
});

// Configure storage for VIDEO-MANAGE (per role admin/leader)
const videoManageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");
    const baseDir = path.join(uploadsDir, "video-manage");
    // role dari param route (admin/leader)
    const role = (req.params && req.params.role) || 'general';
    const roleDir = path.join(baseDir, role);
    if (!fs.existsSync(roleDir)) {
      fs.mkdirSync(roleDir, { recursive: true });
    }
    cb(null, roleDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const videoManageUpload = multer({
  storage: videoManageStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for VIDEO MANAGE'), false);
    }
  },
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
    files: 1,
  },
});

// Helper to update config.json with current active video per role
const updateVideoManageConfig = (role, filePath) => {
  const uploadsDir = path.join(__dirname, "../uploads");
  const baseDir = path.join(uploadsDir, "video-manage");
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
  const configPath = path.join(baseDir, 'config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8')) || {};
    } catch (e) {
      config = {};
    }
  }
  // compute relative path and url
  const relativePath = path.relative(uploadsDir, filePath).replace(/\\/g, '/');
  config[role] = {
    path: relativePath,
    url: `/uploads/${relativePath}`,
    filename: path.basename(filePath),
    uploadedAt: new Date().toISOString(),
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return config[role];
}

// GET current video for role
router.get('/video-manage/:role', authenticateToken, async (req, res) => {
  try {
    const role = req.params.role;
    // Coba ambil dari DB lebih dulu
    const active = await VideoManage.findOne({ where: { role, active: true }, order: [['created_at', 'DESC']] });
    if (active) {
      return res.json({ success: true, data: {
        id: active.id,
        role: active.role,
        url: active.url,
        path: active.path,
        filename: active.filename,
        uploadedAt: active.created_at
      }});
    }
    // Fallback ke config.json jika belum ada di DB
    const uploadsDir = path.join(__dirname, "../uploads");
    const baseDir = path.join(uploadsDir, "video-manage");
    const configPath = path.join(baseDir, 'config.json');
    if (!fs.existsSync(configPath)) {
      return res.json({ success: true, data: null });
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) || {};
    const data = config[role] || null;
    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error reading current video:', error);
    return res.status(500).json({ success: false, message: 'Error reading current video' });
  }
});

// POST upload new video for role (field name: 'video')
router.post('/video-manage/:role', authenticateToken, (req, res) => {
  const role = req.params.role;
  // batasi target role yang valid
  if (!['admin', 'leader'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  // hanya user dengan role admin atau owner yang boleh upload
  const userRole = req.user?.role;
  if (!['admin', 'owner'].includes(userRole)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient permission' });
  }

  videoManageUpload.single('video')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 200MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: 'Only one video allowed per upload.' });
      }
      return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Only video files are allowed.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No video uploaded' });
      }
      // Update config.json untuk kompatibilitas
      const info = updateVideoManageConfig(role, req.file.path);
      // Simpan ke DB dan jadikan aktif, nonaktifkan yang lain pada role sama
      await VideoManage.update({ active: false }, { where: { role } });
      const created = await VideoManage.create({
        role,
        filename: req.file.filename,
        path: info.path,
        url: info.url,
        mimetype: req.file.mimetype,
        size: req.file.size,
        active: true,
        uploaded_by: req.user?.id || null
      });
      return res.json({ success: true, message: 'Video uploaded successfully', data: {
        id: created.id,
        role: created.role,
        url: created.url,
        path: created.path,
        filename: created.filename,
        uploadedAt: created.created_at
      }});
    } catch (error) {
      console.error('❌ Error uploading video-manage:', error);
      return res.status(500).json({ success: false, message: 'Error uploading video' });
    }
  });
});

// LIST videos per role (admin/owner only)
router.get('/video-manage/:role/list', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'owner'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permission' });
    }
    const role = req.params.role;
    const items = await VideoManage.findAll({ where: { role }, order: [['created_at', 'DESC']] });
    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('❌ Error listing videos:', error);
    return res.status(500).json({ success: false, message: 'Error listing videos' });
  }
});

// ACTIVATE a video by id (admin/owner only)
router.patch('/video-manage/:id/activate', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'owner'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permission' });
    }
    const id = req.params.id;
    const item = await VideoManage.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Video not found' });
    await VideoManage.update({ active: false }, { where: { role: item.role } });
    item.active = true;
    await item.save();
    return res.json({ success: true, message: 'Video activated', data: item });
  } catch (error) {
    console.error('❌ Error activating video:', error);
    return res.status(500).json({ success: false, message: 'Error activating video' });
  }
});

// DELETE a video by id (admin/owner only)
router.delete('/video-manage/:id', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'owner'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permission' });
    }
    const id = req.params.id;
    const item = await VideoManage.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Video not found' });
    // Hapus file fisik jika ada
    const uploadsDir = path.join(__dirname, "../uploads");
    const absolutePath = path.join(uploadsDir, item.path);
    try {
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    } catch (e) {
      console.warn('⚠️ Failed to remove file:', absolutePath, e?.message);
    }
    await item.destroy();
    return res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    console.error('❌ Error deleting video:', error);
    return res.status(500).json({ success: false, message: 'Error deleting video' });
  }
});

// Configure storage for TARGET images
const targetStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");
    const targetDir = path.join(uploadsDir, "target");

    // Create target directory if it doesn't exist
    if (!require("fs").existsSync(targetDir)) {
      require("fs").mkdirSync(targetDir, { recursive: true });
    }

    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "target-" + uniqueSuffix + ext);
  },
});

// Configure storage for MEDIA SOSIAL images
const mediaSosialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");
    const mediaSosialDir = path.join(uploadsDir, "media-sosial");

    // Create media-sosial directory if it doesn't exist
    if (!require("fs").existsSync(mediaSosialDir)) {
      require("fs").mkdirSync(mediaSosialDir, { recursive: true });
    }

    cb(null, mediaSosialDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "media-sosial-" + uniqueSuffix + ext);
  },
});
// Note: requires 'Authorization: Bearer <token>' header
// and expects field name 'image'.

// Configure storage for OMSET HARIAN images
const omsetHarianStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");
    const omsetHarianDir = path.join(uploadsDir, "omset-harian");

    // Create omset-harian directory if it doesn't exist
    if (!require("fs").existsSync(omsetHarianDir)) {
      require("fs").mkdirSync(omsetHarianDir, { recursive: true });
    }

    cb(null, omsetHarianDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "omset-harian-" + uniqueSuffix + ext);
  },
});

// Configure storage for LAPORAN KEUANGAN images
const laporanKeuanganStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");
    const laporanKeuanganDir = path.join(uploadsDir, "laporan-keuangan");

    // Create laporan-keuangan directory if it doesn't exist
    if (!require("fs").existsSync(laporanKeuanganDir)) {
      require("fs").mkdirSync(laporanKeuanganDir, { recursive: true });
    }

    cb(null, laporanKeuanganDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "laporan-keuangan-" + uniqueSuffix + ext);
  },
});

// Configure storage for ANEKA GRAFIK images
const anekaGrafikStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");
    const anekaGrafikDir = path.join(uploadsDir, "aneka-grafik");

    // Create aneka-grafik directory if it doesn't exist
    if (!require("fs").existsSync(anekaGrafikDir)) {
      require("fs").mkdirSync(anekaGrafikDir, { recursive: true });
    }

    cb(null, anekaGrafikDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "aneka-grafik-" + uniqueSuffix + ext);
  },
});

// Configure multer for POSKAS uploads
const poskasUpload = multer({
  storage: poskasStorage,
  fileFilter: (req, file, cb) => {
    // Allow only images for POSKAS
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for POSKAS"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for POSKAS images
    files: 50, // Maximum 50 images per POSKAS (increased from 5)
  },
});

// Configure multer for OMSET HARIAN uploads
const omsetHarianUpload = multer({
  storage: omsetHarianStorage,
  fileFilter: (req, file, cb) => {
    // Allow only images for OMSET HARIAN
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for OMSET HARIAN"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for OMSET HARIAN images
    files: 50, // Maximum 50 images per OMSET HARIAN (increased from 5)
  },
});

// Configure multer for TARGET uploads
const targetUpload = multer({
  storage: targetStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for TARGET'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per image
    files: 50,
  },
});

// Configure multer for LAPORAN KEUANGAN uploads
const laporanKeuanganUpload = multer({
  storage: laporanKeuanganStorage,
  fileFilter: (req, file, cb) => {
    // Allow only images for LAPORAN KEUANGAN
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for LAPORAN KEUANGAN"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for LAPORAN KEUANGAN images
    files: 5, // Maximum 5 images per LAPORAN KEUANGAN
  },
});

// Configure multer for ANEKA GRAFIK uploads
const anekaGrafikUpload = multer({
  storage: anekaGrafikStorage,
  fileFilter: (req, file, cb) => {
    // Allow only images for ANEKA GRAFIK
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for ANEKA GRAFIK"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for ANEKA GRAFIK images
    files: 5, // Maximum 5 images per ANEKA GRAFIK
  },
});

// Configure multer for MEDIA SOSIAL uploads
const mediaSosialUpload = multer({
  storage: mediaSosialStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for MEDIA SOSIAL'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 50,
  },
});

// Configure storage for KPI images
const kpiStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");
    const kpiDir = path.join(uploadsDir, "KPI");

    // Create KPI directory if it doesn't exist
    if (!require("fs").existsSync(kpiDir)) {
      require("fs").mkdirSync(kpiDir, { recursive: true });
    }

    cb(null, kpiDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "kpi-" + uniqueSuffix + ext);
  },
});

// Configure multer for KPI uploads (single image)
const kpiUpload = multer({
  storage: kpiStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for KPI"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for KPI images
  },
});

// Upload KPI image (single file)
router.post(
  "/kpi",
  authenticateToken,
  kpiUpload.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

      // Create relative path for database storage
      const relativePath = path.relative(
        path.join(__dirname, "../uploads"),
        req.file.path
      );
      const fileInfo = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: relativePath.replace(/\\/g, "/"), // Convert Windows path to URL format
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${relativePath.replace(/\\/g, "/")}`, // URL for accessing the file
      };

      return res.json({
        success: true,
        message: "KPI image uploaded successfully",
        data: fileInfo,
      });
    } catch (error) {
      console.error("❌ Error uploading KPI image:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading KPI image",
      });
    }
  }
);

// Upload multiple files
router.post("/files", uploadMultiple, (req, res) => {
  console.log("📁 Upload request received");
  console.log("📁 Request headers:", req.headers);
  console.log("📁 Request body type:", typeof req.body);
  console.log("📁 Files:", req.files ? req.files.length : 0);
  console.log(
    "📁 Files details:",
    req.files
      ? req.files.map((f) => ({
          fieldname: f.fieldname,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          path: f.path,
        }))
      : "No files"
  );

  try {
    if (!req.files || req.files.length === 0) {
      console.log("❌ No files uploaded");
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    console.log("📁 Processing uploaded files...");
    const uploadedFiles = req.files.map((file, index) => {
      console.log(`📁 Processing file ${index + 1}:`, {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      });

      // Create relative path for database storage
      const relativePath = path.relative(
        path.join(__dirname, "../uploads"),
        file.path
      );

      const fileInfo = {
        originalName: file.originalname,
        filename: file.filename,
        path: relativePath.replace(/\\/g, "/"), // Convert Windows path to URL format
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${relativePath.replace(/\\/g, "/")}`, // URL for accessing the file
      };

      console.log("📁 File processed:", fileInfo);
      return fileInfo;
    });

    console.log(
      "✅ Upload successful, returning:",
      uploadedFiles.length,
      "files"
    );
    res.json({
      success: true,
      message: "Files uploaded successfully",
      data: uploadedFiles,
    });
  } catch (error) {
    console.error("❌ Error uploading files:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error uploading files",
    });
  }
});

// Upload POSKAS images
router.post("/poskas", authenticateToken, (req, res, next) => {
  console.log("📁 POSKAS upload request received");
  console.log("📁 User:", req.user.id);

  poskasUpload.array("images", 50)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("❌ Multer error in POSKAS upload:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 10MB per image.",
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Too many files. Maximum is 50 images per POSKAS.",
        });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: 'Invalid field name. Use "images" field for uploading.',
        });
      }
      return res.status(400).json({
        success: false,
        message: "Upload error: " + err.message,
      });
    } else if (err) {
      console.error("❌ Unknown error in POSKAS upload:", err);
      return res.status(400).json({
        success: false,
        message:
          err.message || "Only image files are allowed for POSKAS uploads.",
      });
    }

    console.log("📁 Files:", req.files ? req.files.length : 0);

    try {
      if (!req.files || req.files.length === 0) {
        console.log("❌ No POSKAS images uploaded");
        return res.status(400).json({
          success: false,
          message: "No images uploaded",
        });
      }

      console.log("📁 Processing POSKAS images...");
      const uploadedFiles = req.files.map((file, index) => {
        console.log(`📁 Processing POSKAS image ${index + 1}:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
        });

        // Create relative path for database storage
        const relativePath = path.relative(
          path.join(__dirname, "../uploads"),
          file.path
        );

        const fileInfo = {
          originalName: file.originalname,
          filename: file.filename,
          path: relativePath.replace(/\\/g, "/"), // Convert Windows path to URL format
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${relativePath.replace(/\\/g, "/")}`, // URL for accessing the file
        };

        console.log("📁 POSKAS image processed:", fileInfo);
        return fileInfo;
      });

      console.log(
        "✅ POSKAS upload successful, returning:",
        uploadedFiles.length,
        "images"
      );
      res.json({
        success: true,
        message: "POSKAS images uploaded successfully",
        data: uploadedFiles,
      });
    } catch (error) {
      console.error("❌ Error uploading POSKAS images:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Error uploading POSKAS images",
      });
    }
  });
});

// Upload TARGET images
router.post("/target", authenticateToken, (req, res, next) => {
  targetUpload.array("images", 50)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File too large. Maximum size is 10MB per image." });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, message: "Too many files. Maximum is 50 images per TARGET." });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ success: false, message: 'Invalid field name. Use "images" field for uploading.' });
      }
      return res.status(400).json({ success: false, message: "Upload error: " + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message || "Only image files are allowed for TARGET uploads." });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No images uploaded" });
      }

      const uploadedFiles = req.files.map((file) => {
        const relativePath = path.relative(path.join(__dirname, "../uploads"), file.path);
        return {
          originalName: file.originalname,
          filename: file.filename,
          path: relativePath.replace(/\\/g, "/"),
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${relativePath.replace(/\\/g, "/")}`,
        };
      });

      res.json({ success: true, message: "TARGET images uploaded successfully", data: uploadedFiles });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error uploading TARGET images" });
    }
  });
});

// Upload OMSET HARIAN images
router.post("/omset-harian", authenticateToken, (req, res, next) => {
  omsetHarianUpload.array("images", 50)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File too large. Maximum size is 10MB per image." });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, message: "Too many files. Maximum is 50 images per OMSET HARIAN." });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ success: false, message: 'Invalid field name. Use "images" field for uploading.' });
      }
      return res.status(400).json({ success: false, message: "Upload error: " + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message || "Only image files are allowed for OMSET HARIAN uploads." });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No images uploaded" });
      }

      const uploadedFiles = req.files.map((file) => {
        const relativePath = path.relative(path.join(__dirname, "../uploads"), file.path);
        return {
          originalName: file.originalname,
          filename: file.filename,
          path: relativePath.replace(/\\/g, "/"),
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${relativePath.replace(/\\/g, "/")}`,
        };
      });

      res.json({ success: true, message: "OMSET HARIAN images uploaded successfully", data: uploadedFiles });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error uploading OMSET HARIAN images" });
    }
  });
});

// Upload MEDIA SOSIAL images
router.post("/media-sosial", authenticateToken, (req, res, next) => {
  mediaSosialUpload.array("images", 50)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File too large. Maximum size is 10MB per image." });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, message: "Too many files. Maximum is 50 images per MEDIA SOSIAL." });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ success: false, message: 'Invalid field name. Use "images" field for uploading.' });
      }
      return res.status(400).json({ success: false, message: "Upload error: " + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message || "Only image files are allowed for MEDIA SOSIAL uploads." });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No images uploaded" });
      }

      const uploadedFiles = req.files.map((file) => {
        const relativePath = path.relative(path.join(__dirname, "../uploads"), file.path);
        return {
          originalName: file.originalname,
          filename: file.filename,
          path: relativePath.replace(/\\/g, "/"),
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${relativePath.replace(/\\/g, "/")}`,
        };
      });

      res.json({ success: true, message: "MEDIA SOSIAL images uploaded successfully", data: uploadedFiles });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error uploading MEDIA SOSIAL images" });
    }
  });
});

// Upload LAPORAN KEUANGAN images
router.post(
  "/laporan-keuangan",
  authenticateToken,
  laporanKeuanganUpload.array("images", 5),
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No images uploaded",
        });
      }

      const uploadedFiles = req.files.map((file) => {
        const relativePath = path.relative(
          path.join(__dirname, "../uploads"),
          file.path
        );
        return {
          originalName: file.originalname,
          filename: file.filename,
          path: relativePath.replace(/\\/g, "/"),
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${relativePath.replace(/\\/g, "/")}`,
        };
      });

      return res.json({
        success: true,
        message: "LAPORAN KEUANGAN images uploaded successfully",
        data: uploadedFiles,
      });
    } catch (error) {
      console.error("❌ Error uploading LAPORAN KEUANGAN images:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading LAPORAN KEUANGAN images",
      });
    }
  }
);

// Configure storage for SLIP GAJI images
const slipGajiStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");
    const slipGajiDir = path.join(uploadsDir, "slip-gaji");

    // Create slip-gaji directory if it doesn't exist
    if (!require("fs").existsSync(slipGajiDir)) {
      require("fs").mkdirSync(slipGajiDir, { recursive: true });
    }

    cb(null, slipGajiDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "slip-gaji-" + uniqueSuffix + ext);
  },
});

// File filter for SLIP GAJI images
const slipGajiFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for SLIP GAJI"), false);
  }
};

// Configure multer for SLIP GAJI
const slipGajiUpload = multer({
  storage: slipGajiStorage,
  fileFilter: slipGajiFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for slip gaji images
  },
});

// Upload SLIP GAJI image (single file)
router.post(
  "/slip-gaji",
  authenticateToken,
  slipGajiUpload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

      // Create relative path for database storage
      const relativePath = path.relative(
        path.join(__dirname, "../uploads"),
        req.file.path
      );
      const fileInfo = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: relativePath.replace(/\\/g, "/"), // Convert Windows path to URL format
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${relativePath.replace(/\\/g, "/")}`, // URL for accessing the file
      };

      return res.json({
        success: true,
        message: "Slip gaji image uploaded successfully",
        data: fileInfo,
      });
    } catch (error) {
      console.error("❌ Error uploading slip gaji image:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading slip gaji image",
      });
    }
  }
);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error("❌ Upload error middleware triggered");
  console.error("❌ Error:", err);
  console.error("❌ Error name:", err.name);
  console.error("❌ Error message:", err.message);

  if (err instanceof multer.MulterError) {
    console.error("❌ Multer error code:", err.code);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 50MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum is 10 files.",
      });
    }
  }

  if (err.message === "File type not supported") {
    return res.status(400).json({
      success: false,
      message:
        "File type not supported. Please upload images, videos, or documents.",
    });
  }

  if (err.message === "Only image files are allowed for POSKAS") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed for POSKAS uploads.",
    });
  }

  if (err.message === "Only image files are allowed for OMSET HARIAN") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed for OMSET HARIAN uploads.",
    });
  }

  if (err.message === "Only image files are allowed for LAPORAN KEUANGAN") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed for LAPORAN KEUANGAN uploads.",
    });
  }

  if (err.message === "Only image files are allowed for ANEKA GRAFIK") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed for ANEKA GRAFIK uploads.",
    });
  }

  if (err.message === "Only image files are allowed for MEDIA SOSIAL") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed for MEDIA SOSIAL uploads.",
    });
  }

  if (err.message === "Only image files are allowed for TARGET") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed for TARGET uploads.",
    });
  }

  if (err.message === "Only image files are allowed for KPI") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed for KPI uploads.",
    });
  }

  if (err.message === "Only image files are allowed for SLIP GAJI") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed for SLIP GAJI uploads.",
    });
  }

  if (err.message === 'Only video files are allowed for VIDEO MANAGE') {
    return res.status(400).json({
      success: false,
      message: 'Only video files are allowed for VIDEO MANAGE uploads.',
    });
  }

  return res.status(500).json({
    success: false,
    message: "Error uploading file",
  });
});

module.exports = router;
