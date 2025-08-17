const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AnekaGrafik = require('../models/AnekaGrafik');
const { authenticateToken } = require('../middleware/auth');

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

// Get all aneka grafik with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', date = '' } = req.query;

        const result = await AnekaGrafik.getAll(
            parseInt(page),
            parseInt(limit),
            search,
            date
        );

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in GET /aneka-grafik:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get aneka grafik by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await AnekaGrafik.getById(id);

        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in GET /aneka-grafik/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload image files
router.post('/upload', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        console.log('📁 ANEKA GRAFIK upload request received');
        console.log('📁 User:', req.user.id);
        console.log('📁 Files:', req.files ? req.files.length : 0);
        console.log('📁 Request body:', req.body);

        if (!req.files || req.files.length === 0) {
            console.log('❌ No files uploaded');
            return res.status(400).json({ error: 'No files uploaded' });
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

            const fileInfo = {
                uri: `file://temp/${Date.now()}_${Math.floor(Math.random() * 1000000)}.jpg`,
                id: Date.now() + Math.floor(Math.random() * 1000000),
                name: file.originalname,
                url: `${req.protocol}://${req.get('host')}/${file.path}`,
                serverPath: file.path
            };

            console.log('📁 File info created:', fileInfo);
            return fileInfo;
        });

        console.log('✅ Upload successful, returning:', uploadedFiles.length, 'files');
        res.json({
            success: true,
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('❌ Error in POST /aneka-grafik/upload:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new aneka grafik
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('📝 POST /aneka-grafik create request received');
        console.log('📝 Request body:', req.body);
        console.log('📝 User ID:', req.user.id);
        
        const { tanggal_grafik, isi_grafik, images } = req.body;

        if (!tanggal_grafik || !isi_grafik) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ error: 'Tanggal grafik dan isi grafik harus diisi' });
        }

        const data = {
            id_user: req.user.id,
            tanggal_grafik,
            isi_grafik,
            images
        };
        
        console.log('📝 Data to be created:', data);

        const result = await AnekaGrafik.create(data);
        console.log('📝 Create result:', result);

        if (!result.success) {
            console.log('❌ Create failed:', result.error);
            return res.status(500).json({ error: result.error });
        }

        console.log('✅ Create successful');
        res.status(201).json(result);
    } catch (error) {
        console.error('❌ Error in POST /aneka-grafik:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update aneka grafik
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        console.log('📝 PUT /aneka-grafik/:id update request received');
        console.log('📝 ID:', req.params.id);
        console.log('📝 Request body:', req.body);
        
        const { id } = req.params;
        const { tanggal_grafik, isi_grafik, images } = req.body;

        if (!tanggal_grafik || !isi_grafik) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ error: 'Tanggal grafik dan isi grafik harus diisi' });
        }

        const data = {
            tanggal_grafik,
            isi_grafik,
            images
        };
        
        console.log('📝 Data to be updated:', data);

        const result = await AnekaGrafik.update(id, data);
        console.log('📝 Update result:', result);

        if (!result.success) {
            console.log('❌ Update failed:', result.error);
            return res.status(404).json({ error: result.error });
        }

        console.log('✅ Update successful');
        res.json(result);
    } catch (error) {
        console.error('❌ Error in PUT /aneka-grafik/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete aneka grafik
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await AnekaGrafik.delete(id);

        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in DELETE /aneka-grafik/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        const result = await AnekaGrafik.getStats();

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in GET /aneka-grafik/stats/overview:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve uploaded images
router.get('/image/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const imagePath = path.join(__dirname, '..', 'uploads', 'aneka-grafik', filename);
        
        if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 