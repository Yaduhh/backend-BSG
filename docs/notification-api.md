# Notification API Documentation

## Overview
API untuk mengelola sistem notifikasi broadcast yang memungkinkan owner mengirim notifikasi ke semua user, user tertentu, atau berdasarkan role.

## Base URL
```
/api/notifications
```

## Authentication
Semua endpoint memerlukan authentication token di header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Send Notification to All Users
**POST** `/send-to-all`

Mengirim notifikasi ke semua user yang aktif.

#### Request Body
```json
{
  "title": "Pengumuman Penting!",
  "message": "Ada update fitur baru yang menarik!",
  "description": "Detail lebih lanjut tentang notifikasi...",
  "priority": "medium",
  "category": "general"
}
```

#### Parameters
- `title` (string, required): Judul notifikasi (max 255 karakter)
- `message` (string, required): Pesan notifikasi
- `description` (string, optional): Deskripsi tambahan
- `priority` (string, optional): Prioritas notifikasi (`low`, `medium`, `high`, `urgent`) - default: `medium`
- `category` (string, optional): Kategori notifikasi - default: `general`

#### Response
```json
{
  "success": true,
  "message": "Notifikasi berhasil dikirim ke semua user",
  "data": {
    "notificationId": 1,
    "sentCount": 25,
    "notification": {
      "id": 1,
      "title": "Pengumuman Penting!",
      "message": "Ada update fitur baru yang menarik!",
      "description": "Detail lebih lanjut tentang notifikasi...",
      "priority": "medium",
      "category": "general",
      "sentAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 2. Send Notification to Specific Users
**POST** `/send-to-users`

Mengirim notifikasi ke user tertentu berdasarkan ID.

#### Request Body
```json
{
  "userIds": [1, 2, 3, 4],
  "title": "Notifikasi Khusus",
  "message": "Pesan khusus untuk user terpilih",
  "description": "Deskripsi tambahan...",
  "priority": "high",
  "category": "announcement"
}
```

#### Parameters
- `userIds` (array, required): Array ID user yang akan menerima notifikasi
- `title` (string, required): Judul notifikasi
- `message` (string, required): Pesan notifikasi
- `description` (string, optional): Deskripsi tambahan
- `priority` (string, optional): Prioritas notifikasi
- `category` (string, optional): Kategori notifikasi

#### Response
```json
{
  "success": true,
  "message": "Notifikasi berhasil dikirim ke 4 user",
  "data": {
    "notificationId": 2,
    "sentCount": 4,
    "notification": {
      "id": 2,
      "title": "Notifikasi Khusus",
      "message": "Pesan khusus untuk user terpilih",
      "description": "Deskripsi tambahan...",
      "priority": "high",
      "category": "announcement",
      "sentAt": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

---

### 3. Send Notification to Role
**POST** `/send-to-role`

Mengirim notifikasi ke semua user dengan role tertentu.

#### Request Body
```json
{
  "role": "admin",
  "title": "Update untuk Admin",
  "message": "Informasi penting untuk tim admin",
  "description": "Detail update...",
  "priority": "urgent",
  "category": "system"
}
```

#### Parameters
- `role` (string, required): Role target (`owner`, `admin`, `leader`, `divisi`)
- `title` (string, required): Judul notifikasi
- `message` (string, required): Pesan notifikasi
- `description` (string, optional): Deskripsi tambahan
- `priority` (string, optional): Prioritas notifikasi
- `category` (string, optional): Kategori notifikasi

#### Response
```json
{
  "success": true,
  "message": "Notifikasi berhasil dikirim ke 5 user dengan role admin",
  "data": {
    "notificationId": 3,
    "sentCount": 5,
    "notification": {
      "id": 3,
      "title": "Update untuk Admin",
      "message": "Informasi penting untuk tim admin",
      "description": "Detail update...",
      "priority": "urgent",
      "category": "system",
      "sentAt": "2024-01-15T10:40:00.000Z"
    }
  }
}
```

---

### 4. Get Notification History
**GET** `/history`

Mengambil riwayat notifikasi yang telah dikirim.

#### Query Parameters
- `page` (number, optional): Halaman - default: 1
- `limit` (number, optional): Jumlah item per halaman - default: 10
- `status` (string, optional): Filter berdasarkan status (`draft`, `sent`, `failed`, `cancelled`)
- `priority` (string, optional): Filter berdasarkan prioritas (`low`, `medium`, `high`, `urgent`)
- `category` (string, optional): Filter berdasarkan kategori

#### Example Request
```
GET /api/notifications/history?page=1&limit=10&status=sent&priority=high
```

#### Response
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "title": "Pengumuman Penting!",
        "message": "Ada update fitur baru yang menarik!",
        "description": "Detail lebih lanjut tentang notifikasi...",
        "sender_name": "John Doe",
        "sender_role": "owner",
        "target_type": "all_users",
        "target_role": null,
        "priority": "medium",
        "category": "general",
        "status": "sent",
        "sent_count": 25,
        "sent_at": "2024-01-15T10:30:00.000Z",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
```

---

### 5. Get User Notifications
**GET** `/user/:userId`

Mengambil notifikasi untuk user tertentu.

#### Path Parameters
- `userId` (number, required): ID user

#### Query Parameters
- `page` (number, optional): Halaman - default: 1
- `limit` (number, optional): Jumlah item per halaman - default: 20
- `isRead` (boolean, optional): Filter berdasarkan status baca (`true`/`false`)

#### Example Request
```
GET /api/notifications/user/1?page=1&limit=20&isRead=false
```

#### Response
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "notification_id": 1,
        "user_id": 1,
        "is_read": false,
        "read_at": null,
        "push_sent": true,
        "push_sent_at": "2024-01-15T10:30:05.000Z",
        "created_at": "2024-01-15T10:30:00.000Z",
        "notification": {
          "id": 1,
          "title": "Pengumuman Penting!",
          "message": "Ada update fitur baru yang menarik!",
          "description": "Detail lebih lanjut tentang notifikasi...",
          "sender_name": "John Doe",
          "sender_role": "owner",
          "priority": "medium",
          "category": "general",
          "sent_at": "2024-01-15T10:30:00.000Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 20
    }
  }
}
```

---

### 6. Mark Notification as Read
**PUT** `/:id/read`

Menandai notifikasi sebagai sudah dibaca.

#### Path Parameters
- `id` (number, required): ID notifikasi

#### Response
```json
{
  "success": true,
  "message": "Notifikasi berhasil ditandai sebagai dibaca"
}
```

---

### 7. Mark All Notifications as Read
**PUT** `/user/:userId/read-all`

Menandai semua notifikasi user sebagai sudah dibaca.

#### Path Parameters
- `userId` (number, required): ID user

#### Response
```json
{
  "success": true,
  "message": "15 notifikasi berhasil ditandai sebagai dibaca"
}
```

---

### 8. Delete Notification
**DELETE** `/:id`

Menghapus notifikasi (hanya owner atau pembuat notifikasi).

#### Path Parameters
- `id` (number, required): ID notifikasi

#### Response
```json
{
  "success": true,
  "message": "Notifikasi berhasil dihapus"
}
```

---

### 9. Get Notification Statistics
**GET** `/stats`

Mengambil statistik notifikasi.

#### Response
```json
{
  "success": true,
  "data": {
    "sentNotifications": {
      "total": 50,
      "sent": 45,
      "draft": 5
    },
    "userNotifications": {
      "total": 25,
      "read": 20,
      "unread": 5
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Judul dan pesan notifikasi wajib diisi"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Anda tidak memiliki akses untuk melihat notifikasi user ini"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Notifikasi tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Terjadi kesalahan saat mengirim notifikasi"
}
```

---

## Database Schema

### notifications table
```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  description TEXT NULL,
  sender_id INT NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_role ENUM('owner', 'admin', 'leader', 'divisi') NOT NULL DEFAULT 'owner',
  target_type ENUM('all_users', 'specific_users', 'role_based') NOT NULL DEFAULT 'all_users',
  target_users JSON NULL,
  target_role VARCHAR(50) NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  metadata JSON NULL,
  status ENUM('draft', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'draft',
  scheduled_at DATETIME NULL,
  sent_at DATETIME NULL,
  sent_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### user_notifications table
```sql
CREATE TABLE user_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at DATETIME NULL,
  device_token VARCHAR(500) NULL,
  push_sent BOOLEAN NOT NULL DEFAULT FALSE,
  push_sent_at DATETIME NULL,
  push_failed BOOLEAN NOT NULL DEFAULT FALSE,
  push_error TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_notification_user (notification_id, user_id),
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Usage Examples

### Frontend Integration
```javascript
// Send notification to all users
const sendNotification = async (title, message, description) => {
  try {
    const response = await fetch('/api/notifications/send-to-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        message,
        description,
        priority: 'medium',
        category: 'general'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      console.log(`Notification sent to ${result.data.sentCount} users`);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Get user notifications
const getUserNotifications = async (userId, page = 1) => {
  try {
    const response = await fetch(`/api/notifications/user/${userId}?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    return result.data.notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};
```
