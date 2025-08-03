# Struktur Project Backend

## 📁 Struktur Folder

```
backend/
├── config/                 # Konfigurasi aplikasi
│   ├── database.js        # Konfigurasi database
│   └── associations.js    # Setup associations database
├── middleware/            # Middleware Express
│   ├── index.js          # Setup semua middleware
│   ├── cors.js           # CORS configuration
│   └── errorHandler.js   # Error handling middleware
├── models/               # Model database (Sequelize)
│   ├── User.js
│   ├── Order.js
│   └── Notification.js
├── routes/               # Route handlers
│   ├── index.js          # Router utama
│   ├── health.js         # Health check routes
│   ├── orders.js         # Order CRUD routes
│   └── notifications.js  # Notification routes
├── services/             # Business logic
│   └── socketService.js  # WebSocket service
├── app.js               # Express app setup
├── server.js            # Server entry point
├── package.json
└── README.md
```

## 🏗️ Arsitektur

### 1. **Entry Point** (`server.js`)
- File utama untuk menjalankan server
- Hanya berisi logic untuk start server dan database sync
- Clean dan minimal

### 2. **App Setup** (`app.js`)
- Setup Express application
- Konfigurasi middleware dan routes
- Setup Socket.IO
- Setup database associations

### 3. **Routes** (`routes/`)
- Terorganisir berdasarkan feature
- Setiap route file fokus pada satu domain
- Menggunakan Express Router

### 4. **Middleware** (`middleware/`)
- CORS configuration
- Error handling
- Body parsing
- Centralized middleware setup

### 5. **Services** (`services/`)
- Business logic terpisah dari routes
- WebSocket service untuk real-time features
- Reusable functions

### 6. **Config** (`config/`)
- Database configuration
- Associations setup
- Environment variables

## 🚀 Keuntungan Struktur Baru

1. **Separation of Concerns**: Setiap file punya tanggung jawab spesifik
2. **Maintainability**: Mudah untuk maintain dan debug
3. **Scalability**: Mudah untuk menambah fitur baru
4. **Testability**: Mudah untuk unit testing
5. **Readability**: Kode lebih mudah dibaca dan dipahami

## 📋 Best Practices yang Diterapkan

1. **Modular Structure**: Kode terpisah dalam modul-modul kecil
2. **Single Responsibility**: Setiap file punya satu tanggung jawab
3. **Dependency Injection**: Io instance diinjeksi ke routes
4. **Error Handling**: Centralized error handling
5. **Configuration Management**: Konfigurasi terpisah dari logic

## 🔧 Cara Menjalankan

```bash
# Install dependencies
npm install

# Jalankan server
npm start

# Development mode
npm run dev
```

## 📡 API Endpoints

- `GET /api/health` - Health check
- `GET /api/status` - Server status
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark notification as read 