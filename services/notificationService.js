const { Expo } = require('expo-server-sdk');
const { UserDevice } = require('../models');

// Create a new Expo SDK client
const expo = new Expo();

// Send notification to a single device
const sendNotificationToDevice = async (expoToken, title, body, data = {}) => {
  try {
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(expoToken)) {
      console.error(`Push token ${expoToken} is not a valid Expo push token`);
      return false;
    }

    // Construct a message
    const message = {
      to: expoToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    };

    // Send the message
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }

    return tickets.length > 0;
  } catch (error) {
    console.error('Error sending notification to device:', error);
    return false;
  }
};

// Send notification to all active devices of a user
const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    // Get all active devices for the user
    const devices = await UserDevice.findAll({
      where: { 
        user_id: userId,
        is_active: true 
      },
      attributes: ['expo_token', 'device_name']
    });

    if (devices.length === 0) {
      console.log(`No active devices found for user ${userId}`);
      return false;
    }

    // Send to all devices
    const results = await Promise.all(
      devices.map(device => 
        sendNotificationToDevice(device.expo_token, title, body, data)
      )
    );

    const successCount = results.filter(result => result === true).length;
    console.log(`Sent notification to ${successCount}/${devices.length} devices for user ${userId}`);

    return successCount > 0;
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return false;
  }
};

// Send chat notification
const sendChatNotification = async (senderId, receiverId, message, senderName, wsService = null) => {
  try {
    const title = `Pesan baru dari ${senderName}`;
    const body = message.length > 50 ? message.substring(0, 50) + '...' : message;
    const data = {
      type: 'chat',
      sender_id: senderId,
      sender_name: senderName,
      message: message
    };

    // Send push notification
    const pushResult = await sendNotificationToUser(receiverId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService) {
      try {
        const notificationData = {
          type: 'chat',
          sender_id: senderId,
          sender_name: senderName,
          message: message,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(receiverId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error:', wsError);
      }
    }

    return pushResult;
  } catch (error) {
    console.error('Error sending chat notification:', error);
    return false;
  }
};

// Check notification receipts
const checkNotificationReceipts = async (tickets) => {
  try {
    const receiptIds = tickets
      .map(ticket => ticket.id)
      .filter(id => id);

    if (receiptIds.length === 0) {
      return;
    }

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    const receipts = [];

    for (let chunk of receiptIdChunks) {
      try {
        const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
        receipts.push(...receiptChunk);
      } catch (error) {
        console.error('Error getting receipts:', error);
      }
    }

    // Handle receipts
    receipts.forEach(receipt => {
      if (receipt.status === 'error') {
        console.error('Notification error:', receipt.message);
        if (receipt.details && receipt.details.error) {
          console.error('Error details:', receipt.details.error);
        }
      }
    });
  } catch (error) {
    console.error('Error checking notification receipts:', error);
  }
};

module.exports = {
  sendNotificationToDevice,
  sendNotificationToUser,
  sendChatNotification,
  checkNotificationReceipts
}; 