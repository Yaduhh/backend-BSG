const { app, server, sequelize, testConnection } = require('./app');
const { syncDatabase } = require('./config/sync');

const PORT = process.env.PORT || 3000;

// Sync database dan jalankan server
const startServer = async () => {
  try {
    // Test koneksi database
    await testConnection();
    
    // Sync database dan buat tabel User
    await syncDatabase();
    
    // Jalankan server
    server.listen(PORT, () => {
      console.log('🚀 Server berhasil dijalankan!');
      console.log(`📡 HTTP API: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 