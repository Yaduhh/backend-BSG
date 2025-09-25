const express = require('express');
const router = express.Router();
const { TimMerah, TimBiru, User, SdmData, SdmJabatan, SdmDivisi } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

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

// ===== OWNER TIM MERAH ROUTES (READ ONLY) =====

// Get all tim merah (owner only - read only)
router.get('/merah', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const { page = 1, limit = 50 } = req.query; // Higher limit for owner
    const offset = (page - 1) * limit;

    const timMerah = await TimMerah.findAndCountAll({
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

    // Override nama/divisi/posisi dari SDM
    const userIds = timMerah.rows.map(r => r.user_id).filter(Boolean);
    const sdmMap = await getSdmMapByUserIds(userIds);
    const data = timMerah.rows.map(r => {
      const plain = r.toJSON ? r.toJSON() : r;
      const sdm = sdmMap.get(r.user_id);
      // Menggunakan employee.nama sebagai fallback pertama seperti admin
      plain.nama = (plain.employee && plain.employee.nama) || (sdm && sdm.nama) || '-';
      plain.posisi = (sdm && sdm.posisi) || '-';
      plain.divisi = (sdm && sdm.divisi) || '-';
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
    console.error('Error fetching tim merah for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get tim merah by ID (owner only - read only)
router.get('/merah/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
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

    let data = timMerah.toJSON ? timMerah.toJSON() : timMerah;
    if (timMerah.user_id) {
      const sdmMap = await getSdmMapByUserIds([timMerah.user_id]);
      const sdm = sdmMap.get(timMerah.user_id);
      if (sdm) {
        data.nama = (data.employee && data.employee.nama) || sdm.nama || '-';
        data.posisi = sdm.posisi || '-';
        data.divisi = sdm.divisi || '-';
      } else {
        data.nama = (data.employee && data.employee.nama) || data.nama || '-';
        data.posisi = data.posisi || '-';
        data.divisi = data.divisi || '-';
      }
    } else {
      data.nama = (data.employee && data.employee.nama) || data.nama || '-';
      data.posisi = data.posisi || '-';
      data.divisi = data.divisi || '-';
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tim merah by ID for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== OWNER TIM BIRU ROUTES (READ ONLY) =====

// Get all tim biru (owner only - read only)
router.get('/biru', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const { page = 1, limit = 50 } = req.query; // Higher limit for owner
    const offset = (page - 1) * limit;

    const timBiru = await TimBiru.findAndCountAll({
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

    const userIdsB = timBiru.rows.map(r => r.user_id).filter(Boolean);
    const sdmMapB = await getSdmMapByUserIds(userIdsB);
    const dataB = timBiru.rows.map(r => {
      const plain = r.toJSON ? r.toJSON() : r;
      const sdm = sdmMapB.get(r.user_id);
      // Menggunakan employee.nama sebagai fallback pertama seperti admin
      plain.nama = (plain.employee && plain.employee.nama) || (sdm && sdm.nama) || '-';
      plain.posisi = (sdm && sdm.posisi) || '-';
      plain.divisi = (sdm && sdm.divisi) || '-';
      return plain;
    });

    res.json({
      success: true,
      data: dataB,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(timBiru.count / limit),
        totalItems: timBiru.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tim biru for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get tim biru by ID (owner only - read only)
router.get('/biru/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const { id } = req.params;
    const timBiru = await TimBiru.findByPk(id, {
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

    if (!timBiru) {
      return res.status(404).json({
        success: false,
        message: 'Tim biru entry not found'
      });
    }

    let data = timBiru.toJSON ? timBiru.toJSON() : timBiru;
    if (timBiru.user_id) {
      const sdmMap = await getSdmMapByUserIds([timBiru.user_id]);
      const sdm = sdmMap.get(timBiru.user_id);
      if (sdm) {
        data.nama = (data.employee && data.employee.nama) || sdm.nama || '-';
        data.posisi = sdm.posisi || '-';
        data.divisi = sdm.divisi || '-';
      } else {
        data.nama = (data.employee && data.employee.nama) || data.nama || '-';
        data.posisi = data.posisi || '-';
        data.divisi = data.divisi || '-';
      }
    } else {
      data.nama = (data.employee && data.employee.nama) || data.nama || '-';
      data.posisi = data.posisi || '-';
      data.divisi = data.divisi || '-';
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tim biru by ID for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== OWNER STATS ROUTES =====

// Get summary statistics (owner only - read only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const [timMerahCount, timBiruCount] = await Promise.all([
      TimMerah.count(),
      TimBiru.count()
    ]);

    // Get status breakdown for tim merah
    const statusBreakdown = await TimMerah.findAll({
      attributes: [
        'status',
        [TimMerah.sequelize.fn('COUNT', TimMerah.sequelize.col('status')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get recent entries (last 30 days for owner overview)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);

    const [recentMerah, recentBiru] = await Promise.all([
      TimMerah.count({
        where: {
          created_at: {
            [require('sequelize').Op.gte]: recentDate
          }
        }
      }),
      TimBiru.count({
        where: {
          created_at: {
            [require('sequelize').Op.gte]: recentDate
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
    console.error('Error fetching stats for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
