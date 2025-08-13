# Admin Change Password API Documentation

## Overview
API untuk mengubah password admin dengan validasi keamanan yang ketat.

## Base URL
```
PUT /api/admin/change-password
```

## Authentication
Membutuhkan JWT token dengan role admin dalam header Authorization:
```
Authorization: Bearer <jwt_token>
```

## Request Body
```json
{
  "currentPassword": "string",
  "newPassword": "string", 
  "confirmPassword": "string"
}
```

### Field Descriptions
- `currentPassword` (required): Password saat ini
- `newPassword` (required): Password baru yang diinginkan
- `confirmPassword` (required): Konfirmasi password baru

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Password berhasil diubah"
}
```

### Error Responses

#### 400 - Bad Request
```json
{
  "success": false,
  "message": "Semua field password harus diisi"
}
```

```json
{
  "success": false,
  "message": "Password baru dan konfirmasi password tidak cocok"
}
```

```json
{
  "success": false,
  "message": "Password baru minimal 6 karakter"
}
```

```json
{
  "success": false,
  "message": "Password saat ini tidak valid"
}
```

```json
{
  "success": false,
  "message": "Password baru tidak boleh sama dengan password lama"
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Token tidak valid atau tidak ditemukan"
}
```

#### 403 - Forbidden
```json
{
  "success": false,
  "message": "Akses ditolak. Hanya admin yang dapat mengakses endpoint ini"
}
```

#### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Terjadi kesalahan saat mengubah password",
  "error": "Error details"
}
```

## Validation Rules

1. **Required Fields**: Semua field (currentPassword, newPassword, confirmPassword) harus diisi
2. **Password Length**: Password baru minimal 6 karakter
3. **Password Match**: Password baru dan konfirmasi password harus sama
4. **Current Password**: Password saat ini harus valid
5. **Different Password**: Password baru tidak boleh sama dengan password lama
6. **Admin Role**: Hanya user dengan role admin yang dapat mengakses

## Security Features

1. **Password Hashing**: Password baru di-hash menggunakan bcrypt dengan salt rounds 10
2. **Current Password Verification**: Memverifikasi password lama sebelum mengubah
3. **Duplicate Prevention**: Mencegah penggunaan password yang sama
4. **JWT Authentication**: Memastikan hanya admin yang dapat mengakses
5. **Input Validation**: Validasi ketat untuk semua input

## Example Usage

### cURL
```bash
curl -X PUT \
  http://192.168.38.223:3000/api/admin/change-password \
  -H 'Authorization: Bearer <jwt_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword123",
    "confirmPassword": "newpassword123"
  }'
```

### JavaScript (Axios)
```javascript
const response = await axios.put('/api/admin/change-password', {
  currentPassword: 'oldpassword123',
  newPassword: 'newpassword123',
  confirmPassword: 'newpassword123'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Notes

- Setelah password berhasil diubah, user sebaiknya logout dan login kembali untuk keamanan
- Password lama akan dihapus dan diganti dengan hash dari password baru
- Tidak ada response data yang dikembalikan untuk alasan keamanan
- Semua operasi password menggunakan bcrypt untuk keamanan maksimal 