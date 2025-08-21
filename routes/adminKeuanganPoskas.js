const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const KeuanganPoskas = require('../models/KeuanganPoskas');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// Admin only middleware
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
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
        cb(null, 'admin-poskas-' + uniqueSuffix + ext);
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

// GET /api/admin/keuangan-poskas - Get all poskas (admin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = { status_deleted: false };

        if (search && search.trim()) {
            whereClause[Op.or] = [
                { judul: { [Op.like]: `%${search.trim()}%` } },
                { deskripsi: { [Op.like]: `%${search.trim()}%` } },
                { kategori: { [Op.like]: `%${search.trim()}%` } }
            ];
        }

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        const poskas = await KeuanganPoskas.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: require('../models/User'),
                    as: 'creator',
                    attributes: ['id', 'nama', 'username', 'role']
                }
            ],
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
        console.error('Error getting admin poskas:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/admin/keuangan-poskas/:id - Get poskas by ID (admin only)
router.get('/:id', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const poskas = await KeuanganPoskas.findByPk(id, {
            include: [
                {
                    model: require('../models/User'),
                    as: 'creator',
                    attributes: ['id', 'nama', 'username', 'role']
                }
            ]
        });

        if (!poskas) {
            return res.status(404).json({
                success: false,
                message: 'Poskas not found'
            });
        }

        res.json({
            success: true,
            data: poskas
        });
    } catch (error) {
        console.error('Error getting admin poskas by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST /api/admin/keuangan-poskas - Create new poskas (admin only)
router.post('/', authenticateToken, adminOnly, poskasUpload.array('lampiran', 5), async (req, res) => {
    try {
        const { judul, deskripsi, kategori, jumlah, tanggal, status, catatan } = req.body;

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
            status: status || 'pending',
            catatan,
            lampiran: JSON.stringify(lampiran),
            creator_id: req.user.id,
            status_deleted: false
        };

        const newPoskas = await KeuanganPoskas.create(poskasData);

        res.status(201).json({
            success: true,
            message: 'Poskas created successfully',
            data: newPoskas
        });
    } catch (error) {
        console.error('Error creating admin poskas:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// PUT /api/admin/keuangan-poskas/:id - Update poskas (admin only)
router.put('/:id', authenticateToken, adminOnly, poskasUpload.array('lampiran', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const { judul, deskripsi, kategori, jumlah, tanggal, status, catatan } = req.body;

        const poskas = await KeuanganPoskas.findByPk(id);
        if (!poskas) {
            return res.status(404).json({
                success: false,
                message: 'Poskas not found'
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
            status: status || poskas.status,
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
        console.error('Error updating admin poskas:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// DELETE /api/admin/keuangan-poskas/:id - Delete poskas (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const poskas = await KeuanganPoskas.findByPk(id);
        if (!poskas) {
            return res.status(404).json({
                success: false,
                message: 'Poskas not found'
            });
        }

        // Soft delete
        await poskas.update({ status_deleted: true });

        res.json({
            success: true,
            message: 'Poskas deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting admin poskas:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/admin/keuangan-poskas/stats - Get poskas statistics (admin only)
router.get('/stats', authenticateToken, adminOnly, async (req, res) => {
    try {
        const totalPoskas = await KeuanganPoskas.count({ where: { status_deleted: false } });
        const pendingPoskas = await KeuanganPoskas.count({
            where: { status_deleted: false, status: 'pending' }
        });
        const approvedPoskas = await KeuanganPoskas.count({
            where: { status_deleted: false, status: 'approved' }
        });
        const rejectedPoskas = await KeuanganPoskas.count({
            where: { status_deleted: false, status: 'rejected' }
        });

        const totalAmount = await KeuanganPoskas.sum('jumlah', {
            where: { status_deleted: false, status: 'approved' }
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
        console.error('Error getting admin poskas stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;














