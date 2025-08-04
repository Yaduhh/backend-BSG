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

// Send task notification
const sendTaskNotification = async (taskData, pemberiTugas, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get task details
    const taskTitle = taskData.judul_tugas;
    const taskDescription = taskData.keterangan_tugas;
    const priority = taskData.skala_prioritas;
    const targetDate = new Date(taskData.target_selesai);
    
    // Format priority text
    const priorityText = {
      'mendesak': 'Mendesak',
      'penting': 'Penting', 
      'berproses': 'Berproses'
    }[priority] || 'Berproses';
    
    // Format target date
    const formattedDate = targetDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Notification for penerima tugas (assigned person)
    if (taskData.penerima_tugas) {
      const penerimaUser = await User.findByPk(taskData.penerima_tugas);
      if (penerimaUser) {
        const title = `📋 Tugas Baru: ${taskTitle}`;
        const body = `Anda ditugaskan oleh ${pemberiTugas.nama}. Prioritas: ${priorityText}. Target: ${formattedDate}`;
        const data = {
          type: 'task_assigned',
          task_id: taskData.id,
          task_title: taskTitle,
          priority: priority,
          target_date: targetDate.toISOString(),
          pemberi_tugas_id: pemberiTugas.id,
          pemberi_tugas_name: pemberiTugas.nama
        };

        // Send push notification
        await sendNotificationToUser(taskData.penerima_tugas, title, body, data);

        // Send WebSocket notification if user is online
        if (wsService) {
          try {
            const notificationData = {
              type: 'task_assigned',
              task_id: taskData.id,
              task_title: taskTitle,
              priority: priority,
              target_date: targetDate.toISOString(),
              pemberi_tugas_id: pemberiTugas.id,
              pemberi_tugas_name: pemberiTugas.nama,
              title: title,
              body: body,
              timestamp: new Date()
            };
            
            wsService.sendNotificationToUser(taskData.penerima_tugas, notificationData);
          } catch (wsError) {
            console.error('WebSocket notification error for penerima tugas:', wsError);
          }
        }
      }
    }

    // Notification for pihak terkait (related parties)
    if (taskData.pihak_terkait && Array.isArray(taskData.pihak_terkait)) {
      for (const userId of taskData.pihak_terkait) {
        // Skip if this user is the same as penerima tugas
        if (userId === taskData.penerima_tugas) continue;
        
        const relatedUser = await User.findByPk(userId);
        if (relatedUser) {
          const title = `👥 Tugas Terkait: ${taskTitle}`;
          const body = `Anda terkait dengan tugas dari ${pemberiTugas.nama}. Prioritas: ${priorityText}. Target: ${formattedDate}`;
          const data = {
            type: 'task_related',
            task_id: taskData.id,
            task_title: taskTitle,
            priority: priority,
            target_date: targetDate.toISOString(),
            pemberi_tugas_id: pemberiTugas.id,
            pemberi_tugas_name: pemberiTugas.nama
          };

          // Send push notification
          await sendNotificationToUser(userId, title, body, data);

          // Send WebSocket notification if user is online
          if (wsService) {
            try {
              const notificationData = {
                type: 'task_related',
                task_id: taskData.id,
                task_title: taskTitle,
                priority: priority,
                target_date: targetDate.toISOString(),
                pemberi_tugas_id: pemberiTugas.id,
                pemberi_tugas_name: pemberiTugas.nama,
                title: title,
                body: body,
                timestamp: new Date()
              };
              
              wsService.sendNotificationToUser(userId, notificationData);
            } catch (wsError) {
              console.error('WebSocket notification error for pihak terkait:', wsError);
            }
          }
        }
      }
    }

    console.log(`✅ Task notifications sent successfully for task: ${taskTitle}`);
    return true;
  } catch (error) {
    console.error('Error sending task notification:', error);
    return false;
  }
};

// Send komplain notification
const sendKomplainNotification = async (komplainData, pelapor, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get komplain details
    const komplainTitle = komplainData.judul_komplain;
    const komplainDescription = komplainData.deskripsi_komplain;
    const priority = komplainData.prioritas;
    const category = komplainData.kategori;
    const targetDate = komplainData.target_selesai ? new Date(komplainData.target_selesai) : null;
    
    // Format priority text
    const priorityText = {
      'mendesak': 'Mendesak',
      'penting': 'Penting', 
      'berproses': 'Berproses'
    }[priority] || 'Berproses';
    
    // Format category text
    const categoryText = {
      'sistem': 'Sistem',
      'layanan': 'Layanan',
      'produk': 'Produk',
      'lainnya': 'Lainnya'
    }[category] || 'Lainnya';
    
    // Format target date
    const formattedDate = targetDate ? targetDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) : 'Tidak ditentukan';

    // Notification for penerima komplain (responsible person)
    if (komplainData.penerima_komplain_id) {
      const penerimaKomplainUser = await User.findByPk(komplainData.penerima_komplain_id);
      if (penerimaKomplainUser) {
        const title = `🚨 Komplain Baru: ${komplainTitle}`;
        const body = `Anda ditugaskan untuk menangani komplain dari ${pelapor.nama}. Kategori: ${categoryText}. Prioritas: ${priorityText}. Target: ${formattedDate}`;
        const data = {
          type: 'komplain_assigned',
          komplain_id: komplainData.id,
          komplain_title: komplainTitle,
          priority: priority,
          category: category,
          target_date: targetDate ? targetDate.toISOString() : null,
          pelapor_id: pelapor.id,
          pelapor_name: pelapor.nama
        };

        // Send push notification
        await sendNotificationToUser(komplainData.penerima_komplain_id, title, body, data);

        // Send WebSocket notification if user is online
        if (wsService) {
          try {
            const notificationData = {
              type: 'komplain_assigned',
              komplain_id: komplainData.id,
              komplain_title: komplainTitle,
              priority: priority,
              category: category,
              target_date: targetDate ? targetDate.toISOString() : null,
              pelapor_id: pelapor.id,
              pelapor_name: pelapor.nama,
              title: title,
              body: body,
              timestamp: new Date()
            };
            
            wsService.sendNotificationToUser(komplainData.penerima_komplain_id, notificationData);
          } catch (wsError) {
            console.error('WebSocket notification error for penerima komplain:', wsError);
          }
        }
      }
    }

    // Notification for pihak terkait (related parties)
    if (komplainData.pihak_terkait && Array.isArray(komplainData.pihak_terkait)) {
      for (const userId of komplainData.pihak_terkait) {
        // Skip if this user is the same as penerima komplain
        if (userId === komplainData.penerima_komplain_id) continue;
        
        const relatedUser = await User.findByPk(userId);
        if (relatedUser) {
          const title = `👥 Komplain Terkait: ${komplainTitle}`;
          const body = `Anda terkait dengan komplain dari ${pelapor.nama}. Kategori: ${categoryText}. Prioritas: ${priorityText}. Target: ${formattedDate}`;
          const data = {
            type: 'komplain_related',
            komplain_id: komplainData.id,
            komplain_title: komplainTitle,
            priority: priority,
            category: category,
            target_date: targetDate ? targetDate.toISOString() : null,
            pelapor_id: pelapor.id,
            pelapor_name: pelapor.nama
          };

          // Send push notification
          await sendNotificationToUser(userId, title, body, data);

          // Send WebSocket notification if user is online
          if (wsService) {
            try {
              const notificationData = {
                type: 'komplain_related',
                komplain_id: komplainData.id,
                komplain_title: komplainTitle,
                priority: priority,
                category: category,
                target_date: targetDate ? targetDate.toISOString() : null,
                pelapor_id: pelapor.id,
                pelapor_name: pelapor.nama,
                title: title,
                body: body,
                timestamp: new Date()
              };
              
              wsService.sendNotificationToUser(userId, notificationData);
            } catch (wsError) {
              console.error('WebSocket notification error for pihak terkait:', wsError);
            }
          }
        }
      }
    }

    console.log(`✅ Komplain notifications sent successfully for complaint: ${komplainTitle}`);
    return true;
  } catch (error) {
    console.error('Error sending komplain notification:', error);
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
  sendTaskNotification,
  sendKomplainNotification,
  checkNotificationReceipts
}; 