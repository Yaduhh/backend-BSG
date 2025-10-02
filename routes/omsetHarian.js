const express = require('express');
const router = express.Router();
const OmsetHarian = require('../models/OmsetHarian');
const { authenticateToken } = require('../middleware/auth');

// Get all omset harian with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', date = '' } = req.query;

        const result = await OmsetHarian.getAll(
            parseInt(page),
            parseInt(limit),
            search,
            date
        );

        if (!result.success) {
            console.error('Error fetching omset harian:', result.error);
            // Return empty data instead of error
            return res.json({
                success: true,
                data: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: parseInt(limit)
                }
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in GET /omset-harian:', error);
        // Return empty data instead of 500 error
        res.json({
            success: true,
            data: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: parseInt(req.query.limit) || 10
            }
        });
    }
});

// Get omset harian by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await OmsetHarian.getById(id);

        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in GET /omset-harian/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new omset harian
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { tanggal_omset, isi_omset, images } = req.body;

        if (!tanggal_omset || !isi_omset) {
            return res.status(400).json({ error: 'Tanggal omset dan isi omset harus diisi' });
        }

        const data = {
            id_user: req.user.id,
            tanggal_omset,
            isi_omset,
            images
        };

        const result = await OmsetHarian.create(data);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error in POST /omset-harian:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update omset harian
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { tanggal_omset, isi_omset, images } = req.body;

        if (!tanggal_omset || !isi_omset) {
            return res.status(400).json({ error: 'Tanggal omset dan isi omset harus diisi' });
        }

        const data = {
            tanggal_omset,
            isi_omset,
            images
        };

        const result = await OmsetHarian.update(id, data);

        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in PUT /omset-harian/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete omset harian (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await OmsetHarian.delete(id);

        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in DELETE /omset-harian/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        const result = await OmsetHarian.getStats();

        if (!result.success) {
            console.error('Error fetching omset stats:', result.error);
            // Return empty stats instead of error
            return res.json({
                success: true,
                data: {
                    total: 0,
                    thisMonth: 0,
                    thisYear: 0
                }
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in GET /omset-harian/stats/overview:', error);
        // Return empty stats instead of 500 error
        res.json({
            success: true,
            data: {
                total: 0,
                thisMonth: 0,
                thisYear: 0
            }
        });
    }
});

module.exports = router;