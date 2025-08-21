const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const KeuanganPoskas = require('../models/KeuanganPoskas');
const { authenticateToken } = require('../middleware/auth');

// Tim only middleware (tim merah/biru)
const timOnly = (req, res, next) => {
    if (req.user.role !== 'tim_merah' && req.user.role !== 'tim_biru') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Tim only.'
        });
    }
    next();
};

// Configure storage for POSKAS images
const poskasStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../uploads');
        const poskasDir = path.join(uploadsDir, 'poskas');

        if (!fs.existsSync(poskasDir)) {
            fs.mkdirSync(poskasDir, { recursive: true });
        }

        cb(null, poskasDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'tim-poskas-' + uniqueSuffix + ext);
    }
});

const poskasUpload = multer({
    storage: poskasStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5
    }
});

// GET /api/tim/keuangan-poskas - Get tim's own poskas
router.get('/', authenticateToken, timOnly, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            status_deleted: false,
            creator_id: req.user.id
        };

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        const poskas = await KeuanganPoskas.findAndCountAll({
            where: whereClause,
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: poskas.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(poskas.count / limit),
                totalItems: poskas.count,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error getting tim poskas:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/tim/keuangan-poskas/:id - Get tim's own poskas by ID
router.get('/:id', authenticateToken, timOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const poskas = await KeuanganPoskas.findOne({
            where: {
                id: id,
                creator_id: req.user.id,
                status_deleted: false
            }
        });

        if (!poskas) {
            return res.status(404).json({
                success: false,
                message: 'Poskas not found or access denied'
            });
        }

        res.json({
            success: true,
            data: poskas
        });
    } catch (error) {
        console.error('Error getting tim poskas by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST /api/tim/keuangan-poskas - Create new poskas (tim only)
router.post('/', authenticateToken, timOnly, poskasUpload.array('lampiran', 5), async (req, res) => {
    try {
        const { judul, deskripsi, kategori, jumlah, tanggal, catatan } = req.body;

        // Validate required fields
        if (!judul || !deskripsi || !kategori || !jumlah) {
            return res.status(400).json({
                success: false,
                message: 'Judul, deskripsi, kategori, dan jumlah are required'
            });
        }

        // Process uploaded files
        const lampiran = req.files ? req.files.map(file => file.filename) : [];

        const poskasData = {
            judul,
            deskripsi,
            kategori,
            jumlah: parseFloat(jumlah),
            tanggal: tanggal || new Date(),
            status: 'pending', // Tim can only create pending poskas
            catatan,
            lampiran: JSON.stringify(lampiran),
            creator_id: req.user.id,
            status_deleted: false
        };

        const newPoskas = await KeuanganPoskas.create(poskasData);

        res.status(201).json({
            success: true,
            message: 'Poskas created successfully and pending approval',
            data: newPoskas
        });
    } catch (error) {
        console.error('Error creating tim poskas:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// PUT /api/tim/keuangan-poskas/:id - Update tim's own poskas (only if pending)
router.put('/:id', authenticateToken, timOnly, poskasUpload.array('lampiran', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const { judul, deskripsi, kategori, jumlah, tanggal, catatan } = req.body;

        const poskas = await KeuanganPoskas.findOne({
            where: {
                id: id,
                creator_id: req.user.id,
                status_deleted: false
            }
        });

        if (!poskas) {
            return res.status(404).json({
                success: false,
                message: 'Poskas not found or access denied'
            });
        }

        // Tim can only update pending poskas
        if (poskas.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update poskas that is not pending'
            });
        }

        // Process uploaded files
        const newLampiran = req.files ? req.files.map(file => file.filename) : [];
        const existingLampiran = poskas.lampiran ? JSON.parse(poskas.lampiran) : [];
        const lampiran = [...existingLampiran, ...newLampiran];

        const updateData = {
            judul: judul || poskas.judul,
            deskripsi: deskripsi || poskas.deskripsi,
            kategori: kategori || poskas.kategori,
            jumlah: jumlah ? parseFloat(jumlah) : poskas.jumlah,
            tanggal: tanggal || poskas.tanggal,
            catatan: catatan || poskas.catatan,
            lampiran: JSON.stringify(lampiran)
        };

        await poskas.update(updateData);

        res.json({
            success: true,
            message: 'Poskas updated successfully',
            data: poskas
        });
    } catch (error) {
        console.error('Error updating tim poskas:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// DELETE /api/tim/keuangan-poskas/:id - Delete tim's own poskas (only if pending)
router.delete('/:id', authenticateToken, timOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const poskas = await KeuanganPoskas.findOne({
            where: {
                id: id,
                creator_id: req.user.id,
                status_deleted: false
            }
        });

        if (!poskas) {
            return res.status(404).json({
                success: false,
                message: 'Poskas not found or access denied'
            });
        }

        // Tim can only delete pending poskas
        if (poskas.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete poskas that is not pending'
            });
        }

        // Soft delete
        await poskas.update({ status_deleted: true });

        res.json({
            success: true,
            message: 'Poskas deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting tim poskas:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/tim/keuangan-poskas/stats - Get tim's poskas statistics
router.get('/stats', authenticateToken, timOnly, async (req, res) => {
    try {
        const totalPoskas = await KeuanganPoskas.count({
            where: { status_deleted: false, creator_id: req.user.id }
        });
        const pendingPoskas = await KeuanganPoskas.count({
            where: { status_deleted: false, creator_id: req.user.id, status: 'pending' }
        });
        const approvedPoskas = await KeuanganPoskas.count({
            where: { status_deleted: false, creator_id: req.user.id, status: 'approved' }
        });
        const rejectedPoskas = await KeuanganPoskas.count({
            where: { status_deleted: false, creator_id: req.user.id, status: 'rejected' }
        });

        const totalAmount = await KeuanganPoskas.sum('jumlah', {
            where: { status_deleted: false, creator_id: req.user.id, status: 'approved' }
        });

        res.json({
            success: true,
            data: {
                totalPoskas,
                pendingPoskas,
                approvedPoskas,
                rejectedPoskas,
                totalAmount: totalAmount || 0
            }
        });
    } catch (error) {
        console.error('Error getting tim poskas stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;














