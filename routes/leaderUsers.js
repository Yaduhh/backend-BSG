const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { User, LeaderDivisi, SdmData, SdmJabatan, SdmDivisi } = require('../models')

// GET /api/leader/users - Get all users for leader (excluding owner)
router.get('/', authenticateToken, async (req, res) => {
  // Check if user is leader
  if (req.user.role !== 'leader') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya leader yang diizinkan.'
    });
  }
  try {
    const leaderId = req.user.id

    // 1. Ambil divisi-divisi yang dipimpin leader
    const leaderDivisi = await LeaderDivisi.findAll({
      where: {
        id_user: leaderId,
        status_aktif: true
      },
      include: [{
        model: SdmDivisi,
        as: 'divisi',
        where: {
          status_aktif: true,
          status_deleted: false
        },
        attributes: ['id', 'nama_divisi']
      }]
    })

    if (leaderDivisi.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Leader tidak memiliki divisi yang dipimpin'
      })
    }

    const divisiIds = leaderDivisi.map(ld => ld.id_divisi)

    // 2. Ambil user yang memiliki jabatan di divisi-divisi tersebut
    const users = await User.findAll({
      where: {
        role: {
          [require('sequelize').Op.ne]: 'owner' // Exclude owner role
        },
        status_deleted: false
      },
      include: [{
        model: SdmData,
        as: 'sdmDataUser',
        where: {
          status_deleted: false
        },
        required: true, // INNER JOIN - hanya user yang punya data SDM
        include: [{
          model: SdmJabatan,
          as: 'jabatan',
          where: {
            divisi_id: {
              [require('sequelize').Op.in]: divisiIds
            },
            status_aktif: true
          },
          required: true, // INNER JOIN - hanya jabatan di divisi leader
          include: [{
            model: SdmDivisi,
            as: 'divisi',
            attributes: ['id', 'nama_divisi']
          }]
        }]
      }],
      attributes: ['id', 'username', 'nama', 'role'],
      order: [['nama', 'ASC']]
    })

    // 3. Format response dengan informasi divisi
    const formattedUsers = users.map(user => {
      const sdmData = user.sdmDataUser?.[0]
      const jabatan = sdmData?.jabatan
      const divisi = jabatan?.divisi

      return {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        divisi: divisi ? {
          id: divisi.id,
          nama: divisi.nama_divisi
        } : null,
        jabatan: jabatan ? {
          id: jabatan.id,
          nama: jabatan.nama_jabatan
        } : null
      }
    })

    return res.json({
      success: true,
      data: formattedUsers,
      message: 'Users retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching users for leader:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
})

module.exports = router
