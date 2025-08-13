const { app, server, sequelize, testConnection } = require('./app');
const { syncDatabase } = require('./config/sync');
const { API_CONFIG } = require('./config/constants');

// Sync database dan jalankan server
const startServer = async () => {
  try {
    // Test koneksi database
    await testConnection();

    // Sync database dan buat tabel User
    await syncDatabase();

    // Jalankan server
    server.listen(API_CONFIG.PORT, () => {
      console.log('🚀 Server berhasil dijalankan!');
      console.log(`📡 HTTP API: ${API_CONFIG.BASE_URL}`);
      console.log(`🔌 WebSocket: ${API_CONFIG.BASE_URL.replace('http', 'ws')}`);
      console.log(`📊 Health Check: ${API_CONFIG.BASE_URL}${API_CONFIG.ROUTES.API_PREFIX}${API_CONFIG.ROUTES.HEALTH}`);
      console.log(`👥 Users API: ${API_CONFIG.BASE_URL}${API_CONFIG.ROUTES.API_PREFIX}${API_CONFIG.ROUTES.USERS}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 