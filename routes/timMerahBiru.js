const express = require('express');
const router = express.Router();
const { TimMerah, TimBiru, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// ===== TIM MERAH ROUTES =====

// Get all tim merah (admin only)
router.get('/merah', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { page = 1, limit = 20, search, divisi, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { nama: { [Op.like]: searchTerm } },
        { divisi: { [Op.like]: searchTerm } },
        { posisi: { [Op.like]: searchTerm } }
      ];
    }

    if (divisi && divisi !== 'all') {
      whereClause.divisi = divisi;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const timMerah = await TimMerah.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: timMerah.rows,
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

// Get tim merah by ID
router.get('/merah/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
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
        }
      ]
    });

    if (!timMerah) {
      return res.status(404).json({
        success: false,
        message: 'Tim merah entry not found'
      });
    }

    res.json({
      success: true,
      data: timMerah
    });
  } catch (error) {
    console.error('Error fetching tim merah by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new tim merah entry
router.post('/merah', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { nama, divisi, posisi, status, keterangan } = req.body;

    // Validate required fields
    if (!nama || !divisi || !posisi || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: nama, divisi, posisi, status'
      });
    }

    // Validate status enum
    if (!['SP1', 'SP2', 'SP3'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be SP1, SP2, or SP3'
      });
    }

    const timMerah = await TimMerah.create({
      nama,
      divisi,
      posisi,
      status,
      keterangan: keterangan || '',
      created_by: req.user.id
    });

    const createdEntry = await TimMerah.findByPk(timMerah.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tim merah entry created successfully',
      data: createdEntry
    });
  } catch (error) {
    console.error('Error creating tim merah:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update tim merah entry
router.put('/merah/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const { nama, divisi, posisi, status, keterangan } = req.body;

    const timMerah = await TimMerah.findByPk(id);
    if (!timMerah) {
      return res.status(404).json({
        success: false,
        message: 'Tim merah entry not found'
      });
    }

    // Validate status enum if provided
    if (status && !['SP1', 'SP2', 'SP3'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be SP1, SP2, or SP3'
      });
    }

    await timMerah.update({
      nama: nama || timMerah.nama,
      divisi: divisi || timMerah.divisi,
      posisi: posisi || timMerah.posisi,
      status: status || timMerah.status,
      keterangan: keterangan !== undefined ? keterangan : timMerah.keterangan
    });

    const updatedEntry = await TimMerah.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Tim merah entry updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error updating tim merah:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete tim merah entry
router.delete('/merah/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const timMerah = await TimMerah.findByPk(id);

    if (!timMerah) {
      return res.status(404).json({
        success: false,
        message: 'Tim merah entry not found'
      });
    }

    await timMerah.destroy();

    res.json({
      success: true,
      message: 'Tim merah entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tim merah:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== TIM BIRU ROUTES =====

// Get all tim biru (admin only)
router.get('/biru', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
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
      whereClause[Op.or] = [
        { nama: { [Op.like]: searchTerm } },
        { divisi: { [Op.like]: searchTerm } },
        { posisi: { [Op.like]: searchTerm } },
        { prestasi: { [Op.like]: searchTerm } }
      ];
    }

    if (divisi && divisi !== 'all') {
      whereClause.divisi = divisi;
    }

    const timBiru = await TimBiru.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: timBiru.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(timBiru.count / limit),
        totalItems: timBiru.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tim biru:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get tim biru by ID
router.get('/biru/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const timBiru = await TimBiru.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
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

    res.json({
      success: true,
      data: timBiru
    });
  } catch (error) {
    console.error('Error fetching tim biru by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new tim biru entry
router.post('/biru', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { nama, divisi, posisi, prestasi, keterangan } = req.body;

    // Validate required fields
    if (!nama || !divisi || !posisi || !prestasi) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: nama, divisi, posisi, prestasi'
      });
    }

    const timBiru = await TimBiru.create({
      nama,
      divisi,
      posisi,
      prestasi,
      keterangan: keterangan || '',
      created_by: req.user.id
    });

    const createdEntry = await TimBiru.findByPk(timBiru.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tim biru entry created successfully',
      data: createdEntry
    });
  } catch (error) {
    console.error('Error creating tim biru:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update tim biru entry
router.put('/biru/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const { nama, divisi, posisi, prestasi, keterangan } = req.body;

    const timBiru = await TimBiru.findByPk(id);
    if (!timBiru) {
      return res.status(404).json({
        success: false,
        message: 'Tim biru entry not found'
      });
    }

    await timBiru.update({
      nama: nama || timBiru.nama,
      divisi: divisi || timBiru.divisi,
      posisi: posisi || timBiru.posisi,
      prestasi: prestasi || timBiru.prestasi,
      keterangan: keterangan !== undefined ? keterangan : timBiru.keterangan
    });

    const updatedEntry = await TimBiru.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Tim biru entry updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error updating tim biru:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete tim biru entry
router.delete('/biru/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const timBiru = await TimBiru.findByPk(id);

    if (!timBiru) {
      return res.status(404).json({
        success: false,
        message: 'Tim biru entry not found'
      });
    }

    await timBiru.destroy();

    res.json({
      success: true,
      message: 'Tim biru entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tim biru:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== COMBINED ROUTES =====

// Get summary statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
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
