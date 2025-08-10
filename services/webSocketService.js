const WebSocket = require('ws');

const webSocketService = (server) => {
  // Create WebSocket server
  const wss = new WebSocket.Server({ server });
  
  // Menyimpan koneksi user
  const connectedUsers = new Map(); // userId -> ws
  const userRooms = new Map(); // userId -> Set of rooms
  const roomUsers = new Map(); // roomName -> Set of userIds

  wss.on('connection', (ws) => {
    let userId = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'user_login':
            userId = data.data.userId;
            connectedUsers.set(userId, ws);
            ws.userId = userId;
            
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
              
              console.log('🏠 User joining room:', { userId, room });
              
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
              
              console.log('✅ User joined room successfully:', { userId, room });
              
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
                if (roomUsers.get(room).size === 0) {
                  roomUsers.delete(room);
                }
              }
              
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
            
            console.log('💬 Chat message received:', { roomId, message, sender });
            
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                const clientUserId = client.userId;
                if (clientUserId && userRooms.has(clientUserId)) {
                  const clientRooms = userRooms.get(clientUserId);
                  if (clientRooms.has(`chat_${roomId}`)) {
                    console.log('📡 Broadcasting message to client:', clientUserId);
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
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
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

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Function to send notification to specific user
  const sendNotificationToUser = (userId, notificationData) => {
    const userWs = connectedUsers.get(userId);
    if (userWs && userWs.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify({
        type: 'notification',
        data: notificationData
      }));
      return true;
    }
    return false;
  };

  // Function to broadcast to all connected users
  const broadcastToAll = (messageData) => {
    let sentCount = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(messageData));
        sentCount++;
      }
    });
    return sentCount;
  };

  // Function to broadcast to specific room
  const broadcastToRoom = (roomName, messageData) => {
    console.log('📡 Broadcasting to room:', roomName, messageData);
    
    let sentCount = 0;
    
    // Ensure room exists in roomUsers map
    if (!roomUsers.has(roomName)) {
      console.log('⚠️ Room not found in roomUsers, creating:', roomName);
      roomUsers.set(roomName, new Set());
    }
    
    if (roomUsers.has(roomName)) {
      const roomUserIds = roomUsers.get(roomName);
      console.log('👥 Users in room:', roomName, Array.from(roomUserIds));
      
      roomUserIds.forEach(userId => {
        const userWs = connectedUsers.get(userId);
        if (userWs && userWs.readyState === WebSocket.OPEN) {
          console.log('📤 Sending message to user:', userId);
          userWs.send(JSON.stringify(messageData));
          sentCount++;
        } else {
          console.log('❌ User not connected or WebSocket not open:', userId);
        }
      });
    }
    
    console.log('✅ Broadcast completed, sent to', sentCount, 'users');
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