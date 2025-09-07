const express = require('express');
const router = express.Router();
const MediaSosial = require('../models/MediaSosial');
const { authenticateToken } = require('../middleware/auth');

// List with pagination and filters (year, month, date, search)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date = '', year = '', month = '' } = req.query;
    const result = await MediaSosial.getAll(
      parseInt(page),
      parseInt(limit),
      search,
      date,
      year,
      month
    );
    if (!result.success) return res.status(500).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in GET /media-sosial:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Distinct years
router.get('/years/distinct', authenticateToken, async (req, res) => {
  try {
    const result = await MediaSosial.getYearsDistinct();
    if (!result.success) return res.status(500).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in GET /media-sosial/years/distinct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Distinct months for a given year
router.get('/months/distinct', authenticateToken, async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: 'Parameter year diperlukan' });
    const result = await MediaSosial.getMonthsDistinct(year);
    if (!result.success) return res.status(500).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in GET /media-sosial/months/distinct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stats overview
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const result = await MediaSosial.getStats();
    if (!result.success) return res.status(500).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in GET /media-sosial/stats/overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await MediaSosial.getById(req.params.id);
    if (!result.success) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in GET /media-sosial/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tanggal_laporan, isi_laporan, images } = req.body;
    if (!tanggal_laporan || !isi_laporan) {
      return res.status(400).json({ error: 'tanggal_laporan dan isi_laporan harus diisi' });
    }
    const data = {
      id_user: req.user.id,
      tanggal_laporan,
      isi_laporan,
      images,
    };
    const result = await MediaSosial.create(data);
    if (!result.success) return res.status(500).json({ error: result.error });
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in POST /media-sosial:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { tanggal_laporan, isi_laporan, images } = req.body;
    if (!tanggal_laporan || !isi_laporan) {
      return res.status(400).json({ error: 'tanggal_laporan dan isi_laporan harus diisi' });
    }
    const result = await MediaSosial.update(req.params.id, { tanggal_laporan, isi_laporan, images });
    if (!result.success) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in PUT /media-sosial/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Soft delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await MediaSosial.delete(req.params.id);
    if (!result.success) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in DELETE /media-sosial/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
