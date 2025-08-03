const socketService = (io) => {
  // Menyimpan koneksi user
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    
    // User login/register
    socket.on('user_login', (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user_${userId}`);
      
      console.log(`👤 User ${userId} logged in`);
      
      // Update last_login in UserDevice table
      const { UserDevice } = require('../models');
      UserDevice.update(
        { last_login: new Date() },
        { 
          where: { 
            user_id: userId,
            is_active: true 
          }
        }
      ).catch(error => {
        console.error('Error updating last_login:', error);
      });
      
      // Kirim welcome message
      socket.emit('welcome', {
        message: `Selamat datang User ${userId}!`,
        userId: userId,
        timestamp: new Date()
      });
    });
    
    // Join room untuk notifikasi tertentu
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`🚪 User ${socket.id} joined room: ${room}`);
    });
    
    // Leave room
    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`🚪 User ${socket.id} left room: ${room}`);
    });
    
    // Send notification to specific user
    socket.on('send_notification', (data) => {
      const targetSocketId = connectedUsers.get(data.userId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('new_notification', {
          ...data,
          timestamp: new Date()
        });
        console.log(`📢 Notification sent to user ${data.userId}`);
      } else {
        console.log(`❌ User ${data.userId} not found`);
      }
    });
    
    // Broadcast notification to all users
    socket.on('broadcast_notification', (data) => {
      io.emit('new_notification', {
        ...data,
        timestamp: new Date()
      });
      console.log(`📢 Broadcast notification sent to all users`);
    });
    
    // Chat message
    socket.on('chat_message', (data) => {
      io.emit('new_message', {
        ...data,
        timestamp: new Date()
      });
      console.log(`💬 New chat message from ${data.sender}`);
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`👤 User ${socket.userId} disconnected`);
        
        // Update last online time in UserDevice table
        const { UserDevice } = require('../models');
        UserDevice.update(
          { updated_at: new Date() },
          { 
            where: { 
              user_id: socket.userId,
              is_active: true 
            }
          }
        ).catch(error => {
          console.error('Error updating last online time:', error);
        });
      }
      console.log('🔌 User disconnected:', socket.id);
    });
  });

  // Error handling untuk WebSocket
  io.on('error', (error) => {
    console.error('❌ WebSocket Error:', error);
  });

  return {
    connectedUsers,
    getConnectedUsers: () => connectedUsers
  };
};

module.exports = socketService; 