const { sequelize } = require('../config/database');

const createChatTables = async () => {
  try {
    console.log('🔄 Creating chat tables...');
    
    // Create chat_rooms table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id VARCHAR(100) UNIQUE NOT NULL,
        user1_id INT NOT NULL,
        user2_id INT NOT NULL,
        last_message TEXT,
        last_message_time DATETIME,
        unread_count_user1 INT DEFAULT 0,
        unread_count_user2 INT DEFAULT 0,
        status_deleted TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_room_id (room_id),
        INDEX idx_users (user1_id, user2_id),
        INDEX idx_last_message_time (last_message_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // Create messages table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id VARCHAR(100) NOT NULL,
        sender_id INT NOT NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        is_read TINYINT DEFAULT 0,
        status_deleted TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_room_id (room_id),
        INDEX idx_sender_id (sender_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // Create user_devices table for multi-device notifications
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        device_id VARCHAR(190) NOT NULL,
        expo_token VARCHAR(190),
        device_type VARCHAR(20) DEFAULT 'mobile',
        is_active TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_device (user_id, device_id),
        INDEX idx_user_id (user_id),
        INDEX idx_expo_token (expo_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
    `);
    
    // Ensure existing user_devices table is compatible with index size limits
    try {
      await sequelize.query(`
        ALTER TABLE user_devices
        DROP INDEX unique_user_device,
        MODIFY device_id VARCHAR(190) NOT NULL,
        MODIFY expo_token VARCHAR(190) NULL,
        ADD UNIQUE KEY unique_user_device (user_id, device_id)
      `);
      console.log('🔧 Adjusted user_devices column lengths and re-created unique index');
    } catch (e) {
      // Ignore if index/columns already adjusted
      if (e && e.message) {
        console.log('ℹ️ Skipping user_devices adjust step:', e.message);
      }
    }
    
    console.log('✅ Chat tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating chat tables:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createChatTables()
    .then(() => {
      console.log('🎉 Chat tables setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Chat tables setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createChatTables }; 