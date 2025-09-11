const express = require('express');
const router = express.Router();
const TargetHarian = require('../models/TargetHarian');
const { authenticateToken } = require('../middleware/auth');

// Get all target harian with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date = '', year = '' } = req.query;

    const result = await TargetHarian.getAll(
      parseInt(page),
      parseInt(limit),
      search,
      date,
      year
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in GET /target:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get distinct years from tanggal_target
router.get('/years', authenticateToken, async (req, res) => {
  try {
    const result = await TargetHarian.getYears();
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json(result);
  } catch (error) {
    console.error('Error in GET /target/years:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get target harian by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await TargetHarian.getById(id);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in GET /target-harian/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new target harian
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tanggal_target, isi_target, images } = req.body;

    if (!tanggal_target || !isi_target) {
      return res.status(400).json({ error: 'Tanggal target dan isi target harus diisi' });
    }

    const data = {
      id_user: req.user.id,
      tanggal_target,
      isi_target,
      images
    };

    const result = await TargetHarian.create(data);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error in POST /target-harian:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update target harian
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal_target, isi_target, images } = req.body;

    if (!tanggal_target || !isi_target) {
      return res.status(400).json({ error: 'Tanggal target dan isi target harus diisi' });
    }

    const data = {
      tanggal_target,
      isi_target,
      images
    };

    const result = await TargetHarian.update(id, data);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in PUT /target-harian/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete target harian (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await TargetHarian.delete(id);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in DELETE /target-harian/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const result = await TargetHarian.getStats();

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in GET /target-harian/stats/overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
