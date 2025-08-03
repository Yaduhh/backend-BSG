const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');

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
  
  return res.status(500).json({
    success: false,
    message: 'Error uploading file'
  });
});

module.exports = router; 