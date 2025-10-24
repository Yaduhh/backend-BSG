const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for profile photos (using memory storage for compression)
const storage = multer.memoryStorage();

// File filter untuk profile photos (hanya gambar)
const fileFilter = (req, file, cb) => {
  // Hanya allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan untuk foto profile'), false);
  }
};

// Configure multer untuk profile photos
const uploadProfile = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit untuk profile photo
    files: 1 // Hanya 1 file per request
  }
});

// Middleware untuk single profile photo upload
const uploadSingleProfile = uploadProfile.single('profile');

// Middleware untuk kompresi gambar profile
const compressProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Ensure profile directory exists
    const profileDir = path.join(uploadsDir, 'profile');
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `profile-${req.user?.id || 'unknown'}-${uniqueSuffix}.jpg`;
    const filepath = path.join(profileDir, filename);

    // Compress and resize image using Sharp
    await sharp(req.file.buffer)
      .resize(400, 400, { // Resize to 400x400 pixels
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 80, // 80% quality untuk balance antara ukuran dan kualitas
        progressive: true
      })
      .toFile(filepath);

    // Update req.file dengan informasi file yang sudah dikompres
    req.file.filename = filename;
    req.file.path = filepath;
    req.file.size = fs.statSync(filepath).size;

    next();
  } catch (error) {
    console.error('Error compressing profile image:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengkompres gambar profile'
    });
  }
};

// Error handling middleware untuk profile upload
const handleProfileUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar. Maksimal ukuran adalah 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Terlalu banyak file. Maksimal 1 file untuk foto profile.'
      });
    }
  }
  
  if (err.message === 'Hanya file gambar yang diperbolehkan untuk foto profile') {
    return res.status(400).json({
      success: false,
      message: 'Hanya file gambar yang diperbolehkan untuk foto profile.'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Error uploading foto profile'
  });
};

module.exports = {
  uploadSingleProfile,
  compressProfileImage,
  handleProfileUploadError
};
