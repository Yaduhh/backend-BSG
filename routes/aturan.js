const express = require('express');
const router = express.Router();
const Aturan = require('../models/Aturan');

// List (optional: search ?q=)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const data = q ? await Aturan.search(q) : await Aturan.getAll();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Gagal memuat aturan' });
  }
});

// Detail
router.get('/:id', async (req, res) => {
  try {
    const item = await Aturan.getById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Aturan tidak ditemukan' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Gagal memuat aturan' });
  }
});

// Create
router.post('/', async (req, res) => {
  try {
    const { id_user, tanggal_aturan, judul_aturan, isi_aturan, images } = req.body;
    if (!id_user || !tanggal_aturan || !judul_aturan) {
      return res.status(400).json({ success: false, message: 'id_user, tanggal_aturan, judul_aturan wajib diisi' });
    }
    // images diharapkan sudah berupa array atau JSON string
    let parsedImages = null;
    if (images) {
      try { parsedImages = typeof images === 'string' ? JSON.parse(images) : images; } catch { parsedImages = null; }
    }
    const created = await Aturan.create({ id_user, tanggal_aturan, judul_aturan, isi_aturan, images: parsedImages });
    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Gagal membuat aturan' });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const { tanggal_aturan, judul_aturan, isi_aturan, images } = req.body;
    let parsedImages = null;
    if (images) {
      try { parsedImages = typeof images === 'string' ? JSON.parse(images) : images; } catch { parsedImages = null; }
    }
    const updated = await Aturan.update(req.params.id, { tanggal_aturan, judul_aturan, isi_aturan, images: parsedImages });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Gagal mengupdate aturan' });
  }
});

// Delete (soft)
router.delete('/:id', async (req, res) => {
  try {
    const result = await Aturan.delete(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Gagal menghapus aturan' });
  }
});

module.exports = router;
