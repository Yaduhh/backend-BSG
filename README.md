# Backend Express.js dengan WebSocket

Server Express.js dengan integrasi WebSocket untuk fitur realtime notifikasi.

## 🚀 Fitur

- **HTTP API** - REST API untuk CRUD operations
- **WebSocket** - Realtime notifikasi dan chat
- **CORS** - Cross-origin resource sharing
- **Error Handling** - Comprehensive error handling
- **Health Check** - Monitoring server status

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "socket.io": "^4.7.2", 
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
- Buat file `.env` sesuai konfigurasi di atas
- Pastikan MySQL server berjalan
- Buat database `bosgil_db`

### 3. Jalankan Server
```bash
# Development mode (dengan auto-reload)
npm run dev

# Production mode
npm start
```

### 4. Test Server
```bash
# Health check
curl http://localhost:3000/api/health

# Server status
curl http://localhost:3000/api/status
```

## 📡 API Endpoints

### HTTP Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check server |
| GET | `/api/status` | Server status & connected clients |
| GET | `/api/orders` | Get semua orders |
| POST | `/api/orders` | Buat order baru |
| PUT | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Hapus order |

### WebSocket Events

| Event | Description |
|-------|-------------|
| `user_login` | User login dengan userId |
| `join_room` | Join room untuk notifikasi |
| `leave_room` | Leave room |
| `send_notification` | Kirim notifikasi ke user tertentu |
| `broadcast_notification` | Broadcast ke semua user |
| `chat_message` | Kirim pesan chat |

## 🔌 WebSocket Events

### Client → Server
```javascript
// Login user
socket.emit('user_login', userId);

// Join room
socket.emit('join_room', 'room_name');

// Send notification
socket.emit('send_notification', {
  userId: 'target_user_id',
  message: 'Pesan notifikasi',
  type: 'info'
});

// Broadcast notification
socket.emit('broadcast_notification', {
  message: 'Pesan untuk semua user',
  type: 'warning'
});

// Send chat message
socket.emit('chat_message', {
  sender: 'user_id',
  message: 'Pesan chat',
  room: 'room_name'
});
```

### Server → Client
```javascript
// Welcome message
socket.on('welcome', (data) => {
  console.log(data.message);
});

// New notification
socket.on('new_notification', (data) => {
  console.log('Notifikasi baru:', data);
});

// New order
socket.on('new_order', (order) => {
  console.log('Order baru:', order);
});

// Order updated
socket.on('order_updated', (order) => {
  console.log('Order diupdate:', order);
});

// Order deleted
socket.on('order_deleted', (data) => {
  console.log('Order dihapus:', data.id);
});

// New chat message
socket.on('new_message', (message) => {
  console.log('Pesan baru:', message);
});
```

## 🧪 Testing

### Test HTTP API
```bash
# Health check
curl http://localhost:3000/api/health

# Get orders
curl http://localhost:3000/api/orders

# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customer":"John Doe","amount":150000}'
```

### Test WebSocket
Gunakan tools seperti:
- [Socket.IO Tester](https://chrome.google.com/webstore/detail/socket-io-tester/cgmimdpepcncnjgclhnhghdooepcnl)
- [wscat](https://github.com/websockets/wscat)
- Browser console

## 📊 Monitoring

- **Health Check**: `http://localhost:3000/api/health`
- **Server Status**: `http://localhost:3000/api/status`

## 🔧 Environment Variables

Buat file `.env` di folder `backend/` dengan konfigurasi berikut:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bosgil_db
DB_USER=root
DB_PASSWORD=
DB_DIALECT=mysql

# JWT Configuration (untuk authentication nanti)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# WebSocket Configuration
WS_CORS_ORIGIN=*
```

### 📝 Penjelasan Konfigurasi:

**Server Configuration:**
- `PORT=3000` - Port server (bisa diubah sesuai kebutuhan)
- `NODE_ENV=development` - Environment (development/production)

**Database Configuration:**
- `DB_HOST=localhost` - Host MySQL server
- `DB_PORT=3306` - Port MySQL (default 3306)
- `DB_NAME=bosgil_db` - Nama database (buat dulu di MySQL)
- `DB_USER=root` - Username MySQL
- `DB_PASSWORD=` - Password MySQL (kosong jika tidak ada password)
- `DB_DIALECT=mysql` - Jenis database

**JWT Configuration:**
- `JWT_SECRET=your_jwt_secret_key_here` - Secret key untuk JWT (ganti dengan random string)
- `JWT_EXPIRES_IN=24h` - Expired time JWT

**WebSocket Configuration:**
- `WS_CORS_ORIGIN=*` - CORS origin untuk WebSocket

## 🗄️ Database Setup

### 1. Install MySQL
Pastikan MySQL sudah terinstall di komputer Anda.

### 2. Buat Database
```sql
-- Login ke MySQL
mysql -u root -p

-- Buat database
CREATE DATABASE bosgil_db;

-- Cek database
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

### 3. Konfigurasi Database
- Pastikan MySQL server berjalan
- Sesuaikan konfigurasi di file `.env`
- Jika ada password MySQL, isi `DB_PASSWORD=your_password`

## 🚀 Deployment

```bash
# Install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export PORT=3000

# Start server
npm start
```

## 📝 Logs

Server akan menampilkan log:
- 🔌 User connected/disconnected
- 👤 User login/logout
- 📢 Notifikasi sent
- 💬 Chat messages
- ❌ Errors

## 🔒 Security

- CORS enabled untuk development
- Error handling untuk HTTP dan WebSocket
- Input validation (perlu ditambahkan)
- Authentication (perlu ditambahkan)

## 📈 Performance

- Single server process untuk HTTP dan WebSocket
- Efficient resource sharing
- Scalable architecture
- Real-time communication

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Cek MySQL service
sudo service mysql status  # Linux
net start mysql           # Windows

# Test koneksi MySQL
mysql -u root -p
```

### Port Already in Use
```bash
# Cek port yang digunakan
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Kill process
taskkill /PID <process_id>    # Windows
kill -9 <process_id>          # Linux/Mac
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Database Sync Error
- Pastikan database `bosgil_db` sudah dibuat
- Cek konfigurasi di file `.env`
- Pastikan MySQL user memiliki permission 