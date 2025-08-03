const { sequelize } = require('../config/database');

async function createUserDevicesTable() {
  try {
    // Create user_devices table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_devices (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        device_id VARCHAR(255) NOT NULL,
        expo_token VARCHAR(255) NOT NULL,
        device_name VARCHAR(100),
        platform ENUM('ios', 'android') NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login TIMESTAMP NULL,
        last_online TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_device (user_id, device_id),
        INDEX idx_expo_token (expo_token),
        INDEX idx_is_active (is_active)
      )
    `);
    
    console.log('✅ Successfully created user_devices table');
    
    // Add last_online column if it doesn't exist
    try {
      await sequelize.query(`
        ALTER TABLE user_devices 
        ADD COLUMN last_online TIMESTAMP NULL 
        COMMENT 'Last time user was online (disconnected)'
      `);
      console.log('✅ Successfully added last_online column');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ last_online column already exists');
      } else {
        console.error('❌ Error adding last_online column:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createUserDevicesTable(); 