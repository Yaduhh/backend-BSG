const { Expo } = require('expo-server-sdk');
const { UserDevice } = require('../models');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to load from environment variable first
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('✅ Firebase Admin SDK initialized from environment');
    } else {
      // Fallback to local file (for development)
      const serviceAccount = require('../firebase-service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin SDK initialized from local file');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    console.error('Make sure firebase-service-account.json exists or GOOGLE_APPLICATION_CREDENTIALS is set');
  }
}

// Create a new Expo SDK client with proper credentials
const expo = new Expo({
  useFcmV1: true,
});

// Rate limiting for notifications (prevent spam)
const notificationRateLimit = new Map();
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
const MAX_NOTIFICATIONS_PER_WINDOW = 1;

// Helper function to parse pihak terkait (handle both string JSON and array)
const parsePihakTerkait = (pihakTerkait) => {
  if (!pihakTerkait) return [];
  
  if (typeof pihakTerkait === 'string') {
    try {
      return JSON.parse(pihakTerkait);
    } catch (parseError) {
      console.error('Error parsing pihak_terkait JSON:', parseError);
      return [];
    }
  }
  
  return Array.isArray(pihakTerkait) ? pihakTerkait : [];
};

// Send notification to a single device using Expo SDK with Firebase credentials
const sendNotificationToDevice = async (expoToken, title, body, data = {}) => {
  try {
    console.log(`📤 Sending notification to token: ${expoToken}`);
    console.log(`📋 Title: ${title}, Body: ${body}`);
    
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(expoToken)) {
      console.error(`❌ Push token ${expoToken} is not a valid Expo push token`);
      return false;
    }
    
    console.log(`✅ Token validation passed`);

    // Construct a message
    const message = {
      to: expoToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    };

    console.log(`🚀 Sending notification via Expo SDK with Firebase credentials`);

    // Send the message using Expo SDK
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        console.log(`🚀 Sending chunk with ${chunk.length} messages`);
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(`📨 Received tickets:`, ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Error sending chunk:', error);
      }
    }

    const success = tickets.length > 0 && tickets.some(ticket => ticket.status === 'ok');
    console.log(`📊 Notification result: ${success ? 'SUCCESS' : 'FAILED'}, tickets: ${tickets.length}`);
    
    if (!success && tickets.length > 0) {
      console.error(`❌ Notification errors:`, tickets);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error sending notification to device:', error);
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
        if (wsService && wsService.sendNotificationToUser) {
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
    const pihakTerkait = parsePihakTerkait(taskData.pihak_terkait);
    
    for (const userId of pihakTerkait) {
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
        if (wsService && wsService.sendNotificationToUser) {
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

    // Notification for penerima komplain (assigned person)
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
    const pihakTerkait = parsePihakTerkait(komplainData.pihak_terkait);
    
    for (const userId of pihakTerkait) {
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

    console.log(`✅ Komplain notifications sent successfully for complaint: ${komplainTitle}`);
    return true;
  } catch (error) {
    console.error('Error sending komplain notification:', error);
    return false;
  }
};

// Send komplain status update notification
const sendKomplainStatusUpdateNotification = async (komplainData, adminUser, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get komplain details
    const komplainTitle = komplainData.judul_komplain;
    const newStatus = komplainData.status;
    const pelaporId = komplainData.pelapor_id;
    
    // Get pelapor user
    const pelapor = await User.findByPk(pelaporId);
    if (!pelapor) {
      console.error('Pelapor not found for komplain:', komplainData.id);
      return false;
    }

    // Format status text
    const statusText = {
      'menunggu': 'Menunggu Penanganan',
      'diproses': 'Sedang Diproses',
      'selesai': 'Selesai Ditangani',
      'ditolak': 'Ditolak'
    }[newStatus] || 'Status Tidak Diketahui';

    // Notification for pelapor (owner) - status update
    const title = `📋 Status Komplain Diperbarui: ${komplainTitle}`;
    const body = `Status komplain Anda telah diperbarui menjadi "${statusText}" oleh admin ${adminUser.nama}`;
    const data = {
      type: 'komplain_status_update',
      komplain_id: komplainData.id,
      komplain_title: komplainTitle,
      new_status: newStatus,
      status_text: statusText,
      admin_id: adminUser.id,
      admin_name: adminUser.nama
    };

    // Send push notification
    await sendNotificationToUser(pelaporId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService) {
      try {
        const notificationData = {
          type: 'komplain_status_update',
          komplain_id: komplainData.id,
          komplain_title: komplainTitle,
          new_status: newStatus,
          status_text: statusText,
          admin_id: adminUser.id,
          admin_name: adminUser.nama,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(pelaporId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for status update:', wsError);
      }
    }

    console.log(`✅ Komplain status update notification sent to pelapor: ${pelapor.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending komplain status update notification:', error);
    return false;
  }
};

// Send komplain completion notification (when lampiran is uploaded)
const sendKomplainCompletionNotification = async (komplainData, adminUser, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get komplain details
    const komplainTitle = komplainData.judul_komplain;
    const pelaporId = komplainData.pelapor_id;
    const catatanAdmin = komplainData.catatan_admin;
    
    // Get pelapor user
    const pelapor = await User.findByPk(pelaporId);
    if (!pelapor) {
      console.error('Pelapor not found for komplain:', komplainData.id);
      return false;
    }

    // Notification for pelapor (owner) - komplain completed
    const title = `✅ Komplain Selesai: ${komplainTitle}`;
    const body = `Komplain Anda telah selesai ditangani oleh admin ${adminUser.nama}. Catatan: ${catatanAdmin || 'Tidak ada catatan'}`;
    const data = {
      type: 'komplain_completed',
      komplain_id: komplainData.id,
      komplain_title: komplainTitle,
      admin_id: adminUser.id,
      admin_name: adminUser.nama,
      catatan_admin: catatanAdmin
    };

    // Send push notification
    await sendNotificationToUser(pelaporId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService) {
      try {
        const notificationData = {
          type: 'komplain_completed',
          komplain_id: komplainData.id,
          komplain_title: komplainTitle,
          admin_id: adminUser.id,
          admin_name: adminUser.nama,
          catatan_admin: catatanAdmin,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(pelaporId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for completion:', wsError);
      }
    }

    console.log(`✅ Komplain completion notification sent to pelapor: ${pelapor.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending komplain completion notification:', error);
    return false;
  }
};

// Send komplain admin note notification
const sendKomplainAdminNoteNotification = async (komplainData, adminUser, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get komplain details
    const komplainTitle = komplainData.judul_komplain;
    const pelaporId = komplainData.pelapor_id;
    const catatanAdmin = komplainData.catatan_admin;
    
    // Get pelapor user
    const pelapor = await User.findByPk(pelaporId);
    if (!pelapor) {
      console.error('Pelapor not found for komplain:', komplainData.id);
      return false;
    }

    // Notification for pelapor (owner) - admin note added
    const title = `📝 Catatan Admin: ${komplainTitle}`;
    const body = `Admin ${adminUser.nama} telah menambahkan catatan untuk komplain Anda: ${catatanAdmin}`;
    const data = {
      type: 'komplain_admin_note',
      komplain_id: komplainData.id,
      komplain_title: komplainTitle,
      admin_id: adminUser.id,
      admin_name: adminUser.nama,
      catatan_admin: catatanAdmin
    };

    // Send push notification
    await sendNotificationToUser(pelaporId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService) {
      try {
        const notificationData = {
          type: 'komplain_admin_note',
          komplain_id: komplainData.id,
          komplain_title: komplainTitle,
          admin_id: adminUser.id,
          admin_name: adminUser.nama,
          catatan_admin: catatanAdmin,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(pelaporId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for admin note:', wsError);
      }
    }

    console.log(`✅ Komplain admin note notification sent to pelapor: ${pelapor.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending komplain admin note notification:', error);
    return false;
  }
};

// Send komplain new notification from owner to admin
const sendKomplainNewNotification = async (komplainData, pelapor, wsService = null) => {
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

    // Notification for penerima komplain (admin) - new komplain assigned
    if (komplainData.penerima_komplain_id) {
      const penerimaKomplainUser = await User.findByPk(komplainData.penerima_komplain_id);
      if (penerimaKomplainUser) {
        const title = `🚨 Komplain Baru: ${komplainTitle}`;
        const body = `Anda ditugaskan untuk menangani komplain dari ${pelapor.nama}. Kategori: ${categoryText}. Prioritas: ${priorityText}. Target: ${formattedDate}`;
        const data = {
          type: 'komplain_new_assigned',
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
              type: 'komplain_new_assigned',
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
            console.error('WebSocket notification error for new komplain assigned:', wsError);
          }
        }
      }
    }

    // Notification for pihak terkait (related parties) - new komplain
    const pihakTerkait = parsePihakTerkait(komplainData.pihak_terkait);
    
    for (const userId of pihakTerkait) {
      // Skip if this user is the same as penerima komplain
      if (userId === komplainData.penerima_komplain_id) continue;
      
      const relatedUser = await User.findByPk(userId);
      if (relatedUser) {
        const title = `👥 Komplain Terkait Baru: ${komplainTitle}`;
        const body = `Anda terkait dengan komplain baru dari ${pelapor.nama}. Kategori: ${categoryText}. Prioritas: ${priorityText}. Target: ${formattedDate}`;
        const data = {
          type: 'komplain_new_related',
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
              type: 'komplain_new_related',
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
            console.error('WebSocket notification error for new komplain related:', wsError);
          }
        }
      }
    }

    console.log(`✅ New komplain notifications sent successfully for complaint: ${komplainTitle}`);
    return true;
  } catch (error) {
    console.error('Error sending new komplain notification:', error);
    return false;
  }
};

// Send komplain new notification from owner to admin (special notification)
const sendKomplainOwnerToAdminNotification = async (komplainData, pelapor, wsService = null) => {
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

    // Notification for penerima komplain (admin) - new komplain from owner
    if (komplainData.penerima_komplain_id) {
      const penerimaKomplainUser = await User.findByPk(komplainData.penerima_komplain_id);
      if (penerimaKomplainUser) {
        const title = `🚨 Komplain Baru dari Owner: ${komplainTitle}`;
        const body = `Owner ${pelapor.nama} telah membuat komplain baru untuk Anda. Kategori: ${categoryText}. Prioritas: ${priorityText}. Target: ${formattedDate}`;
        const data = {
          type: 'komplain_owner_to_admin',
          komplain_id: komplainData.id,
          komplain_title: komplainTitle,
          priority: priority,
          category: category,
          target_date: targetDate ? targetDate.toISOString() : null,
          pelapor_id: pelapor.id,
          pelapor_name: pelapor.nama,
          pelapor_role: pelapor.role
        };

        // Send push notification
        await sendNotificationToUser(komplainData.penerima_komplain_id, title, body, data);

        // Send WebSocket notification if user is online
        if (wsService) {
          try {
            const notificationData = {
              type: 'komplain_owner_to_admin',
              komplain_id: komplainData.id,
              komplain_title: komplainTitle,
              priority: priority,
              category: category,
              target_date: targetDate ? targetDate.toISOString() : null,
              pelapor_id: pelapor.id,
              pelapor_name: pelapor.nama,
              pelapor_role: pelapor.role,
              title: title,
              body: body,
              timestamp: new Date()
            };
            
            wsService.sendNotificationToUser(komplainData.penerima_komplain_id, notificationData);
          } catch (wsError) {
            console.error('WebSocket notification error for owner to admin komplain:', wsError);
          }
        }
      }
    }

    console.log(`✅ Owner to admin komplain notification sent successfully for complaint: ${komplainTitle}`);
    return true;
  } catch (error) {
    console.error('Error sending owner to admin komplain notification:', error);
    return false;
  }
};

// Send komplain rejected notification from admin to owner
const sendKomplainRejectedNotification = async (komplainData, adminUser, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get komplain details
    const komplainTitle = komplainData.judul_komplain;
    const pelaporId = komplainData.pelapor_id;
    
    // Get pelapor user
    const pelapor = await User.findByPk(pelaporId);
    if (!pelapor) {
      console.error('Pelapor not found for komplain:', komplainData.id);
      return false;
    }

    // Notification for pelapor (owner) - komplain rejected
    const title = `❌ Komplain Ditolak: ${komplainTitle}`;
    const body = `Komplain Anda telah ditolak oleh admin ${adminUser.nama}. Silakan hubungi admin untuk informasi lebih lanjut.`;
    const data = {
      type: 'komplain_rejected',
      komplain_id: komplainData.id,
      komplain_title: komplainTitle,
      admin_id: adminUser.id,
      admin_name: adminUser.nama
    };

    // Send push notification
    await sendNotificationToUser(pelaporId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService) {
      try {
        const notificationData = {
          type: 'komplain_rejected',
          komplain_id: komplainData.id,
          komplain_title: komplainTitle,
          admin_id: adminUser.id,
          admin_name: adminUser.nama,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(pelaporId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for rejected komplain:', wsError);
      }
    }

    console.log(`✅ Komplain rejected notification sent to pelapor: ${pelapor.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending komplain rejected notification:', error);
    return false;
  }
};

// Send komplain reprocessed notification from admin to owner
const sendKomplainReprocessedNotification = async (komplainData, adminUser, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get komplain details
    const komplainTitle = komplainData.judul_komplain;
    const pelaporId = komplainData.pelapor_id;
    
    // Get pelapor user
    const pelapor = await User.findByPk(pelaporId);
    if (!pelapor) {
      console.error('Pelapor not found for komplain:', komplainData.id);
      return false;
    }

    // Notification for pelapor (owner) - komplain reprocessed
    const title = `🔄 Komplain Diproses Ulang: ${komplainTitle}`;
    const body = `Komplain Anda telah diproses ulang oleh admin ${adminUser.nama}. Status berubah dari ditolak menjadi sedang diproses.`;
    const data = {
      type: 'komplain_reprocessed',
      komplain_id: komplainData.id,
      komplain_title: komplainTitle,
      admin_id: adminUser.id,
      admin_name: adminUser.nama
    };

    // Send push notification
    await sendNotificationToUser(pelaporId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService) {
      try {
        const notificationData = {
          type: 'komplain_reprocessed',
          komplain_id: komplainData.id,
          komplain_title: komplainTitle,
          admin_id: adminUser.id,
          admin_name: adminUser.nama,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(pelaporId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for reprocessed komplain:', wsError);
      }
    }

    console.log(`✅ Komplain reprocessed notification sent to pelapor: ${pelapor.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending komplain reprocessed notification:', error);
    return false;
  }
};

// Send komplain revision request notification from owner to admin
const sendKomplainRevisionNotification = async (komplainData, ownerUser, wsService = null) => {
  try {
    const { User } = require('../models');
    const komplainTitle = komplainData.judul_komplain;
    const penerimaId = komplainData.penerima_komplain_id;
    const penerima = await User.findByPk(penerimaId);
    
    if (!penerima) {
      console.error('Penerima komplain not found for komplain:', komplainData.id);
      return false;
    }

    const title = `🔄 Permintaan Revisi: ${komplainTitle}`;
    const body = `Owner ${ownerUser.nama} meminta revisi untuk komplain "${komplainTitle}". Silakan periksa dan tindak lanjuti.`;
    const data = {
      type: 'komplain_revision_request',
      komplain_id: komplainData.id,
      komplain_title: komplainTitle,
      owner_id: ownerUser.id,
      owner_name: ownerUser.nama
    };

    // Send push notification
    await sendNotificationToUser(penerimaId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService) {
      try {
        const notificationData = {
          type: 'komplain_revision_request',
          komplain_id: komplainData.id,
          komplain_title: komplainTitle,
          owner_id: ownerUser.id,
          owner_name: ownerUser.nama,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(penerimaId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for revision request:', wsError);
      }
    }

    console.log(`✅ Revision request notification sent to penerima: ${penerima.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending komplain revision notification:', error);
    return false;
  }
};

// Send komplain completion with rating notification from owner to admin
const sendKomplainRatingNotification = async (komplainData, ownerUser, rating, komentar, wsService = null) => {
  try {
    const { User } = require('../models');
    const komplainTitle = komplainData.judul_komplain;
    const penerimaId = komplainData.penerima_komplain_id;
    const penerima = await User.findByPk(penerimaId);
    
    if (!penerima) {
      console.error('Penerima komplain not found for komplain:', komplainData.id);
      return false;
    }

    const title = `⭐ Rating Komplain: ${komplainTitle}`;
    const body = `Owner ${ownerUser.nama} memberikan rating ${rating}/5 untuk komplain "${komplainTitle}". ${komentar ? `Komentar: ${komentar}` : ''}`;
    const data = {
      type: 'komplain_rating',
      komplain_id: komplainData.id,
      komplain_title: komplainTitle,
      owner_id: ownerUser.id,
      owner_name: ownerUser.nama,
      rating: rating,
      komentar: komentar
    };

    // Send push notification
    await sendNotificationToUser(penerimaId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService) {
      try {
        const notificationData = {
          type: 'komplain_rating',
          komplain_id: komplainData.id,
          komplain_title: komplainTitle,
          owner_id: ownerUser.id,
          owner_name: ownerUser.nama,
          rating: rating,
          komentar: komentar,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(penerimaId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for rating:', wsError);
      }
    }

    console.log(`✅ Rating notification sent to penerima: ${penerima.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending komplain rating notification:', error);
    return false;
  }
};

// Send task status update notification
const sendTaskStatusUpdateNotification = async (taskData, adminUser, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get task details
    const taskTitle = taskData.judul_tugas;
    const newStatus = taskData.status;
    const pemberiTugasId = taskData.pemberi_tugas;
    
    // Get pemberi tugas user
    const pemberiTugas = await User.findByPk(pemberiTugasId);
    if (!pemberiTugas) {
      console.error('Pemberi tugas not found for task:', taskData.id);
      return false;
    }

    // Format status text
    const statusText = {
      'belum': 'Belum Dimulai',
      'proses': 'Sedang Diproses',
      'revisi': 'Perlu Revisi',
      'selesai': 'Selesai'
    }[newStatus] || 'Status Tidak Diketahui';

    // Notification for pemberi tugas (owner) - status update
    const title = `📋 Status Tugas Diperbarui: ${taskTitle}`;
    const body = `Status tugas Anda telah diperbarui menjadi "${statusText}" oleh admin ${adminUser.nama}`;
    const data = {
      type: 'task_status_update',
      task_id: taskData.id,
      task_title: taskTitle,
      new_status: newStatus,
      status_text: statusText,
      admin_id: adminUser.id,
      admin_name: adminUser.nama
    };

    // Send push notification
    await sendNotificationToUser(pemberiTugasId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService && wsService.sendNotificationToUser) {
      try {
        const notificationData = {
          type: 'task_status_update',
          task_id: taskData.id,
          task_title: taskTitle,
          new_status: newStatus,
          status_text: statusText,
          admin_id: adminUser.id,
          admin_name: adminUser.nama,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(pemberiTugasId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for task status update:', wsError);
      }
    }

    console.log(`✅ Task status update notification sent to pemberi tugas: ${pemberiTugas.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending task status update notification:', error);
    return false;
  }
};

// Send task completion notification
const sendTaskCompletionNotification = async (taskData, adminUser, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get task details
    const taskTitle = taskData.judul_tugas;
    const pemberiTugasId = taskData.pemberi_tugas;
    const catatan = taskData.catatan;
    
    // Get pemberi tugas user
    const pemberiTugas = await User.findByPk(pemberiTugasId);
    if (!pemberiTugas) {
      console.error('Pemberi tugas not found for task:', taskData.id);
      return false;
    }

    // Notification for pemberi tugas (owner) - task completed
    const title = `✅ Tugas Selesai: ${taskTitle}`;
    const body = `Tugas Anda telah selesai ditangani oleh admin ${adminUser.nama}. ${catatan ? `Catatan: ${catatan}` : ''}`;
    const data = {
      type: 'task_completed',
      task_id: taskData.id,
      task_title: taskTitle,
      admin_id: adminUser.id,
      admin_name: adminUser.nama,
      catatan: catatan
    };

    // Send push notification
    await sendNotificationToUser(pemberiTugasId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService && wsService.sendNotificationToUser) {
      try {
        const notificationData = {
          type: 'task_completed',
          task_id: taskData.id,
          task_title: taskTitle,
          admin_id: adminUser.id,
          admin_name: adminUser.nama,
          catatan: catatan,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(pemberiTugasId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for task completion:', wsError);
      }
    }

    console.log(`✅ Task completion notification sent to pemberi tugas: ${pemberiTugas.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending task completion notification:', error);
    return false;
  }
};

// Send task update notification from owner to admin
const sendTaskUpdateNotification = async (taskData, ownerUser, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get task details
    const taskTitle = taskData.judul_tugas;
    const penerimaTugasId = taskData.penerima_tugas;
    
    // Get penerima tugas user (admin)
    const penerimaTugas = await User.findByPk(penerimaTugasId);
    if (!penerimaTugas) {
      console.error('Penerima tugas not found for task:', taskData.id);
      return false;
    }

    // Notification for penerima tugas (admin) - task updated by owner
    const title = `📝 Tugas Diperbarui: ${taskTitle}`;
    const body = `Owner ${ownerUser.nama} telah memperbarui tugas yang ditugaskan kepada Anda. Silakan periksa perubahan yang ada.`;
    const data = {
      type: 'task_updated_by_owner',
      task_id: taskData.id,
      task_title: taskTitle,
      owner_id: ownerUser.id,
      owner_name: ownerUser.nama
    };

    // Send push notification
    await sendNotificationToUser(penerimaTugasId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService && wsService.sendNotificationToUser) {
      try {
        const notificationData = {
          type: 'task_updated_by_owner',
          task_id: taskData.id,
          task_title: taskTitle,
          owner_id: ownerUser.id,
          owner_name: ownerUser.nama,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(penerimaTugasId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for task update by owner:', wsError);
      }
    }

    console.log(`✅ Task update notification sent to penerima tugas: ${penerimaTugas.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending task update notification:', error);
    return false;
  }
};

// Send task deletion notification from owner to admin
const sendTaskDeletionNotification = async (taskData, ownerUser, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get task details
    const taskTitle = taskData.judul_tugas;
    const penerimaTugasId = taskData.penerima_tugas;
    
    // Get penerima tugas user (admin)
    const penerimaTugas = await User.findByPk(penerimaTugasId);
    if (!penerimaTugas) {
      console.error('Penerima tugas not found for task:', taskData.id);
      return false;
    }

    // Notification for penerima tugas (admin) - task deleted by owner
    const title = `🗑️ Tugas Dihapus: ${taskTitle}`;
    const body = `Owner ${ownerUser.nama} telah menghapus tugas yang sebelumnya ditugaskan kepada Anda.`;
    const data = {
      type: 'task_deleted_by_owner',
      task_id: taskData.id,
      task_title: taskTitle,
      owner_id: ownerUser.id,
      owner_name: ownerUser.nama
    };

    // Send push notification
    await sendNotificationToUser(penerimaTugasId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService && wsService.sendNotificationToUser) {
      try {
        const notificationData = {
          type: 'task_deleted_by_owner',
          task_id: taskData.id,
          task_title: taskTitle,
          owner_id: ownerUser.id,
          owner_name: ownerUser.nama,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(penerimaTugasId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for task deletion by owner:', wsError);
      }
    }

    console.log(`✅ Task deletion notification sent to penerima tugas: ${penerimaTugas.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending task deletion notification:', error);
    return false;
  }
};

// Send saran notification to owner
const sendSaranNotification = async (saranData, adminUser, wsService = null) => {
  try {
    const { User, UserDevice } = require('../models');
    
    // Rate limiting check
    const now = Date.now();
    const adminKey = `saran_${adminUser.id}`;
    const adminRateLimit = notificationRateLimit.get(adminKey) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    
    // Reset counter if window has passed
    if (now > adminRateLimit.resetTime) {
      adminRateLimit.count = 0;
      adminRateLimit.resetTime = now + RATE_LIMIT_WINDOW;
    }
    
    // Check if rate limit exceeded
    if (adminRateLimit.count >= MAX_NOTIFICATIONS_PER_WINDOW) {
      console.log(`⚠️ Rate limit exceeded for admin ${adminUser.nama}, skipping saran notification`);
      return false;
    }
    
    // Increment counter
    adminRateLimit.count++;
    notificationRateLimit.set(adminKey, adminRateLimit);
    
    // Get saran details
    const saranTitle = saranData.saran;
    const saranDescription = saranData.deskripsi_saran;
    const adminNama = adminUser.nama;
    
    // Get all owner users (users with role 'owner')
    const ownerUsers = await User.findAll({
      where: { 
        role: 'owner',
        status_deleted: false
      },
      attributes: ['id', 'nama', 'email']
    });

    if (ownerUsers.length === 0) {
      console.log('No owner users found for saran notification');
      return false;
    }

    // Create unique notification ID to prevent duplicates
    const notificationId = `saran_${saranData.id}_${Date.now()}`;
    
    // Send single notification to all owners (not per owner)
    const title = `💡 Saran Baru dari ${adminNama}`;
    const body = `${saranTitle}${saranDescription ? ` - ${saranDescription}` : ''}`;
    const data = {
      type: 'new_saran',
      saran_id: saranData.id,
      saran_title: saranTitle,
      saran_description: saranDescription,
      admin_id: adminUser.id,
      admin_name: adminNama,
      notification_id: notificationId, // Add unique ID
      timestamp: new Date()
    };

    // Send single push notification to all owner devices at once
    const allOwnerDevices = await UserDevice.findAll({
      where: { 
        user_id: { [require('sequelize').Op.in]: ownerUsers.map(owner => owner.id) },
        is_active: true 
      },
      attributes: ['expo_token', 'device_name', 'user_id']
    });

    if (allOwnerDevices.length > 0) {
      // Send to all devices in one batch
      const results = await Promise.all(
        allOwnerDevices.map(device => 
          sendNotificationToDevice(device.expo_token, title, body, data)
        )
      );

      const successCount = results.filter(result => result === true).length;
      console.log(`📱 Push notification sent to ${successCount}/${allOwnerDevices.length} owner devices`);
    }

    // Send single WebSocket notification only to online owners
    if (wsService && wsService.sendNotificationToUser) {
      try {
        const notificationData = {
          type: 'new_saran',
          saran_id: saranData.id,
          saran_title: saranTitle,
          saran_description: saranDescription,
          admin_id: adminUser.id,
          admin_name: adminNama,
          notification_id: notificationId, // Add unique ID
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        // Send WebSocket notification only to owner users (not broadcast to all)
        for (const owner of ownerUsers) {
          try {
            wsService.sendNotificationToUser(owner.id, notificationData);
          } catch (wsError) {
            console.error(`WebSocket notification error for owner ${owner.nama}:`, wsError);
          }
        }
        
        console.log(`🌐 WebSocket notification sent to ${ownerUsers.length} online owners`);
      } catch (wsError) {
        console.error('WebSocket notification error:', wsError);
      }
    }

    console.log(`✅ Single saran notification sent successfully to ${ownerUsers.length} owners with ID: ${notificationId}`);
    console.log(`📊 Rate limit status for admin ${adminUser.nama}: ${adminRateLimit.count}/${MAX_NOTIFICATIONS_PER_WINDOW}`);
    return true;
  } catch (error) {
    console.error('Error sending saran notification:', error);
    return false;
  }
};

// Send task priority change notification
const sendTaskPriorityChangeNotification = async (taskData, ownerUser, oldPriority, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get task details
    const taskTitle = taskData.judul_tugas;
    const penerimaTugasId = taskData.penerima_tugas;
    const newPriority = taskData.skala_prioritas;
    
    // Get penerima tugas user (admin)
    const penerimaTugas = await User.findByPk(penerimaTugasId);
    if (!penerimaTugas) {
      console.error('Penerima tugas not found for task:', taskData.id);
      return false;
    }

    // Format priority text
    const priorityText = {
      'mendesak': 'Mendesak',
      'penting': 'Penting', 
      'berproses': 'Berproses'
    };

    const oldPriorityText = priorityText[oldPriority] || oldPriority;
    const newPriorityText = priorityText[newPriority] || newPriority;

    // Notification for penerima tugas (admin) - priority changed
    const title = `⚡ Prioritas Tugas Diubah: ${taskTitle}`;
    const body = `Owner ${ownerUser.nama} telah mengubah prioritas tugas dari "${oldPriorityText}" menjadi "${newPriorityText}".`;
    const data = {
      type: 'task_priority_changed',
      task_id: taskData.id,
      task_title: taskTitle,
      owner_id: ownerUser.id,
      owner_name: ownerUser.nama,
      old_priority: oldPriority,
      new_priority: newPriority,
      old_priority_text: oldPriorityText,
      new_priority_text: newPriorityText
    };

    // Send push notification
    await sendNotificationToUser(penerimaTugasId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService && wsService.sendNotificationToUser) {
      try {
        const notificationData = {
          type: 'task_priority_changed',
          task_id: taskData.id,
          task_title: taskTitle,
          owner_id: ownerUser.id,
          owner_name: ownerUser.nama,
          old_priority: oldPriority,
          new_priority: newPriority,
          old_priority_text: oldPriorityText,
          new_priority_text: newPriorityText,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(penerimaTugasId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for task priority change:', wsError);
      }
    }

    console.log(`✅ Task priority change notification sent to penerima tugas: ${penerimaTugas.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending task priority change notification:', error);
    return false;
  }
};

// Send task status change notification to penerima tugas and pihak terkait
const sendTaskStatusChangeNotification = async (taskData, adminUser, oldStatus, newStatus, wsService = null) => {
  try {
    const { User } = require('../models');
    
    // Get task details
    const taskTitle = taskData.judul_tugas;
    const penerimaTugasId = taskData.penerima_tugas;
    
    // Format status text
    const statusText = {
      'belum': 'Belum Dimulai',
      'proses': 'Sedang Diproses',
      'revisi': 'Perlu Revisi',
      'selesai': 'Selesai'
    };
    
    const oldStatusText = statusText[oldStatus] || oldStatus;
    const newStatusText = statusText[newStatus] || newStatus;

    // Notification for penerima tugas (admin) - status changed
    if (penerimaTugasId) {
      const penerimaUser = await User.findByPk(penerimaTugasId);
      if (penerimaUser) {
        let title, body;
        
        if (newStatus === 'revisi') {
          title = `🔄 Tugas Perlu Revisi: ${taskTitle}`;
          body = `Tugas Anda telah diubah status menjadi "Perlu Revisi" oleh admin ${adminUser.nama}. Silakan periksa dan lakukan perbaikan.`;
        } else if (newStatus === 'selesai') {
          title = `✅ Tugas Selesai: ${taskTitle}`;
          body = `Tugas Anda telah selesai ditandai oleh admin ${adminUser.nama}. Status berubah dari "${oldStatusText}" menjadi "${newStatusText}".`;
        } else {
          title = `📋 Status Tugas Diubah: ${taskTitle}`;
          body = `Status tugas Anda telah diubah dari "${oldStatusText}" menjadi "${newStatusText}" oleh admin ${adminUser.nama}.`;
        }

        const data = {
          type: 'task_status_change',
          task_id: taskData.id,
          task_title: taskTitle,
          old_status: oldStatus,
          new_status: newStatus,
          old_status_text: oldStatusText,
          new_status_text: newStatusText,
          admin_id: adminUser.id,
          admin_name: adminUser.nama
        };

        // Send push notification
        await sendNotificationToUser(penerimaTugasId, title, body, data);

        // Send WebSocket notification if user is online
        if (wsService && wsService.sendNotificationToUser) {
          try {
            const notificationData = {
              type: 'task_status_change',
              task_id: taskData.id,
              task_title: taskTitle,
              old_status: oldStatus,
              new_status: newStatus,
              old_status_text: oldStatusText,
              new_status_text: newStatusText,
              admin_id: adminUser.id,
              admin_name: adminUser.nama,
              title: title,
              body: body,
              timestamp: new Date()
            };
            
            wsService.sendNotificationToUser(penerimaTugasId, notificationData);
          } catch (wsError) {
            console.error('WebSocket notification error for penerima tugas status change:', wsError);
          }
        }
      }
    }

    // Notification for pihak terkait (related parties) - status changed
    const pihakTerkait = parsePihakTerkait(taskData.pihak_terkait);
    
    for (const userId of pihakTerkait) {
      // Skip if this user is the same as penerima tugas
      if (userId === taskData.penerima_tugas) continue;
      
      const relatedUser = await User.findByPk(userId);
      if (relatedUser) {
        let title, body;
        
        if (newStatus === 'revisi') {
          title = `🔄 Tugas Terkait Perlu Revisi: ${taskTitle}`;
          body = `Tugas yang terkait dengan Anda telah diubah status menjadi "Perlu Revisi" oleh admin ${adminUser.nama}. Status berubah dari "${oldStatusText}" menjadi "${newStatusText}".`;
        } else if (newStatus === 'selesai') {
          title = `✅ Tugas Terkait Selesai: ${taskTitle}`;
          body = `Tugas yang terkait dengan Anda telah selesai ditandai oleh admin ${adminUser.nama}. Status berubah dari "${oldStatusText}" menjadi "${newStatusText}".`;
        } else {
          title = `📋 Status Tugas Terkait Diubah: ${taskTitle}`;
          body = `Status tugas yang terkait dengan Anda telah diubah dari "${oldStatusText}" menjadi "${newStatusText}" oleh admin ${adminUser.nama}.`;
        }

        const data = {
          type: 'task_related_status_change',
          task_id: taskData.id,
          task_title: taskTitle,
          old_status: oldStatus,
          new_status: newStatus,
          old_status_text: oldStatusText,
          new_status_text: newStatusText,
          admin_id: adminUser.id,
          admin_name: adminUser.nama
        };

        // Send push notification
        await sendNotificationToUser(userId, title, body, data);

        // Send WebSocket notification if user is online
        if (wsService && wsService.sendNotificationToUser) {
          try {
            const notificationData = {
              type: 'task_related_status_change',
              task_id: taskData.id,
              task_title: taskTitle,
              old_status: oldStatus,
              new_status: newStatus,
              old_status_text: oldStatusText,
              new_status_text: newStatusText,
              admin_id: adminUser.id,
              admin_name: adminUser.nama,
              title: title,
              body: body,
              timestamp: new Date()
            };
            
            wsService.sendNotificationToUser(userId, notificationData);
          } catch (wsError) {
            console.error('WebSocket notification error for pihak terkait status change:', wsError);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending task status change notification:', error);
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

// Send pengumuman notification to all active users
const sendPengumumanNotification = async (pengumumanData, ownerUser, action = 'created', wsService = null) => {
  try {
    const { UserDevice } = require('../models');
    
    // Get pengumuman details
    const pengumumanTitle = pengumumanData.judul;
    const pengumumanContent = pengumumanData.konten;
    const priority = pengumumanData.prioritas;
    const tanggalDari = new Date(pengumumanData.tanggal_berlaku_dari);
    const tanggalSampai = pengumumanData.tanggal_berlaku_sampai ? new Date(pengumumanData.tanggal_berlaku_sampai) : null;
    
    // Format priority text
    const priorityText = {
      'tinggi': 'Tinggi',
      'sedang': 'Sedang', 
      'rendah': 'Rendah'
    }[priority] || 'Sedang';
    
    // Format dates
    const formattedDateDari = tanggalDari.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const formattedDateSampai = tanggalSampai ? tanggalSampai.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) : 'Selamanya';

    // Get all active devices (all users)
    const allActiveDevices = await UserDevice.findAll({
      where: { 
        is_active: true 
      },
      attributes: ['expo_token', 'device_name', 'user_id']
    });

    if (allActiveDevices.length === 0) {
      return false;
    }

    // Determine notification content based on action
    let title, body;
    if (action === 'created') {
      title = `📢 Pengumuman Baru: ${pengumumanTitle}`;
      body = `Owner ${ownerUser.nama} telah membuat pengumuman baru. Prioritas: ${priorityText}. Berlaku: ${formattedDateDari} - ${formattedDateSampai}`;
    } else if (action === 'updated') {
      title = `📝 Pengumuman Diperbarui: ${pengumumanTitle}`;
      body = `Owner ${ownerUser.nama} telah memperbarui pengumuman. Prioritas: ${priorityText}. Berlaku: ${formattedDateDari} - ${formattedDateSampai}`;
    } else {
      title = `📢 Pengumuman: ${pengumumanTitle}`;
      body = `Owner ${ownerUser.nama} telah ${action} pengumuman. Prioritas: ${priorityText}. Berlaku: ${formattedDateDari} - ${formattedDateSampai}`;
    }

    const data = {
      type: 'pengumuman',
      action: action,
      pengumuman_id: pengumumanData.id,
      pengumuman_title: pengumumanTitle,
      pengumuman_content: pengumumanContent,
      priority: priority,
      priority_text: priorityText,
      tanggal_dari: tanggalDari.toISOString(),
      tanggal_sampai: tanggalSampai ? tanggalSampai.toISOString() : null,
      owner_id: ownerUser.id,
      owner_name: ownerUser.nama,
      owner_role: ownerUser.role
    };

    // Send push notification to all active devices
    const results = await Promise.all(
      allActiveDevices.map(device => 
        sendNotificationToDevice(device.expo_token, title, body, data)
      )
    );

    const successCount = results.filter(result => result === true).length;

    // Send WebSocket notification to all online users
    if (wsService && wsService.broadcastToAll) {
      try {
        const notificationData = {
          type: 'pengumuman',
          action: action,
          pengumuman_id: pengumumanData.id,
          pengumuman_title: pengumumanTitle,
          pengumuman_content: pengumumanContent,
          priority: priority,
          priority_text: priorityText,
          tanggal_dari: tanggalDari.toISOString(),
          tanggal_sampai: tanggalSampai ? tanggalSampai.toISOString() : null,
          owner_id: ownerUser.id,
          owner_name: ownerUser.nama,
          owner_role: ownerUser.role,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.broadcastToAll({
          type: 'notification',
          data: notificationData
        });
      } catch (wsError) {
        console.error('WebSocket notification error for pengumuman:', wsError);
      }
    }

    return successCount > 0;
  } catch (error) {
    console.error('Error sending pengumuman notification:', error);
    return false;
  }
};

// Send komplain leader note notification
const sendKomplainLeaderNoteNotification = async (pelaporId, komplainId, catatanLeader, wsService = null) => {
  try {
    const { User, DaftarKomplain } = require('../models');
    
    // Get komplain details
    const komplain = await DaftarKomplain.findByPk(komplainId);
    if (!komplain) {
      console.error('Komplain not found:', komplainId);
      return false;
    }
    
    const komplainTitle = komplain.judul_komplain;
    
    // Get pelapor user
    const pelapor = await User.findByPk(pelaporId);
    if (!pelapor) {
      console.error('Pelapor not found for komplain:', komplainId);
      return false;
    }

    // Notification for pelapor (owner) - leader note added
    const title = `📝 Catatan Leader: ${komplainTitle}`;
    const body = `Leader telah menambahkan catatan untuk komplain Anda: ${catatanLeader}`;
    const data = {
      type: 'komplain_leader_note',
      komplain_id: komplainId,
      komplain_title: komplainTitle,
      catatan_leader: catatanLeader
    };

    // Send push notification
    await sendNotificationToUser(pelaporId, title, body, data);

    // Send WebSocket notification if user is online
    if (wsService) {
      try {
        const notificationData = {
          type: 'komplain_leader_note',
          komplain_id: komplainId,
          komplain_title: komplainTitle,
          catatan_leader: catatanLeader,
          title: title,
          body: body,
          timestamp: new Date()
        };
        
        wsService.sendNotificationToUser(pelaporId, notificationData);
      } catch (wsError) {
        console.error('WebSocket notification error for leader note:', wsError);
      }
    }

    console.log(`✅ Komplain leader note notification sent to pelapor: ${pelapor.nama}`);
    return true;
  } catch (error) {
    console.error('Error sending komplain leader note notification:', error);
    return false;
  }
};

module.exports = {
  sendNotificationToDevice,
  sendNotificationToUser,
  sendChatNotification,
  sendTaskNotification,
  sendKomplainNotification,
  sendKomplainNewNotification,
  sendKomplainOwnerToAdminNotification,
  sendKomplainStatusUpdateNotification,
  sendKomplainCompletionNotification,
  sendKomplainAdminNoteNotification,
  sendKomplainLeaderNoteNotification,
  sendKomplainRejectedNotification,
  sendKomplainReprocessedNotification,
  sendKomplainRevisionNotification,
  sendKomplainRatingNotification,
  sendTaskStatusUpdateNotification,
  sendTaskCompletionNotification,
  sendTaskUpdateNotification,
  sendTaskDeletionNotification,
  sendTaskPriorityChangeNotification,
  sendTaskStatusChangeNotification,
  sendPengumumanNotification,
  sendSaranNotification,
  checkNotificationReceipts
}; 