const express = require('express');
const router = express.Router();
const MediaSosial = require('../models/MediaSosial');
const { authenticateToken } = require('../middleware/auth');

// Middleware untuk memastikan hanya owner yang bisa akses
const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Owner only.'
    });
  }
  next();
};

// List with pagination and filters (year, month, date, search) - read-only preview
router.get('/', authenticateToken, ownerOnly, async (req, res) => {
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
    console.error('Error in GET /owner/media-sosial:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Distinct years - read-only preview
router.get('/years/distinct', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const result = await MediaSosial.getYearsDistinct();
    if (!result.success) return res.status(500).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in GET /owner/media-sosial/years/distinct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Distinct months for a given year - read-only preview
router.get('/months/distinct', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: 'Parameter year diperlukan' });
    const result = await MediaSosial.getMonthsDistinct(year);
    if (!result.success) return res.status(500).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in GET /owner/media-sosial/months/distinct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stats overview - read-only preview
router.get('/statistics/overview', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const result = await MediaSosial.getStats();
    if (!result.success) return res.status(500).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in GET /owner/media-sosial/statistics/overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get by id - read-only preview
router.get('/:id', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const result = await MediaSosial.getById(req.params.id);
    if (!result.success) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in GET /owner/media-sosial/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search media sosial - read-only preview
router.get('/search', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ error: 'Parameter q diperlukan' });
    
    const result = await MediaSosial.getAll(
      parseInt(page),
      parseInt(limit),
      q,
      '',
      '',
      ''
    );
    if (!result.success) return res.status(500).json({ error: result.error });
    res.json(result);
  } catch (error) {
    console.error('Error in GET /owner/media-sosial/search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export media sosial - read-only preview
router.get('/export/:format', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { format } = req.params;
    const { year, month } = req.query;
    
    // Get data for export
    const result = await MediaSosial.getAll(1, 1000, '', '', year, month);
    if (!result.success) return res.status(500).json({ error: result.error });
    
    if (format === 'pdf') {
      // Simple PDF export (you can enhance this)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=media-sosial.pdf');
      res.json({ message: 'PDF export not implemented yet', data: result.data });
    } else if (format === 'excel') {
      // Simple Excel export (you can enhance this)
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=media-sosial.xlsx');
      res.json({ message: 'Excel export not implemented yet', data: result.data });
    } else {
      return res.status(400).json({ error: 'Format tidak didukung' });
    }
  } catch (error) {
    console.error('Error in GET /owner/media-sosial/export/:format:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
