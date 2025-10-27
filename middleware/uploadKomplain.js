const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for komplain files
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

// File filter untuk komplain files (allow all types)
const fileFilter = (req, file, cb) => {
  cb(null, true); // Allow all file types
};

// Configure multer untuk komplain files
const uploadKomplain = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 20 // Maximum 20 files per upload
  }
});

// Middleware untuk multiple komplain files upload
const uploadMultipleKomplain = uploadKomplain.array('lampiran', 20);

// Middleware untuk kompresi gambar komplain (hanya untuk image files)
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
            .resize(1200, 1200, { // Resize to max 1200x1200 pixels (larger than profile for komplain)
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ 
              quality: 85, // 85% quality untuk komplain (higher than profile)
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

// Error handling middleware untuk komplain upload
const handleKomplainUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar. Maksimal ukuran adalah 100MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Terlalu banyak file. Maksimal 20 file per upload.'
      });
    }
  }
  
  return res.status(500).json({
    success: false,
    message: 'Error uploading file komplain'
  });
};

module.exports = {
  uploadMultipleKomplain,
  compressKomplainImages,
  handleKomplainUploadError
};
