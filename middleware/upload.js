const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Base directory untuk data pengajuan
    const baseDir = 'data-pengajuan';
    
    // Subfolder berdasarkan tipe file
    let subDir = 'general';
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'videos';
    } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
      subDir = 'documents';
    }
    
    // Pastikan folder data-pengajuan dan subfoldernya ada
    const uploadPath = path.join(uploadsDir, baseDir, subDir);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  // Allow videos
  else if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  }
  // Allow documents
  else if (file.mimetype.includes('pdf') || 
           file.mimetype.includes('document') ||
           file.mimetype.includes('text') ||
           file.mimetype.includes('spreadsheet') ||
           file.mimetype.includes('presentation')) {
    cb(null, true);
  }
  // Reject other files
  else {
    cb(new Error('File type not supported'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('file');

// Middleware for multiple files upload
const uploadMultiple = upload.array('files', 10);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
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
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError
}; 