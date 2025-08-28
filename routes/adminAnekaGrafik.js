const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const {
  getAllAnekaGrafik,
  getAnekaGrafikByCategory,
  getAnekaGrafikById,
  createAnekaGrafik,
  updateAnekaGrafik,
  deleteAnekaGrafik,
  getStats
} = require('../controllers/anekaGrafikController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'aneka-grafik');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const randomId = Math.floor(Math.random() * 1000000);
        const ext = path.extname(file.originalname);
        cb(null, `aneka-grafik-${timestamp}-${randomId}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all aneka grafik
router.get('/', getAllAnekaGrafik);

// Get aneka grafik by category
router.get('/category/:category', getAnekaGrafikByCategory);

// Get statistics (must be before /:id route)
router.get('/stats/overview', getStats);

// Upload image files
router.post('/upload', (req, res, next) => {
    console.log('🚀 Upload route hit');
    console.log('📋 Request headers:', req.headers);
    console.log('📋 Request method:', req.method);
    console.log('📋 Request URL:', req.url);
    
    upload.array('images', 5)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            console.error('❌ Multer error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    success: false,
                    error: 'File terlalu besar. Maksimal 10MB per file.' 
                });
            } else if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Terlalu banyak file. Maksimal 5 file.' 
                });
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Field name tidak valid. Gunakan field name "images".' 
                });
            }
            return res.status(400).json({ 
                success: false,
                error: 'Error upload file: ' + err.message 
            });
        } else if (err) {
            // An unknown error occurred
            console.error('❌ Unknown upload error:', err);
            return res.status(400).json({ 
                success: false,
                error: err.message || 'Hanya file gambar yang diperbolehkan' 
            });
        }
        
        console.log('✅ Multer processing successful, proceeding to handleUpload');
        // Everything went fine, proceed with the upload logic
        handleUpload(req, res);
    });
});

const handleUpload = async (req, res) => {
    try {
        console.log('📁 ADMIN ANEKA GRAFIK upload request received');
        console.log('📁 User:', req.user.id);
        console.log('📁 Files:', req.files ? req.files.length : 0);
        console.log('📁 Request body:', req.body);

        if (!req.files || req.files.length === 0) {
            console.log('❌ No files uploaded');
            return res.status(400).json({ 
                success: false,
                error: 'Tidak ada file yang diupload' 
            });
        }

        console.log('📁 Processing files...');
        const uploadedFiles = req.files.map((file, index) => {
            console.log(`📁 File ${index + 1}:`, {
                fieldname: file.fieldname,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
                destination: file.destination
            });

            // Create relative path for database storage
            const relativePath = path.relative(path.join(__dirname, '..', 'uploads'), file.path);

            const fileInfo = {
                uri: `file://temp/${Date.now()}_${Math.floor(Math.random() * 1000000)}.jpg`,
                id: Date.now() + Math.floor(Math.random() * 1000000),
                name: file.originalname,
                url: `/uploads/${relativePath.replace(/\\/g, '/')}`, // Use relative path for URL
                serverPath: relativePath.replace(/\\/g, '/') // Store relative path
            };

            console.log('📁 File info created:', fileInfo);
            return fileInfo;
        });

        console.log('✅ Upload successful, returning:', uploadedFiles.length, 'files');
        res.json({
            success: true,
            message: 'File berhasil diupload',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('❌ Error in POST /admin/aneka-grafik/upload:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
};

// Get aneka grafik by ID
router.get('/:id', getAnekaGrafikById);

// Create new aneka grafik
router.post('/', createAnekaGrafik);

// Update aneka grafik
router.put('/:id', updateAnekaGrafik);

// Delete aneka grafik
router.delete('/:id', deleteAnekaGrafik);

module.exports = router;