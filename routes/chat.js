const express = require('express');
const router = express.Router();
const { ChatRoom, Message, User } = require('../models');
const { Op } = require('../config/database');
const { sendChatNotification } = require('../services/notificationService');

// Get all chat contacts (users with status_deleted = 0, excluding current user)
router.get('/contacts', async (req, res) => {
  try {
    const currentUserId = req.query.current_user_id; // Get from query parameter
    
    if (!currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'current_user_id diperlukan'
      });
    }

    // Get existing chat rooms for current user
    const existingChatRooms = await ChatRoom.findAll({
      where: {
        [Op.or]: [
          { user1_id: currentUserId },
          { user2_id: currentUserId }
        ],
        status_deleted: 0
      },
      attributes: ['user1_id', 'user2_id']
    });

    // Get user IDs that already have chat rooms
    const existingUserIds = existingChatRooms.map(room => 
      room.user1_id === currentUserId ? room.user2_id : room.user1_id
    );

    const users = await User.findAll({
      where: {
        status_deleted: 0,
        id: {
          [Op.ne]: currentUserId, // Exclude current user
          [Op.notIn]: existingUserIds // Exclude users with existing chat rooms
        }
      },
      attributes: ['id', 'nama', 'username', 'email', 'role'],
      order: [['nama', 'ASC']]
    });

    // Get chat rooms for current user to include last_message
    const chatRooms = await ChatRoom.findAll({
      where: {
        [Op.or]: [
          { user1_id: currentUserId },
          { user2_id: currentUserId }
        ],
        status_deleted: 0
      },
      attributes: ['user1_id', 'user2_id', 'last_message', 'last_message_time'],
      order: [['last_message_time', 'DESC']]
    });

    // Create a map of user_id to last_message
    const lastMessageMap = {};
    chatRooms.forEach(room => {
      const otherUserId = room.user1_id == currentUserId ? room.user2_id : room.user1_id;
      if (!lastMessageMap[otherUserId] || room.last_message_time > lastMessageMap[otherUserId].last_message_time) {
        lastMessageMap[otherUserId] = {
          last_message: room.last_message,
          last_message_time: room.last_message_time
        };
      }
    });

    // Add last_message info to users
    const usersWithLastMessage = users.map(user => ({
      ...user.toJSON(),
      last_message: lastMessageMap[user.id]?.last_message || null,
      last_message_time: lastMessageMap[user.id]?.last_message_time || null
    }));

    res.json({
      success: true,
      data: usersWithLastMessage
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar kontak'
    });
  }
});

// Get or create chat room between two users
router.post('/room', async (req, res) => {
  try {
    const { user1_id, user2_id } = req.body;

    if (!user1_id || !user2_id) {
      return res.status(400).json({
        success: false,
        message: 'user1_id dan user2_id diperlukan'
      });
    }

    // Create unique room_id (smaller user_id first)
    const room_id = [user1_id, user2_id].sort().join('_');

    // Check if room already exists
    let chatRoom = await ChatRoom.findOne({
      where: { room_id }
    });

    if (!chatRoom) {
      // Create new chat room
      chatRoom = await ChatRoom.create({
        room_id,
        user1_id: Math.min(user1_id, user2_id),
        user2_id: Math.max(user1_id, user2_id),
        last_message: null,
        last_message_time: null,
        unread_count_user1: 0,
        unread_count_user2: 0
      });
    }

    res.json({
      success: true,
      data: chatRoom
    });
  } catch (error) {
    console.error('Error creating/finding chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat/mencari chat room'
    });
  }
});

// Get messages for a specific room
router.get('/messages/:room_id', async (req, res) => {
  try {
    const { room_id } = req.params;

    const messages = await Message.findAll({
      where: {
        room_id,
        status_deleted: 0
      },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'nama', 'username']
      }],
      order: [['created_at', 'DESC']] // Newest first, so latest messages are loaded first
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil pesan' });
  }
});

// Send a message
router.post('/message', async (req, res) => {
  try {
    const { room_id, sender_id, message, message_type = 'text' } = req.body;

    if (!room_id || !sender_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'room_id, sender_id, dan message diperlukan'
      });
    }

    // Check if chat room exists and restore if it was deleted
    let chatRoom = await ChatRoom.findOne({
      where: { room_id }
    });

    if (!chatRoom) {
      // Create new chat room if it doesn't exist
      const [user1_id, user2_id] = room_id.split('_').map(Number);
      chatRoom = await ChatRoom.create({
        room_id,
        user1_id: Math.min(user1_id, user2_id),
        user2_id: Math.max(user1_id, user2_id),
        last_message: message,
        last_message_time: new Date(),
        status_deleted: 0,
        unread_count_user1: 0,
        unread_count_user2: 0
      });
    } else if (chatRoom.status_deleted === 1) {
      // Restore chat room if it was deleted
      await chatRoom.update({
        status_deleted: 0,
        last_message: message,
        last_message_time: new Date()
      });
    } else {
      // Update chat room last message
      await chatRoom.update({
        last_message: message,
        last_message_time: new Date()
      });
    }

    // Create message
    const newMessage = await Message.create({
      room_id,
      sender_id,
      message,
      message_type,
      is_read: false,
      status_deleted: 0
    });

    // Get message with sender info
    const messageWithSender = await Message.findOne({
      where: { id: newMessage.id },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'nama', 'username']
      }]
    });

    // Get chat room info to determine receiver (reuse existing chatRoom variable)
    // Note: chatRoom variable is already available from above

    // Send notification to receiver (if not sender)
    if (chatRoom && sender_id !== chatRoom.user1_id && sender_id !== chatRoom.user2_id) {
      // This shouldn't happen, but just in case
      console.log('Sender not found in chat room');
    } else if (chatRoom) {
      const receiverId = chatRoom.user1_id === sender_id ? chatRoom.user2_id : chatRoom.user1_id;
      const sender = await User.findByPk(sender_id);
      
          // Get wsService instance from app
    const wsService = req.app.get('wsService');
    
    // Send WebSocket message for real-time updates
    if (wsService) {
      try {
        // Auto-join both users to the room if they're connected
        const senderWs = wsService.connectedUsers.get(sender_id);
        const receiverWs = wsService.connectedUsers.get(receiverId);
        
        // Ensure room exists in WebSocket maps
        if (!wsService.roomUsers.has(`chat_${room_id}`)) {
          wsService.roomUsers.set(`chat_${room_id}`, new Set());
        }
        
        if (senderWs && senderWs.readyState === 1) { // WebSocket.OPEN
          // Join sender to room
          if (!wsService.userRooms.has(sender_id)) {
            wsService.userRooms.set(sender_id, new Set());
          }
          wsService.userRooms.get(sender_id).add(`chat_${room_id}`);
          
          // Add sender to room's users
          wsService.roomUsers.get(`chat_${room_id}`).add(sender_id);
        }
        
        if (receiverWs && receiverWs.readyState === 1) { // WebSocket.OPEN
          // Join receiver to room
          if (!wsService.userRooms.has(receiverId)) {
            wsService.userRooms.set(receiverId, new Set());
          }
          wsService.userRooms.get(receiverId).add(`chat_${room_id}`);
          
          // Add receiver to room's users
          wsService.roomUsers.get(`chat_${room_id}`).add(receiverId);
        }
        
        // Small delay to ensure room setup is complete before broadcasting
        setTimeout(() => {
          const roomName = `chat_${room_id}`;
          
          // Broadcast the message
          wsService.broadcastToRoom(roomName, {
            type: 'new_message',
            data: {
              roomId: room_id,
              message: message,
              sender: sender_id,
              timestamp: new Date()
            }
          });
        }, 100);
      } catch (wsError) {
        console.error('WebSocket broadcast error:', wsError);
      }
    }
    
    // Send notification asynchronously (don't wait for it)
    sendChatNotification(sender_id, receiverId, message, sender.nama, wsService)
      .catch(error => {
        console.error('Error sending notification:', error);
      });
    }

    res.json({
      success: true,
      data: messageWithSender
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim pesan'
    });
  }
});

// Get user's chat rooms (conversations)
router.get('/rooms/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const chatRooms = await ChatRoom.findAll({
      where: {
        [Op.or]: [
          { user1_id: user_id },
          { user2_id: user_id }
        ],
        status_deleted: 0
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'nama', 'username', 'email']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'nama', 'username', 'email']
        }
      ],
      order: [
        ['last_message_time', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    // Format response to show the other user in each conversation
    const formattedRooms = chatRooms.map(room => {
      const otherUser = room.user1_id == user_id ? room.user2 : room.user1;
      return {
        room_id: room.room_id,
        other_user: otherUser,
        last_message: room.last_message,
        last_message_time: room.last_message_time,
        unread_count: room.user1_id == user_id ? room.unread_count_user1 : room.unread_count_user2
      };
    });

    res.json({
      success: true,
      data: formattedRooms
    });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil chat rooms'
    });
  }
});

// Soft delete chat room (set status_deleted = 1)
router.put('/room/:room_id/delete', async (req, res) => {
  try {
    const { room_id } = req.params;
    const { user_id } = req.body; // User who wants to delete the chat

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id diperlukan'
      });
    }

    // Find the chat room
    const chatRoom = await ChatRoom.findOne({
      where: {
        room_id: room_id,
        [Op.or]: [
          { user1_id: user_id },
          { user2_id: user_id }
        ],
        status_deleted: 0
      }
    });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room tidak ditemukan'
      });
    }

    // Soft delete the chat room
    await chatRoom.update({
      status_deleted: 1
    });

    // Soft delete all messages in this room
    await Message.update(
      { status_deleted: 1 },
      { where: { room_id: room_id } }
    );

    console.log(`🗑️ Chat room ${room_id} and all messages soft deleted by user ${user_id}`);

    res.json({
      success: true,
      message: 'Chat berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus chat'
    });
  }
});

// Get user online status and last online time
router.get('/user-status/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Get wsService instance from app
    const wsService = req.app.get('wsService');
    
    let isOnline = false;
    let lastOnline = null;
    
    if (wsService) {
      // Check if user is currently connected via WebSocket
      const connectedUsers = wsService.getConnectedUsers();
      isOnline = connectedUsers.has(parseInt(user_id));
    }
    
    // Get last online time from UserDevice table
    const { UserDevice } = require('../models');
    const lastDevice = await UserDevice.findOne({
      where: {
        user_id: user_id,
        is_active: true
      },
      order: [['last_online', 'DESC']]
    });
    
    if (lastDevice) {
      lastOnline = lastDevice.last_online;
    }
    
    res.json({
      success: true,
      data: {
        user_id: parseInt(user_id),
        is_online: isOnline,
        last_online: lastOnline
      }
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil status user'
    });
  }
});

module.exports = router; 