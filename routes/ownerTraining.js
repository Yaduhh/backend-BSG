const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get all users with training data (owner only - read only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const { page = 1, limit = 50, search, role } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      status_deleted: false,
      role: {
        [require('sequelize').Op.ne]: 'owner' // Exclude owner role
      }
    };

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[require('sequelize').Op.or] = [
        { nama: { [require('sequelize').Op.like]: searchTerm } },
        { email: { [require('sequelize').Op.like]: searchTerm } },
        { role: { [require('sequelize').Op.like]: searchTerm } }
      ];
    }

    // Add role filter if provided
    if (role && role !== 'all') {
      whereClause.role = role;
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'nama',
        'email',
        'role',
        'training_dasar',
        'training_leadership',
        'training_skill',
        'training_lanjutan',
        'created_at',
        'updated_at'
      ],
      order: [['nama', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get users for statistics with SAME filter as display data
    const statsWhereClause = {
      status_deleted: false,
      role: {
        [require('sequelize').Op.ne]: 'owner' // Exclude owner role
      }
    };

    // Apply same search filter for stats if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      statsWhereClause[require('sequelize').Op.or] = [
        { nama: { [require('sequelize').Op.like]: searchTerm } },
        { email: { [require('sequelize').Op.like]: searchTerm } },
        { role: { [require('sequelize').Op.like]: searchTerm } }
      ];
    }

    // Apply same role filter for stats if provided
    if (role && role !== 'all') {
      statsWhereClause.role = role;
    }

    const allUsersForStats = await User.findAll({
      where: statsWhereClause,
      attributes: [
        'id',
        'nama',
        'training_dasar',
        'training_leadership',
        'training_skill',
        'training_lanjutan'
      ]
    });



    // Calculate training statistics based on ALL users (not filtered results)
    const trainingDasarCompleted = allUsersForStats.filter(user => user.training_dasar).length;
    const trainingLeadershipCompleted = allUsersForStats.filter(user => user.training_leadership).length;
    const trainingSkillCompleted = allUsersForStats.filter(user => user.training_skill).length;
    const trainingLanjutanCompleted = allUsersForStats.filter(user => user.training_lanjutan).length;



    const trainingStats = {
      totalUsers: allUsersForStats.length,
      trainingDasarCompleted,
      trainingLeadershipCompleted,
      trainingSkillCompleted,
      trainingLanjutanCompleted,
    };

    // Calculate completion percentage for each training type
    trainingStats.trainingDasarPercentage = trainingStats.totalUsers > 0 
      ? Math.round((trainingStats.trainingDasarCompleted / trainingStats.totalUsers) * 100) 
      : 0;
    trainingStats.trainingLeadershipPercentage = trainingStats.totalUsers > 0 
      ? Math.round((trainingStats.trainingLeadershipCompleted / trainingStats.totalUsers) * 100) 
      : 0;
    trainingStats.trainingSkillPercentage = trainingStats.totalUsers > 0 
      ? Math.round((trainingStats.trainingSkillCompleted / trainingStats.totalUsers) * 100) 
      : 0;
    trainingStats.trainingLanjutanPercentage = trainingStats.totalUsers > 0 
      ? Math.round((trainingStats.trainingLanjutanCompleted / trainingStats.totalUsers) * 100) 
      : 0;

    // Calculate overall completion (users who completed all trainings)
    const allTrainingsCompleted = allUsersForStats.filter(user => 
      user.training_dasar && 
      user.training_leadership && 
      user.training_skill && 
      user.training_lanjutan
    ).length;
    
    trainingStats.allTrainingsCompletedPercentage = trainingStats.totalUsers > 0 
      ? Math.round((allTrainingsCompleted / trainingStats.totalUsers) * 100) 
      : 0;



    res.json({
      success: true,
      data: users.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(users.count / limit),
        totalItems: users.count,
        itemsPerPage: parseInt(limit)
      },
      stats: trainingStats
    });
  } catch (error) {
    console.error('Error fetching users training data for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get training statistics only
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const users = await User.findAll({
      where: {
        status_deleted: false,
        role: {
          [require('sequelize').Op.ne]: 'owner' // Exclude owner role
        }
      },
      attributes: [
        'id',
        'training_dasar',
        'training_leadership',
        'training_skill',
        'training_lanjutan',
        'role'
      ]
    });

    const totalUsers = users.length;
    
    // Calculate training completion stats
    const stats = {
      totalUsers,
      trainingDasarCompleted: users.filter(user => user.training_dasar).length,
      trainingLeadershipCompleted: users.filter(user => user.training_leadership).length,
      trainingSkillCompleted: users.filter(user => user.training_skill).length,
      trainingLanjutanCompleted: users.filter(user => user.training_lanjutan).length,
    };

    // Calculate percentages
    stats.trainingDasarPercentage = totalUsers > 0 
      ? Math.round((stats.trainingDasarCompleted / totalUsers) * 100) 
      : 0;
    stats.trainingLeadershipPercentage = totalUsers > 0 
      ? Math.round((stats.trainingLeadershipCompleted / totalUsers) * 100) 
      : 0;
    stats.trainingSkillPercentage = totalUsers > 0 
      ? Math.round((stats.trainingSkillCompleted / totalUsers) * 100) 
      : 0;
    stats.trainingLanjutanPercentage = totalUsers > 0 
      ? Math.round((stats.trainingLanjutanCompleted / totalUsers) * 100) 
      : 0;

    // Calculate overall completion
    const allTrainingsCompleted = users.filter(user => 
      user.training_dasar && 
      user.training_leadership && 
      user.training_skill && 
      user.training_lanjutan
    ).length;
    
    stats.allTrainingsCompletedPercentage = totalUsers > 0 
      ? Math.round((allTrainingsCompleted / totalUsers) * 100) 
      : 0;

    // Role breakdown
    const roleBreakdown = {};
    users.forEach(user => {
      if (!roleBreakdown[user.role]) {
        roleBreakdown[user.role] = {
          total: 0,
          trainingDasar: 0,
          trainingLeadership: 0,
          trainingSkill: 0,
          trainingLanjutan: 0,
          allCompleted: 0
        };
      }
      
      roleBreakdown[user.role].total++;
      if (user.training_dasar) roleBreakdown[user.role].trainingDasar++;
      if (user.training_leadership) roleBreakdown[user.role].trainingLeadership++;
      if (user.training_skill) roleBreakdown[user.role].trainingSkill++;
      if (user.training_lanjutan) roleBreakdown[user.role].trainingLanjutan++;
      if (user.training_dasar && user.training_leadership && user.training_skill && user.training_lanjutan) {
        roleBreakdown[user.role].allCompleted++;
      }
    });

    stats.roleBreakdown = roleBreakdown;

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching training stats for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user training detail by ID
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const { id } = req.params;
    const user = await User.findOne({
      where: {
        id: id,
        status_deleted: false,
        role: {
          [require('sequelize').Op.ne]: 'owner' // Exclude owner role
        }
      },
      attributes: [
        'id',
        'nama',
        'email',
        'role',
        'training_dasar',
        'training_leadership',
        'training_skill',
        'training_lanjutan',
        'created_at',
        'updated_at'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user training detail for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
