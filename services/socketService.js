const socketService = (io) => {
  // Menyimpan koneksi user
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    // User login/register
    socket.on('user_login', (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user_${userId}`);
      
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
    });
    
    // Leave room
    socket.on('leave_room', (room) => {
      socket.leave(room);
    });
    
    // Send notification to specific user
    socket.on('send_notification', (data) => {
      const targetSocketId = connectedUsers.get(data.userId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('new_notification', {
          ...data,
          timestamp: new Date()
        });
      }
    });
    
    // Broadcast notification to all users
    socket.on('broadcast_notification', (data) => {
      io.emit('new_notification', {
        ...data,
        timestamp: new Date()
      });
    });
    
    // Chat message
    socket.on('chat_message', (data) => {
      io.emit('new_message', {
        ...data,
        timestamp: new Date()
      });
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
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
    });
  });

  // Error handling untuk WebSocket
  io.on('error', (error) => {
    console.error('WebSocket Error:', error);
  });

  return {
    connectedUsers,
    getConnectedUsers: () => connectedUsers
  };
};

module.exports = socketService; 