const express = require('express');
const router = express.Router();
const { ChatRoom, Message, User } = require('../models');
const { Op } = require('../config/database');
const { sendChatNotification } = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

// Helper: case-insensitive role check
function hasRole(req, allowedRoles = []) {
  const role = String(req.user?.role || '').toLowerCase();
  return allowedRoles.includes(role);
}

// Get all chat rooms for leader (with all users)
router.get('/rooms/:leaderId', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Leader only.'
      });
    }

    const { leaderId } = req.params;
    
    // Get all chat rooms where leader is involved
    const chatRooms = await ChatRoom.findAll({
      where: {
        [Op.or]: [
          { user1_id: leaderId },
          { user2_id: leaderId }
        ],
        status_deleted: 0
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'nama', 'username', 'email', 'role']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'nama', 'username', 'email', 'role']
        }
      ],
      order: [['last_message_time', 'DESC']]
    });

    // Format chat rooms data
    const formattedRooms = chatRooms.map(room => {
      const otherUser = room.user1_id == leaderId ? room.user2 : room.user1;
      return {
        room_id: `${room.user1_id}_${room.user2_id}`,
        other_user: otherUser,
        last_message: room.last_message,
        last_message_time: room.last_message_time,
        unread_count: room.user1_id == leaderId ? room.unread_count_user1 : room.unread_count_user2
      };
    });

    res.json({
      success: true,
      data: formattedRooms
    });
  } catch (error) {
    console.error('Error fetching leader chat rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar chat'
    });
  }
});

// Get all users for leader to start new chat
router.get('/contacts/:leaderId', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Leader only.'
      });
    }

    const { leaderId } = req.params;
    
    // Get all users except leader
    const users = await User.findAll({
      where: {
        status_deleted: 0,
        id: {
          [Op.ne]: leaderId
        }
      },
      attributes: ['id', 'nama', 'username', 'email', 'role'],
      order: [['nama', 'ASC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching leader contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar kontak'
    });
  }
});

// Get messages for a specific chat room
router.get('/messages/:room_id', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Leader only.'
      });
    }

    const { room_id } = req.params;
    
    const messages = await Message.findAll({
      where: {
        room_id: room_id,
        status_deleted: 0
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'nama', 'username', 'role']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching leader messages:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil pesan'
    });
  }
});

// Send message (leader to any user)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Leader only.'
      });
    }

    const { room_id, message, receiver_id } = req.body;
    const sender_id = req.user.id;

    // Validate required fields
    if (!message || !receiver_id) {
      return res.status(400).json({
        success: false,
        message: 'Pesan dan penerima diperlukan'
      });
    }

    let chatRoom;
    
    // Check if chat room exists
    if (room_id) {
      chatRoom = await ChatRoom.findOne({
        where: {
          room_id: room_id,
          status_deleted: 0
        }
      });
    } else {
      // Create new chat room if doesn't exist
      const room_id_string = `${sender_id}_${receiver_id}`;
      chatRoom = await ChatRoom.create({
        room_id: room_id_string,
        user1_id: sender_id,
        user2_id: receiver_id,
        last_message: message,
        last_message_time: new Date()
      });
    }

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room tidak ditemukan'
      });
    }

    // Create message
    const newMessage = await Message.create({
      room_id: chatRoom.room_id,
      sender_id: sender_id,
      message: message,
      message_type: 'text',
      is_read: false,
      status_deleted: 0
    });

    // Update chat room last message
    await chatRoom.update({
      last_message: message,
      last_message_time: new Date(),
      unread_count_user2: chatRoom.unread_count_user2 + 1
    });

    // Get message with sender info
    const messageWithSender = await Message.findByPk(newMessage.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'nama', 'username', 'role']
        }
      ]
    });

    // Send notification to receiver
    try {
      // Determine the actual receiver (not the sender)
      const actualReceiver = sender_id === chatRoom.user1_id ? chatRoom.user2_id : chatRoom.user1_id;
      const sender = await User.findByPk(sender_id);
      
      // Get wsService instance from app
      const wsService = req.app.get('wsService');
      
      // Send WebSocket message for real-time updates
      if (wsService) {
        try {
          // Use chatRoom.room_id for consistency
          const room_id = chatRoom.room_id;
          
          // Auto-join both users to the room if they're connected
          const senderWs = wsService.connectedUsers.get(sender_id);
          const receiverWs = wsService.connectedUsers.get(actualReceiver);
          
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
            if (!wsService.userRooms.has(actualReceiver)) {
              wsService.userRooms.set(actualReceiver, new Set());
            }
            wsService.userRooms.get(actualReceiver).add(`chat_${room_id}`);
            
            // Add receiver to room's users
            wsService.roomUsers.get(`chat_${room_id}`).add(actualReceiver);
          }
          
          // Broadcast the message immediately without delay
          const roomName = `chat_${room_id}`;
          
          console.log('📡 Broadcasting WebSocket message to room:', roomName, {
            roomId: room_id,
            message: message,
            sender: sender_id
          });
          
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
        } catch (wsError) {
          console.error('WebSocket broadcast error:', wsError);
        }
      }
      
      // Send notification asynchronously (don't wait for it)
      sendChatNotification(sender_id, actualReceiver, message, sender.nama, wsService)
        .then(success => {
          if (success) {
            console.log(`Notification sent to user ${actualReceiver}`);
          } else {
            console.log(`Failed to send notification to user ${actualReceiver}`);
          }
        })
        .catch(error => {
          console.error('Error sending notification:', error);
        });
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.json({
      success: true,
      message: 'Pesan berhasil dikirim',
      data: {
        ...messageWithSender.toJSON(),
        room_id: chatRoom.room_id
      }
    });
  } catch (error) {
    console.error('Error sending leader message:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim pesan'
    });
  }
});

// Mark messages as read
router.put('/read/:room_id', authenticateToken, async (req, res) => {
  try {
    if (!hasRole(req, ['leader'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Leader only.'
      });
    }

    const { room_id } = req.params;
    const leaderId = req.user.id;

    // Reset unread count for leader in chat room
    await ChatRoom.update(
      {
        unread_count_user1: 0
      },
      {
        where: {
          room_id: room_id,
          user1_id: leaderId
        }
      }
    );

    await ChatRoom.update(
      {
        unread_count_user2: 0
      },
      {
        where: {
          room_id: room_id,
          user2_id: leaderId
        }
      }
    );

    res.json({
      success: true,
      message: 'Pesan ditandai sebagai telah dibaca'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menandai pesan sebagai telah dibaca'
    });
  }
});

module.exports = router;
