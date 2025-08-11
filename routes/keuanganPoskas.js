const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const KeuanganPoskas = require('../models/KeuanganPoskas');
const { authenticateToken } = require('../middleware/auth');

// Configure storage for POSKAS images
const poskasStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads');
    const poskasDir = path.join(uploadsDir, 'poskas');

    // Create poskas directory if it doesn't exist
    if (!fs.existsSync(poskasDir)) {
      fs.mkdirSync(poskasDir, { recursive: true });
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

// Get all keuangan poskas (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /keuangan-poskas - User:', req.user.id, 'Role:', req.user.role)

    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      console.log('❌ Access denied for user:', req.user.id)
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getAll();
    console.log('📊 Found', keuanganPoskas.length, 'poskas records')

    res.json({
      success: true,
      data: keuanganPoskas,
      count: keuanganPoskas.length
    });
  } catch (error) {
    console.error('❌ Error getting keuangan poskas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by user ID
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 GET /keuangan-poskas/user/:userId - Requested user:', userId, 'Current user:', req.user.id, 'Role:', req.user.role)

    // Check if user is admin or accessing their own data
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.id !== parseInt(userId)) {
      console.log('❌ Access denied for user:', req.user.id, 'trying to access user:', userId)
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getByUserId(userId);
    console.log('📊 Found', keuanganPoskas.length, 'poskas records for user:', userId)

    res.json({
      success: true,
      data: keuanganPoskas,
      count: keuanganPoskas.length
    });
  } catch (error) {
    console.error('❌ Error getting keuangan poskas by user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by date range
router.get('/date-range/:startDate/:endDate', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.params;

    // Check if user is admin or owner
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getByDateRange(startDate, endDate);

    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by month
router.get('/month/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;

    // Check if user is admin or owner
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.getByMonth(year, month);

    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error getting keuangan poskas by month:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search keuangan poskas
router.get('/search/:searchTerm', authenticateToken, async (req, res) => {
  try {
    const { searchTerm } = req.params;

    // Check if user is admin or owner
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const keuanganPoskas = await KeuanganPoskas.search(searchTerm);

    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('Error searching keuangan poskas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get summary/statistics
router.get('/summary/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or owner
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const summary = await KeuanganPoskas.getSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting keuangan poskas summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get keuangan poskas by ID (harus di akhir karena catch-all)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 GET /keuangan-poskas/:id - ID:', id, 'User:', req.user.id, 'Role:', req.user.role)

    const keuanganPoskas = await KeuanganPoskas.getById(id);

    if (!keuanganPoskas) {
      console.log('❌ Poskas not found with ID:', id)
      return res.status(404).json({
        success: false,
        message: 'Keuangan poskas not found'
      });
    }

    // Check if user is admin or the owner of the data
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.id !== keuanganPoskas.id_user) {
      console.log('❌ Access denied for user:', req.user.id, 'trying to access poskas:', id, 'owned by:', keuanganPoskas.id_user)
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('✅ Poskas found:', keuanganPoskas.id)
    res.json({
      success: true,
      data: keuanganPoskas
    });
  } catch (error) {
    console.error('❌ Error getting keuangan poskas by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new keuangan poskas
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📝 POST /keuangan-poskas - User:', req.user.id, 'Role:', req.user.role)
    console.log('📝 Request body:', req.body)

    const { tanggal_poskas, isi_poskas, images } = req.body;

    // Process images from frontend (already uploaded)
    let imagesData = null;
    if (images && Array.isArray(images) && images.length > 0) {
      console.log('📝 Processing images from frontend:', images.length);
      
      // Validate image data structure
      imagesData = images.map((img, index) => {
        if (!img.id || !img.url || !img.serverPath) {
          console.error('❌ Invalid image data at index:', index, img);
          throw new Error(`Invalid image data at index ${index}`);
        }
        
        return {
          uri: img.uri || '', // Keep original URI for reference
          id: img.id, // Use ID from frontend
          name: img.name || `poskas_${img.id}.jpg`,
          url: img.url, // Server URL from frontend
          serverPath: img.serverPath // Server path from frontend
        };
      });
      
      console.log('📝 Processed images from frontend:', imagesData.length);
      console.log('📝 Images data format:', JSON.stringify(imagesData, null, 2));
    }

    // Validate required fields
    if (!tanggal_poskas || !isi_poskas) {
      console.log('❌ Missing required fields')
      return res.status(400).json({
        success: false,
        message: 'Tanggal poskas and isi poskas are required'
      });
    }

    // Check and fix auto increment before creating
    await KeuanganPoskas.checkAndFixAutoIncrement();

    const data = {
      id_user: req.user.id,
      tanggal_poskas,
      isi_poskas,
      images: imagesData ? JSON.stringify(imagesData) : null
    };

    console.log('📝 Creating poskas with data:', { ...data, images: imagesData ? 'has images' : 'no images' })
    console.log('📝 Final images JSON:', imagesData ? JSON.stringify(imagesData) : 'null')
    const newKeuanganPoskas = await KeuanganPoskas.create(data);
    console.log('✅ Poskas created successfully:', newKeuanganPoskas.id)

    res.status(201).json({
      success: true,
      message: 'Keuangan poskas created successfully',
      data: newKeuanganPoskas
    });
  } catch (error) {
    console.error('❌ Error creating keuangan poskas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update keuangan poskas
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal_poskas, isi_poskas, images } = req.body;

    console.log('📝 PUT /keuangan-poskas/:id - ID:', id, 'User:', req.user.id, 'Role:', req.user.role)
    console.log('📝 Request body:', req.body)

    // Validate required fields
    if (!tanggal_poskas || !isi_poskas) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal poskas and isi poskas are required'
      });
    }

    // Check if keuangan poskas exists and user has permission
    const existingKeuanganPoskas = await KeuanganPoskas.getById(id);
    if (!existingKeuanganPoskas) {
      return res.status(404).json({
        success: false,
        message: 'Keuangan poskas not found'
      });
    }

    // Check if user is admin or the owner of the data
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.id !== existingKeuanganPoskas.id_user) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Process images from frontend (already uploaded)
    let imagesData = null;
    if (images && Array.isArray(images) && images.length > 0) {
      console.log('📝 Processing images from frontend (update):', images.length);
      
      // Validate image data structure
      imagesData = images.map((img, index) => {
        if (!img.id || !img.url || !img.serverPath) {
          console.error('❌ Invalid image data at index:', index, img);
          throw new Error(`Invalid image data at index ${index}`);
        }
        
        return {
          uri: img.uri || '', // Keep original URI for reference
          id: img.id, // Use ID from frontend
          name: img.name || `poskas_${img.id}.jpg`,
          url: img.url, // Server URL from frontend
          serverPath: img.serverPath // Server path from frontend
        };
      });
    }

    const updatedData = {
      tanggal_poskas,
      isi_poskas,
      images: imagesData ? JSON.stringify(imagesData) : null
    };

    const updatedKeuanganPoskas = await KeuanganPoskas.update(id, updatedData);

    res.json({
      success: true,
      message: 'Keuangan poskas updated successfully',
      data: updatedKeuanganPoskas
    });
  } catch (error) {
    console.error('Error updating keuangan poskas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete keuangan poskas (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ DELETE /keuangan-poskas/:id - ID:', id, 'User:', req.user.id, 'Role:', req.user.role)

    // Check if keuangan poskas exists and user has permission
    const existingKeuanganPoskas = await KeuanganPoskas.getById(id);
    if (!existingKeuanganPoskas) {
      console.log('❌ Poskas not found with ID:', id)
      return res.status(404).json({
        success: false,
        message: 'Keuangan poskas not found'
      });
    }

    // Check if user is admin or the owner of the data
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.id !== existingKeuanganPoskas.id_user) {
      console.log('❌ Access denied for user:', req.user.id, 'trying to delete poskas:', id, 'owned by:', existingKeuanganPoskas.id_user)
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await KeuanganPoskas.delete(id);
    console.log('✅ Poskas deleted successfully:', id)

    res.json({
      success: true,
      message: 'Keuangan poskas deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting keuangan poskas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 