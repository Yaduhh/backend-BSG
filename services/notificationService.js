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
    if (komplainData.pihak_terkait && Array.isArray(komplainData.pihak_terkait)) {
      for (const userId of komplainData.pihak_terkait) {
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
    if (wsService) {
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
    if (wsService) {
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
  sendKomplainNewNotification,
  sendKomplainOwnerToAdminNotification,
  sendKomplainStatusUpdateNotification,
  sendKomplainCompletionNotification,
  sendKomplainAdminNoteNotification,
  sendKomplainRejectedNotification,
  sendKomplainReprocessedNotification,
  sendKomplainRevisionNotification,
  sendKomplainRatingNotification,
  sendTaskStatusUpdateNotification,
  sendTaskCompletionNotification,
  checkNotificationReceipts
}; 