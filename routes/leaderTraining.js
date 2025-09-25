const express = require('express');
const router = express.Router();
const { User, SdmData, SdmJabatan, SdmDivisi, LeaderDivisi } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// Util: build division where clause based on leader's division
function buildDivisionFilterFromLeader(leader) {
  return {};
}

// Get users with training data for leader's division (read-only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ success: false, message: 'Access denied. Leader only.' });
    }

    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    // Find division ids managed by leader
    const leaderDivisis = await LeaderDivisi.findAll({
      where: { id_user: req.user.id, status_aktif: true },
      attributes: ['id_divisi']
    });
    const divisionIds = leaderDivisis.map(ld => ld.id_divisi);

    if (divisionIds.length === 0) {
      return res.json({ success: true, data: [], pagination: { currentPage: parseInt(page), totalPages: 0, totalItems: 0, itemsPerPage: parseInt(limit) }, stats: { totalUsers: 0, trainingDasarCompleted: 0, trainingLeadershipCompleted: 0, trainingSkillCompleted: 0, trainingLanjutanCompleted: 0, trainingDasarPercentage: 0, trainingLeadershipPercentage: 0, trainingSkillPercentage: 0, trainingLanjutanPercentage: 0, allTrainingsCompletedPercentage: 0 } });
    }

    // Build search filter for included user
    const userWhere = {
      status_deleted: false,
      role: { [Op.ne]: 'owner' },
    };
    if (search && String(search).trim()) {
      const searchTerm = `%${String(search).trim()}%`;
      userWhere[Op.or] = [
        { nama: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } }
      ];
    }

    // Query SdmData within leader's divisions, include User
    const sdmRows = await SdmData.findAndCountAll({
      where: { status_deleted: false },
      include: [
        {
          model: SdmJabatan,
          as: 'jabatan',
          required: true,
          where: { divisi_id: { [Op.in]: divisionIds } },
          attributes: ['id', 'nama_jabatan', 'divisi_id'],
          include: [{ model: SdmDivisi, as: 'divisi', attributes: ['id', 'nama_divisi'], required: false }]
        },
        {
          model: User,
          as: 'user',
          required: true,
          where: userWhere,
          attributes: ['id', 'nama', 'email', 'role', 'training_dasar', 'training_leadership', 'training_skill', 'training_lanjutan', 'created_at', 'updated_at']
        }
      ],
      order: [[{ model: User, as: 'user' }, 'nama', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Map to user-shaped objects plus jabatan/divisi info
    const mappedUsers = sdmRows.rows.map(row => {
      const u = row.user;
      return {
        id: u.id,
        nama: u.nama,
        email: u.email,
        role: u.role,
        training_dasar: u.training_dasar,
        training_leadership: u.training_leadership,
        training_skill: u.training_skill,
        training_lanjutan: u.training_lanjutan,
        jabatan: row.jabatan ? { id: row.jabatan.id, nama_jabatan: row.jabatan.nama_jabatan } : null,
        jabatan_id: row.jabatan?.id || null,
        divisi_id: row.jabatan?.divisi_id || null,
        divisi: row.jabatan?.divisi ? { id: row.jabatan.divisi.id, nama_divisi: row.jabatan.divisi.nama_divisi } : null,
        created_at: u.created_at,
        updated_at: u.updated_at,
      };
    });

    // Stats based on all rows that match filter (without pagination)
    const allSdmForStats = await SdmData.findAll({
      where: { status_deleted: false },
      include: [
        { model: SdmJabatan, as: 'jabatan', required: true, where: { divisi_id: { [Op.in]: divisionIds } }, attributes: [] },
        { model: User, as: 'user', required: true, where: userWhere, attributes: ['id', 'training_dasar', 'training_leadership', 'training_skill', 'training_lanjutan'] }
      ]
    });

    const totalUsers = allSdmForStats.length;
    const trainingStats = {
      totalUsers,
      trainingDasarCompleted: allSdmForStats.filter(r => r.user?.training_dasar).length,
      trainingLeadershipCompleted: allSdmForStats.filter(r => r.user?.training_leadership).length,
      trainingSkillCompleted: allSdmForStats.filter(r => r.user?.training_skill).length,
      trainingLanjutanCompleted: allSdmForStats.filter(r => r.user?.training_lanjutan).length,
    };

    trainingStats.trainingDasarPercentage = totalUsers > 0 ? Math.round((trainingStats.trainingDasarCompleted / totalUsers) * 100) : 0;
    trainingStats.trainingLeadershipPercentage = totalUsers > 0 ? Math.round((trainingStats.trainingLeadershipCompleted / totalUsers) * 100) : 0;
    trainingStats.trainingSkillPercentage = totalUsers > 0 ? Math.round((trainingStats.trainingSkillCompleted / totalUsers) * 100) : 0;
    trainingStats.trainingLanjutanPercentage = totalUsers > 0 ? Math.round((trainingStats.trainingLanjutanCompleted / totalUsers) * 100) : 0;

    const allTrainingsCompleted = allSdmForStats.filter(r => r.user?.training_dasar && r.user?.training_leadership && r.user?.training_skill && r.user?.training_lanjutan).length;
    trainingStats.allTrainingsCompletedPercentage = totalUsers > 0 ? Math.round((allTrainingsCompleted / totalUsers) * 100) : 0;

    return res.json({
      success: true,
      data: mappedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(sdmRows.count / limit),
        totalItems: sdmRows.count,
        itemsPerPage: parseInt(limit),
      },
      stats: trainingStats,
    });
  } catch (error) {
    console.error('Error fetching users training data for leader:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Stats only for leader's division
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ success: false, message: 'Access denied. Leader only.' });
    }

    const divisionFilter = buildDivisionFilterFromLeader(req.user);

    const users = await User.findAll({
      where: {
        status_deleted: false,
        role: { [Op.ne]: 'owner' },
        ...divisionFilter,
      },
      attributes: [ 'id', 'training_dasar', 'training_leadership', 'training_skill', 'training_lanjutan' ],
    });

    const totalUsers = users.length;
    const stats = {
      totalUsers,
      trainingDasarCompleted: users.filter(u => u.training_dasar).length,
      trainingLeadershipCompleted: users.filter(u => u.training_leadership).length,
      trainingSkillCompleted: users.filter(u => u.training_skill).length,
      trainingLanjutanCompleted: users.filter(u => u.training_lanjutan).length,
    };

    stats.trainingDasarPercentage = totalUsers > 0 ? Math.round((stats.trainingDasarCompleted / totalUsers) * 100) : 0;
    stats.trainingLeadershipPercentage = totalUsers > 0 ? Math.round((stats.trainingLeadershipCompleted / totalUsers) * 100) : 0;
    stats.trainingSkillPercentage = totalUsers > 0 ? Math.round((stats.trainingSkillCompleted / totalUsers) * 100) : 0;
    stats.trainingLanjutanPercentage = totalUsers > 0 ? Math.round((stats.trainingLanjutanCompleted / totalUsers) * 100) : 0;

    const allTrainingsCompleted = users.filter(u => u.training_dasar && u.training_leadership && u.training_skill && u.training_lanjutan).length;
    stats.allTrainingsCompletedPercentage = totalUsers > 0 ? Math.round((allTrainingsCompleted / totalUsers) * 100) : 0;

    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching training stats for leader:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;


