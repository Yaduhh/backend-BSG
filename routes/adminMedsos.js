const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const Medsos = require('../models/Medsos');
const MedsosKol = require('../models/MedsosKol');
const MedsosAnggaran = require('../models/MedsosAnggaran');
const MedsosPlatformCosts = require('../models/MedsosPlatformCosts');

// ===== MEDSOS PLATFORM ROUTES =====

// Get all medsos data with optional filtering
router.get('/platform', authenticateAdmin, async (req, res) => {
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
router.get('/platform/:id', authenticateAdmin, async (req, res) => {
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

// Create new medsos data
router.post('/platform', authenticateAdmin, async (req, res) => {
  try {
    const {
      platform,
      follower_saat_ini,
      follower_bulan_lalu,
      konten_terupload,
      story_terupload,
      konten_terbaik_link
    } = req.body;

    // Validation
    if (!platform || follower_saat_ini === undefined || follower_bulan_lalu === undefined || konten_terupload === undefined || story_terupload === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi kecuali konten terbaik link'
      });
    }

    const medsosData = {
      platform,
      follower_saat_ini,
      follower_bulan_lalu,
      konten_terupload,
      story_terupload,
      konten_terbaik_link,
      created_by: req.user.id
    };

    const medsosId = await Medsos.create(medsosData);

    res.status(201).json({
      success: true,
      message: 'Data medsos berhasil ditambahkan',
      data: { id: medsosId }
    });
  } catch (error) {
    console.error('Error creating medsos:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data medsos'
    });
  }
});

// Update medsos data
router.put('/platform/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      platform,
      follower_saat_ini,
      follower_bulan_lalu,
      konten_terupload,
      story_terupload,
      konten_terbaik_link
    } = req.body;

    // Check if medsos exists
    const existingMedsos = await Medsos.getById(id);
    if (!existingMedsos) {
      return res.status(404).json({
        success: false,
        message: 'Data medsos tidak ditemukan'
      });
    }

    // Validation
    if (!platform || follower_saat_ini === undefined || follower_bulan_lalu === undefined || konten_terupload === undefined || story_terupload === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi kecuali konten terbaik link'
      });
    }

    const medsosData = {
      platform,
      follower_saat_ini,
      follower_bulan_lalu,
      konten_terupload,
      story_terupload,
      konten_terbaik_link
    };

    const updated = await Medsos.update(id, medsosData);

    if (updated) {
      res.json({
        success: true,
        message: 'Data medsos berhasil diperbarui'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Gagal memperbarui data medsos'
      });
    }
  } catch (error) {
    console.error('Error updating medsos:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data medsos'
    });
  }
});

// Delete medsos data
router.delete('/platform/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if medsos exists
    const existingMedsos = await Medsos.getById(id);
    if (!existingMedsos) {
      return res.status(404).json({
        success: false,
        message: 'Data medsos tidak ditemukan'
      });
    }

    const deleted = await Medsos.delete(id);

    if (deleted) {
      res.json({
        success: true,
        message: 'Data medsos berhasil dihapus'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Gagal menghapus data medsos'
      });
    }
  } catch (error) {
    console.error('Error deleting medsos:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data medsos'
    });
  }
});

// ===== KOL ROUTES =====

// Get all KOL data
router.get('/kol', authenticateAdmin, async (req, res) => {
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
router.get('/kol/:id', authenticateAdmin, async (req, res) => {
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

// Create new KOL data
router.post('/kol', authenticateAdmin, async (req, res) => {
  try {
    const {
      nama_akun,
      follower_ig,
      follower_tiktok,
      ratecard
    } = req.body;

    // Validation
    if (!nama_akun || follower_ig === undefined || follower_tiktok === undefined || ratecard === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi'
      });
    }

    const kolData = {
      nama_akun,
      follower_ig,
      follower_tiktok,
      ratecard,
      created_by: req.user.id
    };

    const kolId = await MedsosKol.create(kolData);

    res.status(201).json({
      success: true,
      message: 'Data KOL berhasil ditambahkan',
      data: { id: kolId }
    });
  } catch (error) {
    console.error('Error creating KOL:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data KOL'
    });
  }
});

// Update KOL data
router.put('/kol/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama_akun,
      follower_ig,
      follower_tiktok,
      ratecard
    } = req.body;

    // Check if KOL exists
    const existingKol = await MedsosKol.getById(id);
    if (!existingKol) {
      return res.status(404).json({
        success: false,
        message: 'Data KOL tidak ditemukan'
      });
    }

    // Validation
    if (!nama_akun || follower_ig === undefined || follower_tiktok === undefined || ratecard === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi'
      });
    }

    const kolData = {
      nama_akun,
      follower_ig,
      follower_tiktok,
      ratecard
    };

    const updated = await MedsosKol.update(id, kolData);

    if (updated) {
      res.json({
        success: true,
        message: 'Data KOL berhasil diperbarui'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Gagal memperbarui data KOL'
      });
    }
  } catch (error) {
    console.error('Error updating KOL:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data KOL'
    });
  }
});

// Delete KOL data
router.delete('/kol/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if KOL exists
    const existingKol = await MedsosKol.getById(id);
    if (!existingKol) {
      return res.status(404).json({
        success: false,
        message: 'Data KOL tidak ditemukan'
      });
    }

    const deleted = await MedsosKol.delete(id);

    if (deleted) {
      res.json({
        success: true,
        message: 'Data KOL berhasil dihapus'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Gagal menghapus data KOL'
      });
    }
  } catch (error) {
    console.error('Error deleting KOL:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data KOL'
    });
  }
});

// ===== ANGGARAN ROUTES =====

// Get all anggaran data
router.get('/anggaran', authenticateAdmin, async (req, res) => {
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
router.get('/anggaran/:id', authenticateAdmin, async (req, res) => {
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

// Create new anggaran data
router.post('/anggaran', authenticateAdmin, async (req, res) => {
  try {
    const {
      nama_akun,
      follower_ig,
      follower_tiktok,
      ratecard
    } = req.body;

    // Validation
    if (!nama_akun) {
      return res.status(400).json({
        success: false,
        message: 'Nama akun wajib diisi'
      });
    }

    const anggaranData = {
      nama_akun,
      follower_ig: parseInt(follower_ig) || 0,
      follower_tiktok: parseInt(follower_tiktok) || 0,
      ratecard: parseFloat(ratecard) || 0,
      created_by: req.user.id
    };

    const result = await MedsosAnggaran.create(anggaranData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating anggaran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data anggaran'
    });
  }
});

// Update anggaran data
router.put('/anggaran/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama_akun,
      follower_ig,
      follower_tiktok,
      ratecard
    } = req.body;

    // Validation
    if (!nama_akun) {
      return res.status(400).json({
        success: false,
        message: 'Nama akun wajib diisi'
      });
    }

    const anggaranData = {
      nama_akun,
      follower_ig: parseInt(follower_ig) || 0,
      follower_tiktok: parseInt(follower_tiktok) || 0,
      ratecard: parseFloat(ratecard) || 0
    };

    const result = await MedsosAnggaran.update(parseInt(id), anggaranData);
    res.json(result);
  } catch (error) {
    console.error('Error updating anggaran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data anggaran'
    });
  }
});

// Delete anggaran data
router.delete('/anggaran/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await MedsosAnggaran.delete(parseInt(id));
    res.json(result);
  } catch (error) {
    console.error('Error deleting anggaran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data anggaran'
    });
  }
});

// ===== PLATFORM COSTS ROUTES =====

// Get all platform costs data
router.get('/platform-costs', authenticateAdmin, async (req, res) => {
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
router.get('/platform-costs/:id', authenticateAdmin, async (req, res) => {
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

// Create new platform costs data
router.post('/platform-costs', authenticateAdmin, async (req, res) => {
  try {
    const {
      platform,
      biaya
    } = req.body;

    // Validation
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Platform wajib diisi'
      });
    }

    const platformCostsData = {
      platform,
      biaya: parseFloat(biaya) || 0,
      created_by: req.user.id
    };

    const result = await MedsosPlatformCosts.create(platformCostsData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating platform costs:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data platform costs'
    });
  }
});

// Update platform costs data
router.put('/platform-costs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      platform,
      biaya
    } = req.body;

    // Validation
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Platform wajib diisi'
      });
    }

    const platformCostsData = {
      platform,
      biaya: parseFloat(biaya) || 0
    };

    const result = await MedsosPlatformCosts.update(parseInt(id), platformCostsData);
    res.json(result);
  } catch (error) {
    console.error('Error updating platform costs:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data platform costs'
    });
  }
});

// Delete platform costs data
router.delete('/platform-costs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await MedsosPlatformCosts.delete(parseInt(id));
    res.json(result);
  } catch (error) {
    console.error('Error deleting platform costs:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data platform costs'
    });
  }
});

module.exports = router;
