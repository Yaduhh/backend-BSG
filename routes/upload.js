const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');

// Configure storage for POSKAS images
const poskasStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads');
    const poskasDir = path.join(uploadsDir, 'poskas');
    
    // Create poskas directory if it doesn't exist
    if (!require('fs').existsSync(poskasDir)) {
      require('fs').mkdirSync(poskasDir, { recursive: true });
    }
    
    cb(null, poskasDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'poskas-' + uniqueSuffix + ext);
  }
});

// Configure multer for POSKAS uploads
const poskasUpload = multer({
  storage: poskasStorage,
  fileFilter: (req, file, cb) => {
    // Allow only images for POSKAS
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for POSKAS'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for POSKAS images
    files: 5 // Maximum 5 images per POSKAS
  }
});

// Upload multiple files
router.post('/files', uploadMultiple, (req, res) => {
  console.log('📁 Upload request received');
  console.log('📁 Request headers:', req.headers);
  console.log('📁 Request body type:', typeof req.body);
  console.log('📁 Files:', req.files ? req.files.length : 0);
  console.log('📁 Files details:', req.files ? req.files.map(f => ({
    fieldname: f.fieldname,
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
    path: f.path
  })) : 'No files');
  
  try {
    if (!req.files || req.files.length === 0) {
      console.log('❌ No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log('📁 Processing uploaded files...');
    const uploadedFiles = req.files.map((file, index) => {
      console.log(`📁 Processing file ${index + 1}:`, {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      });
      
      // Create relative path for database storage
      const relativePath = path.relative(path.join(__dirname, '../uploads'), file.path);
      
      const fileInfo = {
        originalName: file.originalname,
        filename: file.filename,
        path: relativePath.replace(/\\/g, '/'), // Convert Windows path to URL format
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${relativePath.replace(/\\/g, '/')}` // URL for accessing the file
      };
      
      console.log('📁 File processed:', fileInfo);
      return fileInfo;
    });

    console.log('✅ Upload successful, returning:', uploadedFiles.length, 'files');
    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: uploadedFiles
    });
  } catch (error) {
    console.error('❌ Error uploading files:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
});

// Upload POSKAS images
router.post('/poskas', authenticateToken, poskasUpload.array('files', 5), (req, res) => {
  console.log('📁 POSKAS upload request received');
  console.log('📁 User:', req.user.id);
  console.log('📁 Files:', req.files ? req.files.length : 0);
  
  try {
    if (!req.files || req.files.length === 0) {
      console.log('❌ No POSKAS images uploaded');
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    console.log('📁 Processing POSKAS images...');
    const uploadedFiles = req.files.map((file, index) => {
      console.log(`📁 Processing POSKAS image ${index + 1}:`, {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      });
      
      // Create relative path for database storage
      const relativePath = path.relative(path.join(__dirname, '../uploads'), file.path);
      
      const fileInfo = {
        originalName: file.originalname,
        filename: file.filename,
        path: relativePath.replace(/\\/g, '/'), // Convert Windows path to URL format
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${relativePath.replace(/\\/g, '/')}` // URL for accessing the file
      };
      
      console.log('📁 POSKAS image processed:', fileInfo);
      return fileInfo;
    });

    console.log('✅ POSKAS upload successful, returning:', uploadedFiles.length, 'images');
    res.json({
      success: true,
      message: 'POSKAS images uploaded successfully',
      data: uploadedFiles
    });
  } catch (error) {
    console.error('❌ Error uploading POSKAS images:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error uploading POSKAS images'
    });
  }
});

// Serve uploaded files
router.get('/uploads/*', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params[0]);
  res.sendFile(filePath);
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('❌ Upload error middleware triggered');
  console.error('❌ Error:', err);
  console.error('❌ Error name:', err.name);
  console.error('❌ Error message:', err.message);
  
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer error code:', err.code);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
  }
  
  if (err.message === 'File type not supported') {
    return res.status(400).json({
      success: false,
      message: 'File type not supported. Please upload images, videos, or documents.'
    });
  }
  
  if (err.message === 'Only image files are allowed for POSKAS') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed for POSKAS uploads.'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Error uploading file'
  });
});

module.exports = router; 