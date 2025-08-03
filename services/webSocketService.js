const WebSocket = require('ws');

const webSocketService = (server) => {
  // Create WebSocket server
  const wss = new WebSocket.Server({ server });
  
  // Menyimpan koneksi user
  const connectedUsers = new Map(); // userId -> ws
  const userRooms = new Map(); // userId -> Set of rooms
  const roomUsers = new Map(); // roomName -> Set of userIds

  wss.on('connection', (ws) => {
    console.log('🔌 WebSocket connected:', ws._socket.remoteAddress);
    
    let userId = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('📨 Received message:', data.type, 'from user:', userId);
        
        switch (data.type) {
          case 'user_login':
            userId = data.data.userId;
            connectedUsers.set(userId, ws);
            ws.userId = userId;
            
            // Initialize user rooms
            if (!userRooms.has(userId)) {
              userRooms.set(userId, new Set());
            }
            
            console.log(`👤 User ${userId} logged in`);
            console.log(`📊 Total connected users: ${connectedUsers.size}`);
            
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
            ws.send(JSON.stringify({
              type: 'welcome',
              data: {
                message: `Selamat datang User ${userId}!`,
                userId: userId,
                timestamp: new Date()
              }
            }));
            break;
            
          case 'join_room':
            if (userId) {
              const room = data.data.room;
              
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
              
              console.log(`🚪 User ${userId} joined room: ${room}`);
              console.log(`👥 Users in room ${room}:`, Array.from(roomUsers.get(room)));
              
              // Send confirmation
              ws.send(JSON.stringify({
                type: 'room_joined',
                data: {
                  room: room,
                  userId: userId,
                  timestamp: new Date()
                }
              }));
            }
            break;
            
          case 'leave_room':
            if (userId) {
              const room = data.data.room;
              
              // Remove room from user's rooms
              if (userRooms.has(userId)) {
                userRooms.get(userId).delete(room);
              }
              
              // Remove user from room's users
              if (roomUsers.has(room)) {
                roomUsers.get(room).delete(userId);
                
                // Clean up empty rooms
                if (roomUsers.get(room).size === 0) {
                  roomUsers.delete(room);
                }
              }
              
              console.log(`🚪 User ${userId} left room: ${room}`);
              
              // Send confirmation
              ws.send(JSON.stringify({
                type: 'room_left',
                data: {
                  room: room,
                  userId: userId,
                  timestamp: new Date()
                }
              }));
            }
            break;
            
          case 'chat_message':
            // Broadcast to all users in the room
            const roomId = data.data.roomId;
            const message = data.data.message;
            const sender = data.data.sender;
            
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                const clientUserId = client.userId;
                if (clientUserId && userRooms.has(clientUserId)) {
                  const clientRooms = userRooms.get(clientUserId);
                  if (clientRooms.has(`chat_${roomId}`)) {
                    client.send(JSON.stringify({
                      type: 'new_message',
                      data: {
                        roomId,
                        message,
                        sender,
                        timestamp: new Date()
                      }
                    }));
                  }
                }
              }
            });
            console.log(`💬 Chat message from ${sender} in room ${roomId}`);
            break;
            
          default:
            console.log('📨 Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
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
        console.log(`👤 User ${userId} disconnected`);
        console.log(`📊 Total connected users: ${connectedUsers.size}`);
        
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
      console.log('🔌 WebSocket disconnected');
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });

  // Function to send notification to specific user
  const sendNotificationToUser = (userId, notificationData) => {
    const userWs = connectedUsers.get(userId);
    if (userWs && userWs.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify({
        type: 'chat_notification',
        data: notificationData
      }));
      console.log(`📡 WebSocket notification sent to user ${userId}`);
      return true;
    } else {
      console.log(`❌ User ${userId} not connected or WebSocket not open`);
      return false;
    }
  };

  // Function to broadcast to all users
  const broadcastToAll = (notificationData) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'new_notification',
          data: notificationData
        }));
      }
    });
    console.log(`📢 Broadcast notification sent to all users`);
  };

  // Function to broadcast to specific room with improved logging
  const broadcastToRoom = (roomName, messageData) => {
    let sentCount = 0;
    console.log(`📡 Attempting to broadcast to room: ${roomName}`);
    console.log(`👥 Total connected users: ${connectedUsers.size}`);
    console.log(`🏠 Room users for ${roomName}:`, roomUsers.has(roomName) ? Array.from(roomUsers.get(roomName)) : 'none');
    
    if (roomUsers.has(roomName)) {
      const roomUserIds = roomUsers.get(roomName);
      
      roomUserIds.forEach(userId => {
        const userWs = connectedUsers.get(userId);
        if (userWs && userWs.readyState === WebSocket.OPEN) {
          userWs.send(JSON.stringify(messageData));
          sentCount++;
          console.log(`✅ Message sent to user ${userId}`);
        } else {
          console.log(`❌ User ${userId} not connected or WebSocket not open`);
        }
      });
    } else {
      console.log(`❌ Room ${roomName} not found or empty`);
    }
    
    console.log(`📡 Broadcast message sent to ${sentCount} users in room: ${roomName}`);
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