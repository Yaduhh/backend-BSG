const express = require('express');
const router = express.Router();
const KeuanganPoskas = require('../models/KeuanganPoskas');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Divisi only middleware
const divisiOnly = (req, res, next) => {
    if (req.user.role !== 'divisi') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Divisi only.'
        });
    }
    next();
};

// GET /api/divisi/keuangan-poskas - Get all approved poskas (divisi read-only)
router.get('/', authenticateToken, divisiOnly, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, kategori, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            status_deleted: false,
            status: 'approved' // Divisi can only see approved poskas
        };

        if (search && search.trim()) {
            whereClause[Op.or] = [
                { judul: { [Op.like]: `%${search.trim()}%` } },
                { deskripsi: { [Op.like]: `%${search.trim()}%` } },
                { kategori: { [Op.like]: `%${search.trim()}%` } }
            ];
        }

        if (kategori && kategori !== 'all') {
            whereClause.kategori = kategori;
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
        console.error('Error getting divisi poskas:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/divisi/keuangan-poskas/:id - Get approved poskas by ID (divisi read-only)
router.get('/:id', authenticateToken, divisiOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const poskas = await KeuanganPoskas.findOne({
            where: {
                id: id,
                status_deleted: false,
                status: 'approved' // Divisi can only see approved poskas
            },
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
                message: 'Poskas not found or not approved'
            });
        }

        res.json({
            success: true,
            data: poskas
        });
    } catch (error) {
        console.error('Error getting divisi poskas by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/divisi/keuangan-poskas/stats - Get poskas statistics (divisi read-only)
router.get('/stats', authenticateToken, divisiOnly, async (req, res) => {
    try {
        const totalApprovedPoskas = await KeuanganPoskas.count({
            where: { status_deleted: false, status: 'approved' }
        });

        const totalAmount = await KeuanganPoskas.sum('jumlah', {
            where: { status_deleted: false, status: 'approved' }
        });

        // Get category breakdown
        const kategoriStats = await KeuanganPoskas.findAll({
            where: { status_deleted: false, status: 'approved' },
            attributes: [
                'kategori',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('jumlah')), 'total']
            ],
            group: ['kategori']
        });

        // Get monthly breakdown for current year
        const currentYear = new Date().getFullYear();
        const monthlyStats = await KeuanganPoskas.findAll({
            where: {
                status_deleted: false,
                status: 'approved',
                [Op.and]: [
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('tanggal')), currentYear)
                ]
            },
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('tanggal')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('jumlah')), 'total']
            ],
            group: [sequelize.fn('MONTH', sequelize.col('tanggal'))],
            order: [[sequelize.fn('MONTH', sequelize.col('tanggal')), 'ASC']]
        });

        res.json({
            success: true,
            data: {
                totalApprovedPoskas,
                totalAmount: totalAmount || 0,
                kategoriStats,
                monthlyStats,
                currentYear
            }
        });
    } catch (error) {
        console.error('Error getting divisi poskas stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/divisi/keuangan-poskas/categories - Get available categories
router.get('/categories', authenticateToken, divisiOnly, async (req, res) => {
    try {
        const categories = await KeuanganPoskas.findAll({
            where: { status_deleted: false, status: 'approved' },
            attributes: [
                'kategori',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['kategori'],
            order: [['kategori', 'ASC']]
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error getting divisi poskas categories:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/divisi/keuangan-poskas/search - Advanced search (divisi read-only)
router.get('/search', authenticateToken, divisiOnly, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            kategori,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        const whereClause = {
            status_deleted: false,
            status: 'approved' // Divisi can only see approved poskas
        };

        if (search && search.trim()) {
            whereClause[Op.or] = [
                { judul: { [Op.like]: `%${search.trim()}%` } },
                { deskripsi: { [Op.like]: `%${search.trim()}%` } },
                { kategori: { [Op.like]: `%${search.trim()}%` } }
            ];
        }

        if (kategori && kategori !== 'all') {
            whereClause.kategori = kategori;
        }

        if (startDate && endDate) {
            whereClause.tanggal = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        if (minAmount || maxAmount) {
            whereClause.jumlah = {};
            if (minAmount) whereClause.jumlah[Op.gte] = parseFloat(minAmount);
            if (maxAmount) whereClause.jumlah[Op.lte] = parseFloat(maxAmount);
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
        console.error('Error searching divisi poskas:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;

