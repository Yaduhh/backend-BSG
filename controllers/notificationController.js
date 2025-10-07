const { Op } = require('sequelize');
const { Notification, UserNotification, User } = require('../models');

// POST /api/notifications/send-to-all
exports.sendToAllUsers = async (req, res) => {
  try {
    const { title, message, description, priority = 'medium', category = 'general' } = req.body;
    const senderId = req.user.id;
    const senderName = req.user.nama;
    const senderRole = req.user.role;

    // Validasi input
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Judul dan pesan notifikasi wajib diisi'
      });
    }

    // Buat notification record
    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      description: description ? description.trim() : null,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      target_type: 'all_users',
      priority,
      category,
      status: 'sent',
      sent_at: new Date()
    });

    // Dapatkan semua user yang aktif
    const users = await User.findAll({
      where: {
        status: 'active',
        status_deleted: false
      },
      attributes: ['id']
    });

    // Buat user notification records
    const userNotifications = users.map(user => ({
      notification_id: notification.id,
      user_id: user.id,
      is_read: false,
      push_sent: false
    }));

    await UserNotification.bulkCreate(userNotifications);

    // Update sent_count
    await notification.update({
      sent_count: users.length
    });

    res.json({
      success: true,
      message: 'Notifikasi berhasil dikirim ke semua user',
      data: {
        notificationId: notification.id,
        sentCount: users.length,
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          description: notification.description,
          priority: notification.priority,
          category: notification.category,
          sentAt: notification.sent_at
        }
      }
    });

  } catch (error) {
    console.error('Error sending notification to all users:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim notifikasi'
    });
  }
};

// POST /api/notifications/send-to-users
exports.sendToUsers = async (req, res) => {
  try {
    const { userIds, title, message, description, priority = 'medium', category = 'general' } = req.body;
    const senderId = req.user.id;
    const senderName = req.user.nama;
    const senderRole = req.user.role;

    // Validasi input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs wajib diisi dan harus berupa array'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Judul dan pesan notifikasi wajib diisi'
      });
    }

    // Validasi user IDs
    const users = await User.findAll({
      where: {
        id: { [Op.in]: userIds },
        status: 'active',
        status_deleted: false
      },
      attributes: ['id']
    });

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada user yang valid ditemukan'
      });
    }

    // Buat notification record
    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      description: description ? description.trim() : null,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      target_type: 'specific_users',
      target_users: userIds,
      priority,
      category,
      status: 'sent',
      sent_at: new Date()
    });

    // Buat user notification records
    const userNotifications = users.map(user => ({
      notification_id: notification.id,
      user_id: user.id,
      is_read: false,
      push_sent: false
    }));

    await UserNotification.bulkCreate(userNotifications);

    // Update sent_count
    await notification.update({
      sent_count: users.length
    });

    res.json({
      success: true,
      message: `Notifikasi berhasil dikirim ke ${users.length} user`,
      data: {
        notificationId: notification.id,
        sentCount: users.length,
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          description: notification.description,
          priority: notification.priority,
          category: notification.category,
          sentAt: notification.sent_at
        }
      }
    });

  } catch (error) {
    console.error('Error sending notification to specific users:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim notifikasi'
    });
  }
};

// POST /api/notifications/send-to-role
exports.sendToRole = async (req, res) => {
  try {
    const { role, title, message, description, priority = 'medium', category = 'general' } = req.body;
    const senderId = req.user.id;
    const senderName = req.user.nama;
    const senderRole = req.user.role;

    // Validasi input
    if (!role || !['owner', 'admin', 'leader', 'divisi'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role harus berupa owner, admin, leader, atau divisi'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Judul dan pesan notifikasi wajib diisi'
      });
    }

    // Dapatkan user berdasarkan role
    const users = await User.findAll({
      where: {
        role: role,
        status: 'active',
        status_deleted: false
      },
      attributes: ['id']
    });

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak ada user dengan role ${role} yang ditemukan`
      });
    }

    // Buat notification record
    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      description: description ? description.trim() : null,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      target_type: 'role_based',
      target_role: role,
      priority,
      category,
      status: 'sent',
      sent_at: new Date()
    });

    // Buat user notification records
    const userNotifications = users.map(user => ({
      notification_id: notification.id,
      user_id: user.id,
      is_read: false,
      push_sent: false
    }));

    await UserNotification.bulkCreate(userNotifications);

    // Update sent_count
    await notification.update({
      sent_count: users.length
    });

    res.json({
      success: true,
      message: `Notifikasi berhasil dikirim ke ${users.length} user dengan role ${role}`,
      data: {
        notificationId: notification.id,
        sentCount: users.length,
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          description: notification.description,
          priority: notification.priority,
          category: notification.category,
          sentAt: notification.sent_at
        }
      }
    });

  } catch (error) {
    console.error('Error sending notification to role:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim notifikasi'
    });
  }
};

// GET /api/notifications/history
exports.getNotificationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, category } = req.query;
    const senderId = req.user.id;
    const role = req.user.role;

    const where = {};
    
    // Owner bisa lihat semua, selain owner hanya lihat yang dibuat sendiri
    if (role !== 'owner') {
      where.sender_id = senderId;
    }

    if (status && ['draft', 'sent', 'failed', 'cancelled'].includes(status)) {
      where.status = status;
    }

    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id', 'title', 'message', 'description', 'sender_name', 'sender_role',
        'target_type', 'target_role', 'priority', 'category', 'status',
        'sent_count', 'sent_at', 'created_at'
      ]
    });

    res.json({
      success: true,
      data: {
        notifications: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil riwayat notifikasi'
    });
  }
};

// GET /api/notifications/user/:userId
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, isRead } = req.query;
    const currentUserId = req.user.id;
    const role = req.user.role;

    // Validasi akses
    if (role !== 'owner' && parseInt(userId) !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melihat notifikasi user ini'
      });
    }

    const where = { user_id: userId };

    if (isRead !== undefined) {
      where.is_read = isRead === 'true';
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await UserNotification.findAndCountAll({
      where,
      include: [{
        model: Notification,
        as: 'notification',
        attributes: [
          'id', 'title', 'message', 'description', 'sender_name', 'sender_role',
          'priority', 'category', 'sent_at'
        ]
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notifications: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil notifikasi user'
    });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const userNotification = await UserNotification.findOne({
      where: {
        notification_id: id,
        user_id: userId
      }
    });

    if (!userNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan'
      });
    }

    await userNotification.update({
      is_read: true,
      read_at: new Date()
    });

    res.json({
      success: true,
      message: 'Notifikasi berhasil ditandai sebagai dibaca'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menandai notifikasi sebagai dibaca'
    });
  }
};

// PUT /api/notifications/user/:userId/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const role = req.user.role;

    // Validasi akses
    if (role !== 'owner' && parseInt(userId) !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk mengubah notifikasi user ini'
      });
    }

    const updatedCount = await UserNotification.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      message: `${updatedCount[0]} notifikasi berhasil ditandai sebagai dibaca`
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menandai semua notifikasi sebagai dibaca'
    });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan'
      });
    }

    // Validasi akses - hanya owner atau pembuat notifikasi yang bisa hapus
    if (role !== 'owner' && notification.sender_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus notifikasi ini'
      });
    }

    // Hapus user notifications terlebih dahulu
    await UserNotification.destroy({
      where: { notification_id: id }
    });

    // Hapus notification
    await notification.destroy();

    res.json({
      success: true,
      message: 'Notifikasi berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus notifikasi'
    });
  }
};

// GET /api/notifications/stats
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let where = {};
    
    // Owner bisa lihat semua, selain owner hanya lihat yang dibuat sendiri
    if (role !== 'owner') {
      where.sender_id = userId;
    }

    const totalNotifications = await Notification.count({ where });
    const sentNotifications = await Notification.count({ 
      where: { ...where, status: 'sent' } 
    });
    const draftNotifications = await Notification.count({ 
      where: { ...where, status: 'draft' } 
    });

    // Stats untuk user notifications
    const userNotificationStats = await UserNotification.findAll({
      where: { user_id: userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_read = true THEN 1 END')), 'read'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_read = false THEN 1 END')), 'unread']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        sentNotifications: {
          total: totalNotifications,
          sent: sentNotifications,
          draft: draftNotifications
        },
        userNotifications: userNotificationStats[0] || {
          total: 0,
          read: 0,
          unread: 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik notifikasi'
    });
  }
};
