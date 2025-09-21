const express = require('express');
const router = express.Router();
const { TimMerah, TimBiru, User, SdmData, SdmJabatan, SdmDivisi } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// ===== TIM MERAH ROUTES =====

// Helper: case-insensitive role check
function hasRole(req, allowedRoles = []) {
  const role = String(req.user?.role || '').toLowerCase();
  return allowedRoles.includes(role);
}

// Helper: ambil SDM map untuk banyak user_id sekaligus
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

// Helper: cari user_id yang match berdasarkan parameter pencarian SDM
async function findUserIdsBySdmFilters({ search, divisi }) {
  const whereSdm = {};
  const includeJabatan = {
    model: SdmJabatan,
    as: 'jabatan',
    include: [{ model: SdmDivisi, as: 'divisi', attributes: ['id', 'nama_divisi'] }],
    attributes: ['id', 'nama_jabatan', 'divisi_id']
  };

  // Build conditions via Op.like on nama_jabatan and nama_divisi when search provided
  const sdmWhereOr = [];
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    // SdmData.nama
    sdmWhereOr.push({ nama: { [Op.like]: term } });
    // Jabatan.nama_jabatan
    includeJabatan.where = includeJabatan.where || {};
    includeJabatan.where[Op.or] = [
      { nama_jabatan: { [Op.like]: term } }
    ];
  }

  // Filter divisi by exact match (nama_divisi)
  if (divisi && divisi !== 'all') {
    includeJabatan.include[0].where = { nama_divisi: divisi };
  }

  if (sdmWhereOr.length) whereSdm[Op.or] = sdmWhereOr;

  const sdms = await SdmData.findAll({
    where: whereSdm,
    include: [includeJabatan],
    attributes: ['user_id']
  });
  return sdms.map(s => s.user_id).filter(Boolean);
}

// Get all tim merah (admin & leader read-only)
router.get('/merah', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }


    const { page = 1, limit = 20, search, divisi, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Filter by SDM if search/divisi provided
    if ((search && search.trim()) || (divisi && divisi !== 'all')) {
      const matchedUserIds = await findUserIdsBySdmFilters({ search, divisi });
      whereClause.user_id = matchedUserIds.length ? { [Op.in]: matchedUserIds } : -1; // -1 to yield empty when no match
    }

    const timMerah = await TimMerah.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'email']
        },
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'nama', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Override nama/divisi/posisi dengan SDM
    const userIds = timMerah.rows.map(r => r.user_id).filter(Boolean);
    const sdmMap = await getSdmMapByUserIds(userIds);
    const data = timMerah.rows.map(r => {
      const sdm = sdmMap.get(r.user_id);
      const plain = r.toJSON ? r.toJSON() : r;
      if (sdm) {
        plain.nama = sdm.nama;
        plain.posisi = sdm.posisi;
        plain.divisi = sdm.divisi;
      }
      return plain;
    });

    res.json({
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
    console.error('Error fetching tim merah:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get tim merah by ID (admin & leader read-only)
router.get('/merah/:id', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const timMerah = await TimMerah.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'email']
        },
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    if (!timMerah) {
      return res.status(404).json({
        success: false,
        message: 'Tim merah entry not found'
      });
    }

    // Override dengan SDM jika ada user_id
    let data = timMerah.toJSON ? timMerah.toJSON() : timMerah;
    if (timMerah.user_id) {
      const sdmMap = await getSdmMapByUserIds([timMerah.user_id]);
      const sdm = sdmMap.get(timMerah.user_id);
      if (sdm) {
        data.nama = sdm.nama;
        data.posisi = sdm.posisi;
        data.divisi = sdm.divisi;
      }
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tim merah by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper: snapshot data dari SDM berdasarkan user_id
async function getSdmSnapshotByUserId(user_id) {
  const snapshot = { nama: '-', divisi: '-', posisi: '-' };
  if (!user_id) return snapshot;
  try {
    const sdm = await SdmData.findOne({
      where: { user_id },
      include: [
        {
          model: SdmJabatan,
          as: 'jabatan',
          include: [{ model: SdmDivisi, as: 'divisi', attributes: ['id', 'nama_divisi'] }],
          attributes: ['id', 'nama_jabatan', 'divisi_id']
        }
      ]
    });
    if (sdm) {
      snapshot.nama = sdm.nama || snapshot.nama;
      snapshot.posisi = sdm.jabatan?.nama_jabatan || snapshot.posisi;
      snapshot.divisi = sdm.jabatan?.divisi?.nama_divisi || snapshot.divisi;
    } else {
      // fallback ke data user
      const user = await User.findByPk(user_id, { attributes: ['nama'] });
      if (user) snapshot.nama = user.nama || snapshot.nama;
    }
  } catch (e) {
    // ignore, gunakan default snapshot
  }
  return snapshot;
}

// GET /api/tim-merah-biru/snapshot?user_id=123
router.get('/snapshot', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'owner', 'leader'])) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }
    const snap = await getSdmSnapshotByUserId(user_id);
    return res.json({ success: true, data: snap });
  } catch (error) {
    console.error('Error in snapshot:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new tim merah entry (menggunakan user_id -> snapshot SDM)
router.post('/merah', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const { user_id, status, keterangan, nama } = req.body;

    if (!status || (!user_id && !nama)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: status and (user_id or nama)'
      });
    }

    if (!['SP1', 'SP2', 'SP3'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be SP1, SP2, or SP3'
      });
    }

    let finalNama = nama || null;
    let finalUserId = user_id || null;
    if (user_id && !finalNama) {
      const snap = await getSdmSnapshotByUserId(user_id);
      finalNama = snap.nama;
    }

    const timMerah = await TimMerah.create({
      user_id: finalUserId,
      nama: finalNama,
      status,
      keterangan: keterangan || '',
      created_by: req.user.id
    });

    const createdEntry = await TimMerah.findByPk(timMerah.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nama', 'email'] },
        { model: User, as: 'employee', attributes: ['id', 'nama', 'email'] }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Tim merah entry created successfully',
      data: createdEntry
    });
  } catch (error) {
    console.error('Error creating tim merah:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update tim merah entry (optional ganti user_id -> re-snapshot)
router.put('/merah/:id', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const { id } = req.params;
    const { user_id, status, keterangan, nama } = req.body;

    const timMerah = await TimMerah.findByPk(id);
    if (!timMerah) {
      return res.status(404).json({ success: false, message: 'Tim merah entry not found' });
    }

    if (status && !['SP1', 'SP2', 'SP3'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be SP1, SP2, or SP3' });
    }

    let payload = {
      status: status || timMerah.status,
      keterangan: keterangan !== undefined ? keterangan : timMerah.keterangan
    };
    if (user_id) {
      const snap = await getSdmSnapshotByUserId(user_id);
      payload = { ...payload, user_id, nama: snap.nama };
    } else if (nama) {
      payload = { ...payload, nama };
    }

    await timMerah.update(payload);

    const updatedEntry = await TimMerah.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nama', 'email'] },
        { model: User, as: 'employee', attributes: ['id', 'nama', 'email'] }
      ]
    });

    return res.json({ success: true, message: 'Tim merah entry updated successfully', data: updatedEntry });
  } catch (error) {
    console.error('Error updating tim merah:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/merah/:id', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const { id } = req.params;
    const timMerah = await TimMerah.findByPk(id);
    if (!timMerah) return res.status(404).json({ success: false, message: 'Tim merah entry not found' });
    await timMerah.destroy();
    return res.json({ success: true, message: 'Tim merah entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting tim merah:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== TIM BIRU ROUTES =====

// Get all tim biru (admin & leader read-only)
router.get('/biru', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { page = 1, limit = 20, search, divisi } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [{ prestasi: { [Op.like]: searchTerm } }];
    }

    if ((search && search.trim()) || (divisi && divisi !== 'all')) {
      const matchedUserIds = await findUserIdsBySdmFilters({ search, divisi });
      if (matchedUserIds.length) whereClause.user_id = { [Op.in]: matchedUserIds };
      else if (divisi && divisi !== 'all') whereClause.user_id = -1;
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

    const userIds = timBiru.rows.map(r => r.user_id).filter(Boolean);
    const sdmMap = await getSdmMapByUserIds(userIds);
    const data = timBiru.rows.map(r => {
      const sdm = sdmMap.get(r.user_id);
      const plain = r.toJSON ? r.toJSON() : r;
      if (sdm) {
        plain.nama = sdm.nama;
        plain.posisi = sdm.posisi;
        plain.divisi = sdm.divisi;
      }
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
    console.error('Error fetching tim biru:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get tim biru by ID (admin & leader read-only)
router.get('/biru/:id', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const timBiru = await TimBiru.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nama', 'email'] },
        { model: User, as: 'employee', attributes: ['id', 'nama', 'email'] }
      ]
    });

    if (!timBiru) return res.status(404).json({ success: false, message: 'Tim biru entry not found' });

    let data = timBiru.toJSON ? timBiru.toJSON() : timBiru;
    if (timBiru.user_id) {
      const sdmMap = await getSdmMapByUserIds([timBiru.user_id]);
      const sdm = sdmMap.get(timBiru.user_id);
      if (sdm) {
        data.nama = sdm.nama;
        data.posisi = sdm.posisi;
        data.divisi = sdm.divisi;
      }
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tim biru by ID:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new tim biru entry (menggunakan user_id -> snapshot SDM)
router.post('/biru', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const { user_id, prestasi, keterangan, nama } = req.body;
    if (!prestasi || (!user_id && !nama)) {
      return res.status(400).json({ success: false, message: 'Missing required fields: prestasi and (user_id or nama)' });
    }

    let finalNama = nama || null;
    let finalUserId = user_id || null;
    if (user_id && !finalNama) {
      const snap = await getSdmSnapshotByUserId(user_id);
      finalNama = snap.nama;
    }

    const timBiru = await TimBiru.create({
      user_id: finalUserId,
      nama: finalNama,
      prestasi,
      keterangan: keterangan || '',
      created_by: req.user.id
    });

    const createdEntry = await TimBiru.findByPk(timBiru.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nama', 'email'] },
        { model: User, as: 'employee', attributes: ['id', 'nama', 'email'] }
      ]
    });

    return res.status(201).json({ success: true, message: 'Tim biru entry created successfully', data: createdEntry });
  } catch (error) {
    console.error('Error creating tim biru:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update tim biru entry (optional ganti user_id -> re-snapshot)
router.put('/biru/:id', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const { id } = req.params;
    const { user_id, prestasi, keterangan, nama } = req.body;

    const timBiru = await TimBiru.findByPk(id);
    if (!timBiru) return res.status(404).json({ success: false, message: 'Tim biru entry not found' });

    let payload = {
      prestasi: prestasi || timBiru.prestasi,
      keterangan: keterangan !== undefined ? keterangan : timBiru.keterangan
    };
    if (user_id) {
      const snap = await getSdmSnapshotByUserId(user_id);
      payload = { ...payload, user_id, nama: snap.nama };
    } else if (nama) {
      payload = { ...payload, nama };
    }

    await timBiru.update(payload);

    const updatedEntry = await TimBiru.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'nama', 'email'] },
        { model: User, as: 'employee', attributes: ['id', 'nama', 'email'] }
      ]
    });

    return res.json({ success: true, message: 'Tim biru entry updated successfully', data: updatedEntry });
  } catch (error) {
    console.error('Error updating tim biru:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/biru/:id', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Owner only.'
      });
    }

    const { id } = req.params;
    const timBiru = await TimBiru.findByPk(id);
    if (!timBiru) return res.status(404).json({ success: false, message: 'Tim biru entry not found' });
    await timBiru.destroy();
    return res.json({ success: true, message: 'Tim biru entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting tim biru:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== COMBINED ROUTES =====

// Get summary statistics (admin & leader read-only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['admin', 'leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // ... (rest of the code remains the same)
    // Get status breakdown for tim merah
    const statusBreakdown = await TimMerah.findAll({
      attributes: [
        'status',
        [TimMerah.sequelize.fn('COUNT', TimMerah.sequelize.col('status')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get recent entries (last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);

    const [recentMerah, recentBiru] = await Promise.all([
      TimMerah.count({
        where: {
          created_at: {
            [Op.gte]: recentDate
          }
        }
      }),
      TimBiru.count({
        where: {
          created_at: {
            [Op.gte]: recentDate
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        timMerahCount,
        timBiruCount,
        totalCount: timMerahCount + timBiruCount,
        statusBreakdown,
        recentEntries: {
          timMerah: recentMerah,
          timBiru: recentBiru,
          total: recentMerah + recentBiru
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
