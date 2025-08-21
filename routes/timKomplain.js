const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DaftarKomplain = require('../models/DaftarKomplain');
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

// Configure storage for komplain attachments
const komplainStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../uploads');
        const komplainDir = path.join(uploadsDir, 'komplain');

        if (!fs.existsSync(komplainDir)) {
            fs.mkdirSync(komplainDir, { recursive: true });
        }

        cb(null, komplainDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'tim-komplain-' + uniqueSuffix + ext);
    }
});

const komplainUpload = multer({
    storage: komplainStorage,
    fileFilter: (req, file, cb) => {
        // Allow images and documents
        if (file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Only image and document files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5
    }
});

// GET /api/tim/komplain - Get tim's own komplain
router.get('/', authenticateToken, timOnly, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, kategori, prioritas, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            status_deleted: false,
            pelapor_id: req.user.id
        };

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        if (kategori && kategori !== 'all') {
            whereClause.kategori = kategori;
        }

        if (prioritas && prioritas !== 'all') {
            whereClause.prioritas = prioritas;
        }

        const komplain = await DaftarKomplain.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: require('../models/User'),
                    as: 'pelapor',
                    attributes: ['id', 'nama', 'username', 'role']
                },
                {
                    model: require('../models/User'),
                    as: 'penerima_komplain',
                    attributes: ['id', 'nama', 'username', 'role']
                }
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: komplain.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(komplain.count / limit),
                totalItems: komplain.count,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error getting tim komplain:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/tim/komplain/:id - Get tim's own komplain by ID
router.get('/:id', authenticateToken, timOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const komplain = await DaftarKomplain.findOne({
            where: {
                id: id,
                pelapor_id: req.user.id,
                status_deleted: false
            },
            include: [
                {
                    model: require('../models/User'),
                    as: 'pelapor',
                    attributes: ['id', 'nama', 'username', 'role']
                },
                {
                    model: require('../models/User'),
                    as: 'penerima_komplain',
                    attributes: ['id', 'nama', 'username', 'role']
                }
            ]
        });

        if (!komplain) {
            return res.status(404).json({
                success: false,
                message: 'Komplain not found or access denied'
            });
        }

        res.json({
            success: true,
            data: komplain
        });
    } catch (error) {
        console.error('Error getting tim komplain by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST /api/tim/komplain - Create new komplain (tim only)
router.post('/', authenticateToken, timOnly, komplainUpload.array('lampiran', 5), async (req, res) => {
    try {
        const {
            judul_komplain,
            deskripsi_komplain,
            kategori,
            prioritas,
            target_selesai,
            pihak_terkait
        } = req.body;

        // Validate required fields
        if (!judul_komplain || !deskripsi_komplain || !kategori) {
            return res.status(400).json({
                success: false,
                message: 'Judul komplain, deskripsi, dan kategori are required'
            });
        }

        // Process uploaded files
        const lampiran = req.files ? req.files.map(file => file.filename) : [];

        // Process pihak terkait (array of user IDs)
        let pihakTerkaitArray = [];
        if (pihak_terkait) {
            try {
                pihakTerkaitArray = JSON.parse(pihak_terkait);
            } catch (e) {
                pihakTerkaitArray = pihak_terkait.split(',').map(id => parseInt(id.trim()));
            }
        }

        const komplainData = {
            judul_komplain,
            deskripsi_komplain,
            kategori: kategori || 'lainnya',
            prioritas: prioritas || 'berproses',
            status: 'menunggu', // Tim can only create pending komplain
            pelapor_id: req.user.id,
            pihak_terkait: JSON.stringify(pihakTerkaitArray),
            lampiran: JSON.stringify(lampiran),
            tanggal_pelaporan: new Date(),
            target_selesai: target_selesai ? new Date(target_selesai) : null,
            status_deleted: false
        };

        const newKomplain = await DaftarKomplain.create(komplainData);

        res.status(201).json({
            success: true,
            message: 'Komplain created successfully and pending review',
            data: newKomplain
        });
    } catch (error) {
        console.error('Error creating tim komplain:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// PUT /api/tim/komplain/:id - Update tim's own komplain (only if menunggu)
router.put('/:id', authenticateToken, timOnly, komplainUpload.array('lampiran', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            judul_komplain,
            deskripsi_komplain,
            kategori,
            prioritas,
            target_selesai,
            pihak_terkait
        } = req.body;

        const komplain = await DaftarKomplain.findOne({
            where: {
                id: id,
                pelapor_id: req.user.id,
                status_deleted: false
            }
        });

        if (!komplain) {
            return res.status(404).json({
                success: false,
                message: 'Komplain not found or access denied'
            });
        }

        // Tim can only update pending komplain
        if (komplain.status !== 'menunggu') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update komplain that is not pending'
            });
        }

        // Process uploaded files
        const newLampiran = req.files ? req.files.map(file => file.filename) : [];
        const existingLampiran = komplain.lampiran ? JSON.parse(komplain.lampiran) : [];
        const lampiran = [...existingLampiran, ...newLampiran];

        // Process pihak terkait
        let pihakTerkaitArray = komplain.pihak_terkait ? JSON.parse(komplain.pihak_terkait) : [];
        if (pihak_terkait) {
            try {
                pihakTerkaitArray = JSON.parse(pihak_terkait);
            } catch (e) {
                pihakTerkaitArray = pihak_terkait.split(',').map(id => parseInt(id.trim()));
            }
        }

        const updateData = {
            judul_komplain: judul_komplain || komplain.judul_komplain,
            deskripsi_komplain: deskripsi_komplain || komplain.deskripsi_komplain,
            kategori: kategori || komplain.kategori,
            prioritas: prioritas || komplain.prioritas,
            pihak_terkait: JSON.stringify(pihakTerkaitArray),
            lampiran: JSON.stringify(lampiran),
            target_selesai: target_selesai ? new Date(target_selesai) : komplain.target_selesai
        };

        await komplain.update(updateData);

        res.json({
            success: true,
            message: 'Komplain updated successfully',
            data: komplain
        });
    } catch (error) {
        console.error('Error updating tim komplain:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// DELETE /api/tim/komplain/:id - Delete tim's own komplain (only if menunggu)
router.delete('/:id', authenticateToken, timOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const komplain = await DaftarKomplain.findOne({
            where: {
                id: id,
                pelapor_id: req.user.id,
                status_deleted: false
            }
        });

        if (!komplain) {
            return res.status(404).json({
                success: false,
                message: 'Komplain not found or access denied'
            });
        }

        // Tim can only delete pending komplain
        if (komplain.status !== 'menunggu') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete komplain that is not pending'
            });
        }

        // Soft delete
        await komplain.update({ status_deleted: true });

        res.json({
            success: true,
            message: 'Komplain deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting tim komplain:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/tim/komplain/stats - Get tim's komplain statistics
router.get('/stats', authenticateToken, timOnly, async (req, res) => {
    try {
        const totalKomplain = await DaftarKomplain.count({
            where: { status_deleted: false, pelapor_id: req.user.id }
        });
        const menungguKomplain = await DaftarKomplain.count({
            where: { status_deleted: false, pelapor_id: req.user.id, status: 'menunggu' }
        });
        const diprosesKomplain = await DaftarKomplain.count({
            where: { status_deleted: false, pelapor_id: req.user.id, status: 'diproses' }
        });
        const selesaiKomplain = await DaftarKomplain.count({
            where: { status_deleted: false, pelapor_id: req.user.id, status: 'selesai' }
        });
        const ditolakKomplain = await DaftarKomplain.count({
            where: { status_deleted: false, pelapor_id: req.user.id, status: 'ditolak' }
        });

        // Get category breakdown
        const kategoriStats = await DaftarKomplain.findAll({
            where: { status_deleted: false, pelapor_id: req.user.id },
            attributes: [
                'kategori',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['kategori']
        });

        // Get priority breakdown
        const prioritasStats = await DaftarKomplain.findAll({
            where: { status_deleted: false, pelapor_id: req.user.id },
            attributes: [
                'prioritas',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['prioritas']
        });

        res.json({
            success: true,
            data: {
                totalKomplain,
                menungguKomplain,
                diprosesKomplain,
                selesaiKomplain,
                ditolakKomplain,
                kategoriStats,
                prioritasStats
            }
        });
    } catch (error) {
        console.error('Error getting tim komplain stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;














