const express = require('express');
const router = express.Router();
const { TimMerah, TimBiru, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

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
