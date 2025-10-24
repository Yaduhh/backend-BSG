const express = require('express');
const router = express.Router();
const { User, Notification, UserNotification } = require('../models');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /admin/notifications - Get all notifications for admin
router.get('/notifications', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', priority = 'all' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (status !== 'all') {
      whereClause.status = status;
    }
    
    if (priority !== 'all') {
      whereClause.priority = priority;
    }

    // Get notifications with user notification status
    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'nama', 'username', 'role']
        },
        {
          model: UserNotification,
          as: 'userNotifications',
          where: { user_id: req.user.id },
          required: false,
          attributes: ['is_read', 'read_at']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get unread count
    const unreadCount = await UserNotification.count({
      where: {
        user_id: req.user.id,
        is_read: false
      },
      include: [
        {
          model: Notification,
          as: 'notification',
          where: {
            status: 'sent'
          }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Notifikasi berhasil diambil',
      data: {
        notifications: notifications.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(notifications.count / limit),
          totalItems: notifications.count,
          itemsPerPage: parseInt(limit)
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil notifikasi',
      error: error.message
    });
  }
});

// GET /admin/notifications/unread-count - Get unread notification count
router.get('/notifications/unread-count', authenticateAdmin, async (req, res) => {
  try {
    const unreadCount = await UserNotification.count({
      where: {
        user_id: req.user.id,
        is_read: false
      },
      include: [
        {
          model: Notification,
          as: 'notification',
          where: {
            status: 'sent'
          }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Unread count berhasil diambil',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil unread count',
      error: error.message
    });
  }
});

// PUT /admin/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Update user notification as read
    const [updatedRows] = await UserNotification.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          notification_id: id,
          user_id: req.user.id
        }
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan atau sudah dibaca'
      });
    }

    res.json({
      success: true,
      message: 'Notifikasi berhasil ditandai sebagai dibaca'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menandai notifikasi',
      error: error.message
    });
  }
});

// PUT /admin/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', authenticateAdmin, async (req, res) => {
  try {
    // Update all user notifications as read
    await UserNotification.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          user_id: req.user.id,
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      message: 'Semua notifikasi berhasil ditandai sebagai dibaca'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menandai semua notifikasi',
      error: error.message
    });
  }
});

// GET /admin/notifications/:id - Get specific notification details
router.get('/notifications/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'nama', 'username', 'role']
        },
        {
          model: UserNotification,
          as: 'userNotifications',
          where: { user_id: req.user.id },
          required: false,
          attributes: ['is_read', 'read_at']
        }
      ]
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Detail notifikasi berhasil diambil',
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification details:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail notifikasi',
      error: error.message
    });
  }
});

module.exports = router;
