# Admin Profile API Documentation

## Overview
API untuk mengelola profil admin, termasuk mendapatkan data profil, mengupdate profil, mengubah password, dan mendapatkan statistik admin.

## Base URL
```
/api/admin
```

## Authentication
Semua endpoint memerlukan authentication token dan role admin.

## Endpoints

### 1. GET /profile
Mendapatkan profil admin beserta statistik.

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Profil admin berhasil diambil",
  "data": {
    "id": 1,
    "nama": "Admin Name",
    "username": "admin",
    "email": "admin@bosgil.com",
    "status": "active",
    "role": "admin",
    "training_dasar": false,
    "training_leadership": false,
    "training_skill": false,
    "training_lanjutan": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "stats": {
      "totalTugas": 25,
      "activeChats": 8,
      "totalKeuangan": 15,
      "totalUsers": 50,
      "pendingTugas": 5,
      "ongoingTugas": 10,
      "completedTugas": 10
    }
  }
}
```

### 2. PUT /profile
Mengupdate profil admin.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "nama": "New Admin Name",
  "email": "newadmin@bosgil.com",
  "username": "newadmin"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Profil admin berhasil diperbarui",
  "data": {
    "id": 1,
    "nama": "New Admin Name",
    "username": "newadmin",
    "email": "newadmin@bosgil.com",
    "status": "active",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation Errors (400):**
- Nama, email, dan username harus diisi
- Format email tidak valid
- Username hanya boleh berisi huruf, angka, dan underscore
- Email sudah digunakan oleh user lain
- Username sudah digunakan oleh user lain

### 3. PUT /change-password
Mengubah password admin.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword",
  "confirmPassword": "newpassword"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Password berhasil diubah"
}
```

**Validation Errors (400):**
- Semua field password harus diisi
- Password baru dan konfirmasi password tidak cocok
- Password baru minimal 6 karakter
- Password saat ini tidak valid

### 4. GET /stats
Mendapatkan statistik admin.

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Statistik admin berhasil diambil",
  "data": {
    "totalTugas": 25,
    "activeChats": 8,
    "totalKeuangan": 15,
    "totalUsers": 50,
    "pendingTugas": 5,
    "ongoingTugas": 10,
    "completedTugas": 10
  }
}
```

### 5. GET /activity-history
Mendapatkan riwayat aktivitas admin.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Halaman yang diminta (default: 1)
- `limit` (optional): Jumlah item per halaman (default: 10)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Riwayat aktivitas berhasil diambil",
  "data": {
    "activities": [
      {
        "id": 1,
        "activity": "Login ke sistem",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "type": "login"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### 6. GET /settings
Mendapatkan pengaturan admin.

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Pengaturan admin berhasil diambil",
  "data": {
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "privacy": {
      "showOnlineStatus": true,
      "showLastSeen": true
    },
    "theme": {
      "mode": "light",
      "primaryColor": "#DC2626"
    }
  }
}
```

### 7. PUT /settings
Mengupdate pengaturan admin.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "notifications": {
    "email": true,
    "push": false,
    "sms": false
  },
  "privacy": {
    "showOnlineStatus": false,
    "showLastSeen": true
  },
  "theme": {
    "mode": "dark",
    "primaryColor": "#DC2626"
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Pengaturan admin berhasil diperbarui",
  "data": {
    "notifications": {
      "email": true,
      "push": false,
      "sms": false
    },
    "privacy": {
      "showOnlineStatus": false,
      "showLastSeen": true
    },
    "theme": {
      "mode": "dark",
      "primaryColor": "#DC2626"
    }
  }
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token tidak valid atau expired"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Akses ditolak. Hanya admin yang dapat mengakses endpoint ini."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Terjadi kesalahan pada server",
  "error": "Error details"
}
```

## Notes
- Semua endpoint memerlukan role admin
- Password akan di-hash menggunakan bcrypt sebelum disimpan
- Statistik dihitung secara real-time dari database
- Riwayat aktivitas masih menggunakan data dummy (perlu implementasi tabel ActivityLog)
- Pengaturan masih menggunakan data default (perlu implementasi tabel Settings) 