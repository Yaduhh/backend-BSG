const express = require('express');
const router = express.Router();
const { TimMerah, TimBiru, User, SdmData, SdmJabatan, SdmDivisi } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// Hanya izinkan role leader (read-only)
function isLeader(req) {
  return String(req.user?.role || '').toLowerCase() === 'leader';
}

async function getSdmMapByUserIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return new Map();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const sdms = await SdmData.findAll({
    where: { user_id: { [Op.in]: unique } },
    include: [
      {
        model: SdmJabatan,
        as: 'jabatan',
        include: [{ model: SdmDivisi, as: 'divisi', attributes: ['id', 'nama_divisi'] }],
        attributes: ['id', 'nama_jabatan', 'divisi_id']
      }
    ]
  });
  const map = new Map();
  for (const s of sdms) {
    map.set(s.user_id, {
      nama: s.nama || '-',
      posisi: s.jabatan?.nama_jabatan || '-',
      divisi: s.jabatan?.divisi?.nama_divisi || '-',
    });
  }
  return map;
}

// GET /api/leader/tim-merah-biru/merah
router.get('/merah', authenticateToken, async (req, res) => {
  try {
    if (!isLeader(req)) {
      return res.status(403).json({ success: false, message: 'Access denied. Leader only.' });
    }

    const { page = 1, limit = 20, search, divisi, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status && status !== 'all') whereClause.status = status;

    if ((search && search.trim()) || (divisi && divisi !== 'all')) {
      const includeJabatan = {
        model: SdmJabatan,
        as: 'jabatan',
        include: [{ model: SdmDivisi, as: 'divisi', attributes: ['id', 'nama_divisi'] }],
        attributes: ['id', 'nama_jabatan', 'divisi_id']
      };
      const sdmWhere = {};
      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        sdmWhere[Op.or] = [{ nama: { [Op.like]: term } }];
        includeJabatan.where = { [Op.or]: [{ nama_jabatan: { [Op.like]: term } }] };
      }
      if (divisi && divisi !== 'all') {
        includeJabatan.include[0].where = { nama_divisi: divisi };
      }
      const sdms = await SdmData.findAll({ where: sdmWhere, include: [includeJabatan], attributes: ['user_id'] });
      const ids = sdms.map(s => s.user_id).filter(Boolean);
      whereClause.user_id = ids.length ? { [Op.in]: ids } : -1;
    }

    const timMerah = await TimMerah.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nama', 'email'] },
        { model: User, as: 'employee', attributes: ['id', 'nama', 'email'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const sdmMap = await getSdmMapByUserIds(timMerah.rows.map(r => r.user_id).filter(Boolean));
    const data = timMerah.rows.map(r => {
      const sdm = sdmMap.get(r.user_id);
      const plain = r.toJSON ? r.toJSON() : r;
      plain.nama = (plain.employee && plain.employee.nama) || (sdm && sdm.nama) || '-';
      plain.posisi = (sdm && sdm.posisi) || '-';
      plain.divisi = (sdm && sdm.divisi) || '-';
      return plain;
    });

    return res.json({
      success: true,
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(timMerah.count / limit),
        totalItems: timMerah.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error leader get tim merah:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/leader/tim-merah-biru/biru
router.get('/biru', authenticateToken, async (req, res) => {
  try {
    if (!isLeader(req)) {
      return res.status(403).json({ success: false, message: 'Access denied. Leader only.' });
    }

    const { page = 1, limit = 20, search, divisi } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClause[Op.or] = [{ prestasi: { [Op.like]: term } }];
    }

    if ((search && search.trim()) || (divisi && divisi !== 'all')) {
      const includeJabatan = {
        model: SdmJabatan,
        as: 'jabatan',
        include: [{ model: SdmDivisi, as: 'divisi', attributes: ['id', 'nama_divisi'] }],
        attributes: ['id', 'nama_jabatan', 'divisi_id']
      };
      if (divisi && divisi !== 'all') includeJabatan.include[0].where = { nama_divisi: divisi };
      const sdms = await SdmData.findAll({ include: [includeJabatan], attributes: ['user_id'] });
      const ids = sdms.map(s => s.user_id).filter(Boolean);
      if (ids.length) whereClause.user_id = { [Op.in]: ids }; else if (divisi && divisi !== 'all') whereClause.user_id = -1;
    }

    const timBiru = await TimBiru.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nama', 'email'] },
        { model: User, as: 'employee', attributes: ['id', 'nama', 'email'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const sdmMap = await getSdmMapByUserIds(timBiru.rows.map(r => r.user_id).filter(Boolean));
    const data = timBiru.rows.map(r => {
      const sdm = sdmMap.get(r.user_id);
      const plain = r.toJSON ? r.toJSON() : r;
      plain.nama = (plain.employee && plain.employee.nama) || (sdm && sdm.nama) || '-';
      plain.posisi = (sdm && sdm.posisi) || '-';
      plain.divisi = (sdm && sdm.divisi) || '-';
      return plain;
    });

    return res.json({
      success: true,
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(timBiru.count / limit),
        totalItems: timBiru.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error leader get tim biru:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/leader/tim-merah-biru/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (!isLeader(req)) {
      return res.status(403).json({ success: false, message: 'Access denied. Leader only.' });
    }
    const [timMerahCount, timBiruCount] = await Promise.all([
      TimMerah.count(),
      TimBiru.count()
    ]);
    const statusBreakdown = await TimMerah.findAll({
      attributes: ['status', [TimMerah.sequelize.fn('COUNT', TimMerah.sequelize.col('status')), 'count']],
      group: ['status'],
      raw: true
    });
    return res.json({ success: true, data: { timMerahCount, timBiruCount, totalCount: timMerahCount + timBiruCount, statusBreakdown } });
  } catch (error) {
    console.error('Error leader get stats:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;


