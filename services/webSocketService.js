const { Server } = require('socket.io');

const webSocketService = (server) => {
  // Create Socket.IO server
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });
  
  // Menyimpan koneksi user
  const connectedUsers = new Map(); // userId -> socket
  const userRooms = new Map(); // userId -> Set of rooms
  const roomUsers = new Map(); // roomName -> Set of userIds

  io.on('connection', (socket) => {
    console.log('🔌 New Socket.IO connection:', socket.id);
    let userId = null;

    socket.on('user_login', (data) => {
      try {
        userId = data.userId;
        connectedUsers.set(userId, socket);
        socket.userId = userId;
        
        // Initialize user rooms
        if (!userRooms.has(userId)) {
          userRooms.set(userId, new Set());
        }
        
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
        
        // Send welcome message
        socket.emit('welcome', {
          message: `Selamat datang User ${userId}!`,
          userId: userId,
          timestamp: new Date()
        });
        
        console.log('✅ User logged in:', userId);
      } catch (error) {
        console.error('Error in user_login:', error);
      }
    });
    
    socket.on('join_room', (data) => {
      try {
        if (userId) {
          const room = data.room;
          
          // Add room to user's rooms
          if (!userRooms.has(userId)) {
            userRooms.set(userId, new Set());
          }
          userRooms.get(userId).add(room);
          
          // Add user to room's users
          if (!roomUsers.has(room)) {
            roomUsers.set(room, new Set());
          }
          roomUsers.get(room).add(userId);
          
          // Send confirmation
          socket.emit('room_joined', {
            room: room,
            userId: userId,
            timestamp: new Date()
          });
          
          console.log('✅ User joined room:', userId, room);
        }
      } catch (error) {
        console.error('Error in join_room:', error);
      }
    });
    
    socket.on('leave_room', (data) => {
      try {
        if (userId) {
          const room = data.room;
          
          // Remove room from user's rooms
          if (userRooms.has(userId)) {
            userRooms.get(userId).delete(room);
          }
          
          // Remove user from room's users
          if (roomUsers.has(room)) {
            roomUsers.get(room).delete(userId);
            if (roomUsers.get(room).size === 0) {
              roomUsers.delete(room);
            }
          }
          
          // Send confirmation
          socket.emit('room_left', {
            room: room,
            userId: userId,
            timestamp: new Date()
          });
          
          console.log('✅ User left room:', userId, room);
        }
      } catch (error) {
        console.error('Error in leave_room:', error);
      }
    });
    
    socket.on('chat_message', (data) => {
      try {
        // Broadcast to all users in the room
        const roomId = data.roomId;
        const message = data.message;
        const sender = data.sender;
            
        console.log('💬 Chat message received:', { roomId, message, sender });
        
        // Broadcast to all connected users in the room
        connectedUsers.forEach((clientSocket, clientUserId) => {
          if (clientUserId !== userId && userRooms.has(clientUserId)) {
            const clientRooms = userRooms.get(clientUserId);
            if (clientRooms.has(`chat_${roomId}`)) {
              console.log('📡 Broadcasting message to client:', clientUserId);
              clientSocket.emit('new_message', {
                roomId,
                message,
                sender,
                timestamp: new Date()
              });
            }
          }
        });
      } catch (error) {
        console.error('Error in chat_message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket.IO disconnected:', socket.id, userId);
      
      if (userId) {
        // Remove user from all rooms
        if (userRooms.has(userId)) {
          const userRoomsSet = userRooms.get(userId);
          userRoomsSet.forEach(room => {
            if (roomUsers.has(room)) {
              roomUsers.get(room).delete(userId);
              if (roomUsers.get(room).size === 0) {
                roomUsers.delete(room);
              }
            }
          });
          userRooms.delete(userId);
        }
        
        connectedUsers.delete(userId);
        
        // Update last online time in UserDevice table
        const { UserDevice } = require('../models');
        UserDevice.update(
          { last_online: new Date() },
          { 
            where: { 
              user_id: userId,
              is_active: true 
            }
          }
        ).catch(error => {
          console.error('Error updating last online time:', error);
        });
      }
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
  });

  // Function to send notification to specific user
  const sendNotificationToUser = (userId, notificationData) => {
    const userSocket = connectedUsers.get(userId);
    if (userSocket && userSocket.connected) {
      userSocket.emit('new_notification', notificationData);
      return true;
    }
    return false;
  };

  // Function to broadcast to all connected users
  const broadcastToAll = (messageData) => {
    let sentCount = 0;
    connectedUsers.forEach((socket) => {
      if (socket.connected) {
        socket.emit(messageData.type, messageData.data || messageData);
        sentCount++;
      }
    });
    return sentCount;
  };

  // Function to broadcast to specific room
  const broadcastToRoom = (roomName, messageData) => {
    let sentCount = 0;
    
    // Ensure room exists in roomUsers map
    if (!roomUsers.has(roomName)) {
      roomUsers.set(roomName, new Set());
    }
    
    if (roomUsers.has(roomName)) {
      const roomUserIds = roomUsers.get(roomName);
      
      roomUserIds.forEach(userId => {
        const userSocket = connectedUsers.get(userId);
        
        if (userSocket && userSocket.connected) {
          try {
            userSocket.emit(messageData.type, messageData.data || messageData);
            sentCount++;
          } catch (error) {
            console.error('❌ Error sending message to user:', userId, error);
          }
        }
      });
    }
    
    return sentCount;
  };

  // Function to get connection status
  const getConnectionStatus = () => {
    return {
      totalUsers: connectedUsers.size,
      totalRooms: roomUsers.size,
      users: Array.from(connectedUsers.keys()),
      rooms: Array.from(roomUsers.keys()).map(room => ({
        name: room,
        userCount: roomUsers.get(room).size,
        users: Array.from(roomUsers.get(room))
      }))
    };
  };

  return {
    connectedUsers,
    userRooms,
    roomUsers,
    sendNotificationToUser,
    broadcastToAll,
    broadcastToRoom,
    getConnectedUsers: () => connectedUsers,
    getConnectionStatus
  };
};

module.exports = webSocketService; 