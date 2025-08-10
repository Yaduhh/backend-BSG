# API Notifikasi Tugas Real-Time

Dokumentasi ini menjelaskan implementasi notifikasi real-time untuk perubahan tugas menggunakan WebSocket.

## Overview

Sistem notifikasi tugas memungkinkan owner dan admin untuk menerima notifikasi real-time ketika ada perubahan pada tugas yang relevan dengan mereka.

## Jenis Notifikasi

### 1. Notifikasi Perubahan Status Tugas (Admin → Owner)
- **Trigger**: Admin mengubah status tugas
- **Penerima**: Owner (pemberi tugas)
- **Tipe**: `task_status_update`
- **Contoh**: "Status tugas 'Laporan Bulanan' telah diperbarui menjadi 'Sedang Diproses' oleh admin John Doe"

### 2. Notifikasi Penyelesaian Tugas (Admin → Owner)
- **Trigger**: Admin menandai tugas sebagai selesai
- **Penerima**: Owner (pemberi tugas)
- **Tipe**: `task_completed`
- **Contoh**: "Tugas 'Laporan Bulanan' telah selesai ditangani oleh admin John Doe"

### 3. Notifikasi Perubahan Tugas oleh Owner (Owner → Admin)
- **Trigger**: Owner mengubah detail tugas
- **Penerima**: Admin (penerima tugas)
- **Tipe**: `task_updated_by_owner`
- **Contoh**: "Owner Jane Smith telah memperbarui tugas 'Laporan Bulanan' yang ditugaskan kepada Anda"

### 4. Notifikasi Penghapusan Tugas oleh Owner (Owner → Admin)
- **Trigger**: Owner menghapus tugas
- **Penerima**: Admin (penerima tugas)
- **Tipe**: `task_deleted_by_owner`
- **Contoh**: "Owner Jane Smith telah menghapus tugas 'Laporan Bulanan' yang sebelumnya ditugaskan kepada Anda"

### 5. Notifikasi Perubahan Prioritas Tugas (Owner → Admin)
- **Trigger**: Owner mengubah prioritas tugas
- **Penerima**: Admin (penerima tugas)
- **Tipe**: `task_priority_changed`
- **Contoh**: "Owner Jane Smith telah mengubah prioritas tugas 'Laporan Bulanan' dari 'Penting' menjadi 'Mendesak'"

## Implementasi Backend

### Service: notificationService.js

```javascript
// Notifikasi perubahan status tugas
const sendTaskStatusUpdateNotification = async (taskData, adminUser, wsService = null)

// Notifikasi penyelesaian tugas
const sendTaskCompletionNotification = async (taskData, adminUser, wsService = null)

// Notifikasi perubahan tugas oleh owner
const sendTaskUpdateNotification = async (taskData, ownerUser, wsService = null)

// Notifikasi penghapusan tugas oleh owner
const sendTaskDeletionNotification = async (taskData, ownerUser, wsService = null)

// Notifikasi perubahan prioritas tugas
const sendTaskPriorityChangeNotification = async (taskData, ownerUser, oldPriority, wsService = null)
```

### Routes yang Diperbarui

#### daftarTugas.js (Owner Routes)
- **PUT** `/daftar-tugas/:id` - Mengirim notifikasi saat owner mengubah tugas
- **DELETE** `/daftar-tugas/:id` - Mengirim notifikasi saat owner menghapus tugas

#### adminTugas.js (Admin Routes)
- **PUT** `/admin/tugas/:id` - Mengirim notifikasi saat admin mengubah status tugas

### WebSocket Service

```javascript
// Mengirim notifikasi ke user tertentu
const sendNotificationToUser = (userId, notificationData)

// Tipe notifikasi otomatis ditentukan berdasarkan data.type
// - Jika dimulai dengan 'task_' → tipe 'task_notification'
// - Jika tidak → tipe 'chat_notification'
```

## Implementasi Frontend

### Service: taskNotificationService.js

```javascript
// Mendengarkan notifikasi tugas
const unsubscribe = taskNotificationService.onTaskNotification((notificationData) => {
  // Handle notification
});

// Membersihkan listener
unsubscribe();
```

### Socket Service: socketService.js

```javascript
// Handler untuk notifikasi tugas
case 'task_notification':
  this.handleTaskNotification(data.data);
  break;
```

## Format Data Notifikasi

### Struktur Umum
```json
{
  "type": "task_status_update",
  "task_id": 123,
  "task_title": "Laporan Bulanan",
  "title": "📋 Status Tugas Diperbarui: Laporan Bulanan",
  "body": "Status tugas Anda telah diperbarui menjadi 'Sedang Diproses' oleh admin John Doe",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "admin_id": 456,
  "admin_name": "John Doe",
  "new_status": "proses",
  "status_text": "Sedang Diproses"
}
```

### Tipe Spesifik

#### task_status_update
```json
{
  "type": "task_status_update",
  "task_id": 123,
  "task_title": "Laporan Bulanan",
  "admin_id": 456,
  "admin_name": "John Doe",
  "new_status": "proses",
  "status_text": "Sedang Diproses"
}
```

#### task_completed
```json
{
  "type": "task_completed",
  "task_id": 123,
  "task_title": "Laporan Bulanan",
  "admin_id": 456,
  "admin_name": "John Doe",
  "catatan": "Laporan telah selesai dan dikirim ke email"
}
```

#### task_updated_by_owner
```json
{
  "type": "task_updated_by_owner",
  "task_id": 123,
  "task_title": "Laporan Bulanan",
  "owner_id": 789,
  "owner_name": "Jane Smith"
}
```

#### task_deleted_by_owner
```json
{
  "type": "task_deleted_by_owner",
  "task_id": 123,
  "task_title": "Laporan Bulanan",
  "owner_id": 789,
  "owner_name": "Jane Smith"
}
```

#### task_priority_changed
```json
{
  "type": "task_priority_changed",
  "task_id": 123,
  "task_title": "Laporan Bulanan",
  "owner_id": 789,
  "owner_name": "Jane Smith",
  "old_priority": "penting",
  "new_priority": "mendesak",
  "old_priority_text": "Penting",
  "new_priority_text": "Mendesak"
}
```

## Penggunaan di Screen

### DaftarTugasScreen.js
```javascript
useEffect(() => {
  // Listen to task notifications
  const unsubscribe = taskNotificationService.onTaskNotification((notificationData) => {
    switch (notificationData.type) {
      case 'task_status_update':
      case 'task_completed':
      case 'task_updated_by_owner':
      case 'task_deleted_by_owner':
      case 'task_priority_changed':
        // Refresh task list
        fetchTugas();
        break;
    }
  });
  
  return () => unsubscribe();
}, []);
```

## Testing

### Test Notifikasi
1. Owner membuat tugas baru
2. Admin mengubah status tugas
3. Owner mengubah detail tugas
4. Owner menghapus tugas
5. Owner mengubah prioritas tugas

### Verifikasi
- Notifikasi muncul di frontend
- Data notifikasi sesuai dengan perubahan
- UI ter-update secara real-time
- Tidak ada error di console

## Troubleshooting

### Notifikasi Tidak Muncul
1. Periksa koneksi WebSocket
2. Periksa console backend untuk error
3. Periksa console frontend untuk error
4. Pastikan user online dan terhubung ke WebSocket

### Error di Backend
1. Periksa log error di console
2. Pastikan wsService tersedia di route
3. Periksa struktur data notifikasi
4. Pastikan user exists di database

### Error di Frontend
1. Periksa koneksi WebSocket
2. Periksa listener notifikasi
3. Periksa format data notifikasi
4. Pastikan service diimport dengan benar
