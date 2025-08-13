const express = require('express');
const router = express.Router();
const { ChatGroup, ChatGroupMember, User, Message } = require('../models');
const { Op } = require('../config/database');
const { sendChatNotification } = require('../services/notificationService');

// Create new group
router.post('/create', async (req, res) => {
  try {
    const { group_name, group_description, member_ids, created_by } = req.body;

    if (!group_name || !member_ids || !created_by) {
      return res.status(400).json({
        success: false,
        message: 'group_name, member_ids, dan created_by diperlukan'
      });
    }

    // Generate unique group_id
    const timestamp = Date.now();
    const group_id = `group_${timestamp}_${created_by}`;

    // Create group
    const chatGroup = await ChatGroup.create({
      group_id,
      group_name,
      group_description,
      created_by
    });

    // Add creator as admin
    await ChatGroupMember.create({
      group_id,
      user_id: created_by,
      role: 'admin'
    });

    // Add other members
    const memberPromises = member_ids.map(user_id =>
      ChatGroupMember.create({
        group_id,
        user_id,
        role: 'member'
      })
    );

    await Promise.all(memberPromises);

    // Get group with members
    const groupWithMembers = await ChatGroup.findOne({
      where: { group_id },
      include: [{
        model: ChatGroupMember,
        include: [{
          model: User,
          as: 'member',
          attributes: ['id', 'nama', 'username']
        }]
      }]
    });

    res.json({
      success: true,
      data: groupWithMembers,
      message: 'Group berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat group'
    });
  }
});

// Get user's groups
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userGroups = await ChatGroupMember.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      include: [{
        model: ChatGroup,
        where: { is_active: true },
        include: [{
          model: ChatGroupMember,
          include: [{
            model: User,
            as: 'member',
            attributes: ['id', 'nama', 'username']
          }]
        }]
      }]
    });

    res.json({
      success: true,
      data: userGroups
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil group'
    });
  }
});

// Get user's groups with formatted data for frontend
router.get('/user-groups/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's groups with last message info
    const userGroups = await ChatGroupMember.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      include: [{
        model: ChatGroup,
        where: { is_active: true },
        include: [{
          model: ChatGroupMember,
          include: [{
            model: User,
            as: 'member',
            attributes: ['id', 'nama', 'username']
          }]
        }]
      }]
    });

    // Format data for frontend and get last message for each group
    const formattedGroups = await Promise.all(userGroups.map(async (member) => {
      const group = member.ChatGroup;

      // Get last message for this group
      const lastMessage = await Message.findOne({
        where: {
          room_id: group.group_id,
          is_group_message: true,
          status_deleted: false
        },
        order: [['created_at', 'DESC']],
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'nama', 'username']
        }]
      });

      return {
        group_id: group.group_id,
        group_name: group.group_name,
        group_description: group.group_description,
        created_by: group.created_by,
        created_at: group.created_at,
        last_message: lastMessage ? lastMessage.message : null,
        last_message_time: lastMessage ? lastMessage.created_at : null,
        unread_count: 0, // TODO: Implement unread count logic
        members: group.ChatGroupMembers.map(m => ({
          id: m.member.id,
          nama: m.member.nama,
          username: m.member.username,
          role: m.role
        }))
      };
    }));

    res.json({
      success: true,
      data: formattedGroups
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil group'
    });
  }
});

// Get group details
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await ChatGroup.findOne({
      where: {
        group_id: groupId,
        is_active: true
      },
      include: [{
        model: ChatGroupMember,
        where: { is_active: true },
        include: [{
          model: User,
          as: 'member',
          attributes: ['id', 'nama', 'username']
        }]
      }]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail group'
    });
  }
});

// Add member to group
router.post('/:groupId/add-member', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { user_id, added_by } = req.body;

    if (!user_id || !added_by) {
      return res.status(400).json({
        success: false,
        message: 'user_id dan added_by diperlukan'
      });
    }

    // Check if user is admin
    const adminCheck = await ChatGroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: added_by,
        role: 'admin',
        is_active: true
      }
    });

    if (!adminCheck) {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang bisa menambah anggota'
      });
    }

    // Check if user already in group
    const existingMember = await ChatGroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: user_id,
        is_active: true
      }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User sudah ada di group ini'
      });
    }

    // Add member
    await ChatGroupMember.create({
      group_id: groupId,
      user_id,
      role: 'member'
    });

    res.json({
      success: true,
      message: 'Anggota berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambah anggota'
    });
  }
});

// Remove member from group
router.delete('/:groupId/remove-member/:userId', async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { removed_by } = req.body;

    if (!removed_by) {
      return res.status(400).json({
        success: false,
        message: 'removed_by diperlukan'
      });
    }

    // Check if user is admin
    const adminCheck = await ChatGroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: removed_by,
        role: 'admin',
        is_active: true
      }
    });

    if (!adminCheck) {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang bisa menghapus anggota'
      });
    }

    // Remove member
    await ChatGroupMember.update(
      { is_active: false },
      {
        where: {
          group_id: groupId,
          user_id: userId
        }
      }
    );

    res.json({
      success: true,
      message: 'Anggota berhasil dihapus'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus anggota'
    });
  }
});

// Send message to group
router.post('/:groupId/message', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { sender_id, message, message_type = 'text' } = req.body;

    if (!sender_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'sender_id dan message diperlukan'
      });
    }

    // Check if sender is member of group
    const memberCheck = await ChatGroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: sender_id,
        is_active: true
      }
    });

    if (!memberCheck) {
      return res.status(403).json({
        success: false,
        message: 'Anda bukan anggota group ini'
      });
    }

    // Create message
    const newMessage = await Message.create({
      room_id: groupId,
      sender_id,
      message,
      message_type,
      is_group_message: true
    });

    // Get group info and members for notification
    const groupInfo = await ChatGroup.findOne({
      where: { group_id: groupId }
    });

    // Check if group exists
    if (!groupInfo) {
      console.error('❌ Group not found for group_id:', groupId);
      return res.status(404).json({
        success: false,
        message: 'Group tidak ditemukan'
      });
    }

    const groupMembers = await ChatGroupMember.findAll({
      where: {
        group_id: groupId,
        user_id: { [Op.ne]: sender_id }, // Exclude sender
        is_active: true
      }
    });

    // Get sender info for notification
    const sender = await User.findByPk(sender_id);

    // Check if sender exists
    if (!sender) {
      console.error('❌ Sender not found for id:', sender_id);
      return res.status(404).json({
        success: false,
        message: 'Pengirim tidak ditemukan'
      });
    }

    // Get wsService instance from app
    const wsService = req.app.get('wsService');

    // Send WebSocket message for real-time updates to all group members
    if (wsService) {
      try {
        // Broadcast to all group members (including sender for consistency)
        const roomName = `group_${groupId}`;

        // Broadcast the message to the group room
        const broadcastResult = wsService.broadcastToRoom(roomName, {
          type: 'new_group_message',
          data: {
            id: newMessage.id, // TAMBAH: Include message ID from database
            groupId: groupId,
            groupName: groupInfo.group_name,
            message: message,
            sender_id: sender_id,
            sender_name: sender.nama,
            message_type: message_type,
            timestamp: newMessage.created_at // TAMBAH: Use actual timestamp from database
          }
        });

        console.log('📡 Backend: Broadcast result - sent to', broadcastResult, 'users');
      } catch (wsError) {
        console.error('WebSocket broadcast error for group:', wsError);
      }
    }

    // Send notifications to all members
    for (const member of groupMembers) {
      try {
        // Send push notification
        await sendChatNotification(
          sender_id,
          member.user_id,
          message,
          `${sender.nama} (${groupInfo.group_name})`,
          wsService
        );

        // HAPUS: Jangan kirim WebSocket notification lagi karena sudah dihandle oleh broadcastToRoom
        // Ini yang menyebabkan duplikasi pesan!
        // if (wsService) {
        //   try {
        //     const notificationData = {
        //       type: 'group_message',
        //       group_id: groupId,
        //       group_name: groupInfo.group_name,
        //       sender_id: sender_id,
        //       sender_name: sender.nama,
        //       message: message,
        //       title: `Pesan baru di ${groupInfo.group_name}`,
        //       body: message.length > 50 ? message.substring(0, 50) + '...' : message,
        //       timestamp: new Date()
        //     };
        //     
        //     wsService.sendNotificationToUser(member.user_id, notificationData);
        //   } catch (wsError) {
        //     console.error('WebSocket notification error for group member:', wsError);
        //   }
        // }
      } catch (notificationError) {
        console.error(`Error sending notification to member ${member.user_id}:`, notificationError);
      }
    }

    res.json({
      success: true,
      data: newMessage,
      message: 'Pesan berhasil dikirim'
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim pesan'
    });
  }
});

// Get group messages
router.get('/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    const messages = await Message.findAndCountAll({
      where: {
        room_id: groupId,
        is_group_message: true,
        status_deleted: false
      },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'nama', 'username']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows,
        total: messages.count,
        page: parseInt(page),
        totalPages: Math.ceil(messages.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil pesan group'
    });
  }
});

module.exports = router;
