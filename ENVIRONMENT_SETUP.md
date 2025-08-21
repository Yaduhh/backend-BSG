# Environment Setup untuk Backend Bosgil Group

## 🚨 **Masalah IP Address Lama**

Backend masih menggunakan IP address lama `192.168.0.104` karena environment variable yang tidak ter-set dengan benar.

## 🔧 **Solusi 1: Menggunakan Script (Recommended)**

### **Untuk Windows Command Prompt:**
```cmd
# Jalankan file batch
set-env.bat

# Kemudian jalankan backend
npm run dev
```

### **Untuk Windows PowerShell:**
```powershell
# Jalankan file PowerShell
.\set-env.ps1

# Kemudian jalankan backend
npm run dev
```

## 🔧 **Solusi 2: Set Environment Variable Manual**

### **Untuk Windows Command Prompt:**
```cmd
set API_BASE_URL=http://192.168.0.104:3000
set FRONTEND_URL=http://192.168.0.104:5173
set DB_HOST=192.168.0.104
set NODE_ENV=development

npm run dev
```

### **Untuk Windows PowerShell:**
```powershell
$env:API_BASE_URL = "http://192.168.0.104:3000"
$env:FRONTEND_URL = "http://192.168.0.104:5173"
$env:DB_HOST = "192.168.0.104"
$env:NODE_ENV = "development"

npm run dev
```

## 🔧 **Solusi 3: Set Environment Variable Permanen**

### **Untuk Windows:**
1. Buka **System Properties** → **Environment Variables**
2. Di **User Variables**, tambahkan:
   - `API_BASE_URL` = `http://192.168.0.104:3000`
   - `FRONTEND_URL` = `http://192.168.0.104:5173`
   - `DB_HOST` = `192.168.0.104`
   - `NODE_ENV` = `development`
3. Restart terminal/command prompt
4. Jalankan `npm run dev`

## 📍 **IP Address yang Benar:**

- **Backend API**: `http://192.168.0.104:3000`
- **Frontend**: `http://192.168.0.104:5173`
- **Database**: `192.168.0.104:3306`

## 🚀 **Cara Test:**

Setelah set environment variable, jalankan:
```bash
npm run dev
```

Seharusnya output:
```
🚀 Server berhasil dijalankan!
📡 HTTP API: http://192.168.0.104:3000
🔌 WebSocket: ws://192.168.0.104:3000
📊 Health Check: http://192.168.0.104:3000/api/health
👥 Users API: http://192.168.0.104:3000/api/users
```

## ❓ **Troubleshooting:**

Jika masih muncul IP lama:
1. Pastikan environment variable sudah ter-set
2. Restart terminal/command prompt
3. Cek dengan `echo %API_BASE_URL%` (CMD) atau `$env:API_BASE_URL` (PowerShell)
4. Pastikan tidak ada file `.env` yang override
