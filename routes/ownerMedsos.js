const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Medsos = require('../models/Medsos');
const MedsosKol = require('../models/MedsosKol');
const MedsosAnggaran = require('../models/MedsosAnggaran');
const MedsosPlatformCosts = require('../models/MedsosPlatformCosts');

// ===== MEDSOS PLATFORM ROUTES (READ-ONLY) =====

// Get all medsos data with optional filtering
router.get('/platform', authenticateToken, async (req, res) => {
  try {
    const { platform, search } = req.query;
    let medsosData = [];

    if (search) {
      medsosData = await Medsos.search(search);
    } else if (platform) {
      medsosData = await Medsos.getByPlatform(platform);
    } else {
      medsosData = await Medsos.getAll();
    }

    // Get statistics
    const stats = await Medsos.getStats();

    res.json({
      success: true,
      data: medsosData,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching medsos data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data medsos'
    });
  }
});

// Get medsos by ID
router.get('/platform/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const medsosData = await Medsos.getById(id);

    if (!medsosData) {
      return res.status(404).json({
        success: false,
        message: 'Data medsos tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: medsosData
    });
  } catch (error) {
    console.error('Error fetching medsos:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data medsos'
    });
  }
});

// ===== KOL ROUTES (READ-ONLY) =====

// Get all KOL data
router.get('/kol', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    let kolData = [];

    if (search) {
      kolData = await MedsosKol.search(search);
    } else {
      kolData = await MedsosKol.getAll();
    }

    // Get statistics
    const stats = await MedsosKol.getStats();

    res.json({
      success: true,
      data: kolData,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching KOL data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data KOL'
    });
  }
});

// Get KOL by ID
router.get('/kol/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const kolData = await MedsosKol.getById(id);

    if (!kolData) {
      return res.status(404).json({
        success: false,
        message: 'Data KOL tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: kolData
    });
  } catch (error) {
    console.error('Error fetching KOL:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data KOL'
    });
  }
});

// ===== ANGGARAN ROUTES (READ-ONLY) =====

// Get all anggaran data
router.get('/anggaran', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    let result;

    if (search) {
      result = await MedsosAnggaran.search(search);
    } else {
      result = await MedsosAnggaran.getAll();
    }

    if (result.success) {
      const stats = await MedsosAnggaran.getStats();
      res.json({
        success: true,
        data: result.data,
        stats: stats.data
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error fetching anggaran data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data anggaran'
    });
  }
});

// Get anggaran by ID
router.get('/anggaran/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await MedsosAnggaran.getById(parseInt(id));

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching anggaran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data anggaran'
    });
  }
});

// ===== PLATFORM COSTS ROUTES (READ-ONLY) =====

// Get all platform costs data
router.get('/platform-costs', authenticateToken, async (req, res) => {
  try {
    const { platform, search } = req.query;
    let result;

    if (search) {
      result = await MedsosPlatformCosts.search(search);
    } else if (platform) {
      result = await MedsosPlatformCosts.getByPlatform(platform);
    } else {
      result = await MedsosPlatformCosts.getAll();
    }

    if (result.success) {
      const stats = await MedsosPlatformCosts.getStats();
      res.json({
        success: true,
        data: result.data,
        stats: stats.data
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error fetching platform costs data:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data platform costs'
    });
  }
});

// Get platform costs by ID
router.get('/platform-costs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await MedsosPlatformCosts.getById(parseInt(id));

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching platform costs:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data platform costs'
    });
  }
});

module.exports = router;
