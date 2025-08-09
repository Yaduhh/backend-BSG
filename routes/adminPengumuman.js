const express = require('express');
const router = express.Router();
const { Pengumuman, User } = require('../models');
const { Op, sequelize } = require('sequelize');
const { sequelize: dbSequelize } = require('../config/database');

// Get active pengumuman untuk admin dashboard
router.get('/active', async (req, res) => {
  try {
    console.log('Admin fetching active pengumuman');

    // Ambil pengumuman yang aktif dan masih berlaku
    const currentDate = new Date();
    
    const pengumuman = await Pengumuman.findAll({
      where: {
        status: 'aktif',
        tanggal_berlaku_dari: {
          [Op.lte]: currentDate
        },
        [Op.or]: [
          { tanggal_berlaku_sampai: null },
          { tanggal_berlaku_sampai: { [Op.gte]: currentDate } }
        ]
      },
      include: [
        {
          model: User,
          as: 'penulis',
          attributes: ['id', 'nama', 'email']
        }
      ],
      order: [
        ['prioritas', 'ASC'], // tinggi, sedang, rendah
        ['created_at', 'DESC']
      ],
      limit: 10 // Limit untuk performance
    });

    // Format response untuk admin
    const formattedPengumuman = pengumuman.map(item => {
      const data = item.toJSON();
      return {
        id: data.id,
        judul: data.judul,
        konten: data.konten,
        prioritas: data.prioritas,
        tanggal_berlaku_dari: data.tanggal_berlaku_dari,
        tanggal_berlaku_sampai: data.tanggal_berlaku_sampai,
        penulis_nama: data.penulis?.nama || 'Admin',
        created_at: data.created_at
      };
    });

    res.json({
      success: true,
      data: formattedPengumuman,
      count: formattedPengumuman.length
    });

  } catch (error) {
    console.error('Error fetching active pengumuman for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pengumuman summary stats untuk admin
router.get('/stats', async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Count active pengumuman
    const activeCount = await Pengumuman.count({
      where: {
        status: 'aktif',
        tanggal_berlaku_dari: {
          [Op.lte]: currentDate
        },
        [Op.or]: [
          { tanggal_berlaku_sampai: null },
          { tanggal_berlaku_sampai: { [Op.gte]: currentDate } }
        ]
      }
    });

    // Count total pengumuman
    const totalCount = await Pengumuman.count();

    // Count by priority
    const priorityStats = await Pengumuman.findAll({
      where: {
        status: 'aktif',
        tanggal_berlaku_dari: {
          [Op.lte]: currentDate
        },
        [Op.or]: [
          { tanggal_berlaku_sampai: null },
          { tanggal_berlaku_sampai: { [Op.gte]: currentDate } }
        ]
      },
      attributes: [
        'prioritas',
        [dbSequelize.fn('COUNT', dbSequelize.col('id')), 'count']
      ],
      group: ['prioritas'],
      raw: true
    });

    // Format priority stats
    const priorityData = {
      tinggi: 0,
      sedang: 0,
      rendah: 0
    };

    priorityStats.forEach(stat => {
      priorityData[stat.prioritas] = parseInt(stat.count);
    });

    res.json({
      success: true,
      data: {
        active_count: activeCount,
        total_count: totalCount,
        priority_stats: priorityData
      }
    });

  } catch (error) {
    console.error('Error fetching pengumuman stats for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
