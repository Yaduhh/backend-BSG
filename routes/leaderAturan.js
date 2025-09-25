const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Aturan = require('../models/Aturan');
const { LeaderDivisi, SdmData, SdmJabatan } = require('../models');
const { Op } = require('sequelize');

// List aturan terkait divisi leader (readonly)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ success: false, message: 'Access denied. Leader only.' });
    }

    // Ambil divisi leader
    const leaderDivisis = await LeaderDivisi.findAll({ where: { id_user: req.user.id, status_aktif: true }, attributes: ['id_divisi'] });
    const divisionIds = leaderDivisis.map(ld => ld.id_divisi);

    // Jika tidak ada relasi divisi, balikan kosong
    if (divisionIds.length === 0) return res.json({ success: true, data: [] });

    // Aturan model berbasis MySQL pool, tidak ada kolom divisi. Kita filter berdasarkan pembuat (id_user) yang berada di divisi leader.
    // Cari user id yang berada di salah satu divisi leader
    const usersInDivisi = await SdmData.findAll({
      attributes: ['user_id'],
      include: [{ model: SdmJabatan, as: 'jabatan', required: true, attributes: [], where: { divisi_id: { [Op.in]: divisionIds } } }],
      where: { status_deleted: false }
    });
    const allowedUserIds = [...new Set(usersInDivisi.map(r => r.user_id).filter(Boolean))];

    // Ambil semua aturan dan filter by id_user (pembuat) yang ada di daftar allowedUserIds
    const allAturan = await Aturan.getAll();
    const filtered = allAturan.filter(a => allowedUserIds.includes(a.id_user));
    return res.json({ success: true, data: filtered });
  } catch (err) {
    console.error('Error fetching leader aturan:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Detail aturan (readonly) - boleh diakses jika pembuatnya berada pada divisi leader
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ success: false, message: 'Access denied. Leader only.' });
    }
    const item = await Aturan.getById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Aturan tidak ditemukan' });

    // Validasi akses terhadap divisi
    const leaderDivisis = await LeaderDivisi.findAll({ where: { id_user: req.user.id, status_aktif: true }, attributes: ['id_divisi'] });
    const divisionIds = leaderDivisis.map(ld => ld.id_divisi);
    const sdmOwner = await SdmData.findOne({ where: { user_id: item.id_user, status_deleted: false }, include: [{ model: SdmJabatan, as: 'jabatan', required: true, attributes: ['divisi_id'] }] });
    if (!sdmOwner || !divisionIds.includes(sdmOwner.jabatan.divisi_id)) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak mengakses aturan ini' });
    }
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('Error fetching leader aturan detail:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;


