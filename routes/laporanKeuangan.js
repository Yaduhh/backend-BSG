const express = require('express');
const router = express.Router();
const LaporanKeuangan = require('../models/LaporanKeuangan');
const { authenticateToken } = require('../middleware/auth');

// Get all laporan keuangan with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', date = '' } = req.query;

        const result = await LaporanKeuangan.getAll(
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
        console.error('Error in GET /laporan-keuangan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get statistics - MUST BE BEFORE /:id route
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        const result = await LaporanKeuangan.getStats();

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in GET /laporan-keuangan/stats/overview:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get laporan keuangan by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 GET /laporan-keuangan/:id - Requested ID:', id);
        console.log('🔍 User:', req.user);

        const result = await LaporanKeuangan.getById(id);
        console.log('🔍 Database result:', result);

        if (!result.success) {
            console.log('❌ Result not successful:', result.error);
            return res.status(404).json({ error: result.error });
        }

        console.log('✅ Sending successful response');
        res.json(result);
    } catch (error) {
        console.error('Error in GET /laporan-keuangan/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new laporan keuangan
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { tanggal_laporan, isi_laporan, images } = req.body;

        if (!tanggal_laporan || !isi_laporan) {
            return res.status(400).json({ error: 'Tanggal laporan dan isi laporan harus diisi' });
        }

        const data = {
            id_user: req.user.id,
            tanggal_laporan,
            isi_laporan,
            images
        };

        const result = await LaporanKeuangan.create(data);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error in POST /laporan-keuangan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update laporan keuangan
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { tanggal_laporan, isi_laporan, images } = req.body;

        if (!tanggal_laporan || !isi_laporan) {
            return res.status(400).json({ error: 'Tanggal laporan dan isi laporan harus diisi' });
        }

        const data = {
            tanggal_laporan,
            isi_laporan,
            images
        };

        const result = await LaporanKeuangan.update(id, data);

        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in PUT /laporan-keuangan/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete laporan keuangan (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await LaporanKeuangan.delete(id);

        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in DELETE /laporan-keuangan/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 