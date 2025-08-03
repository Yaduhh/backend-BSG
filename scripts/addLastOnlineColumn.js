const { sequelize } = require('../config/database');

async function addLastOnlineColumn() {
  try {
    // Add last_online column if it doesn't exist
    await sequelize.query(`
      ALTER TABLE user_devices 
      ADD COLUMN last_online TIMESTAMP NULL 
      COMMENT 'Last time user was online (disconnected)'
    `);
    
    console.log('✅ Successfully added last_online column to user_devices table');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ last_online column already exists');
    } else {
      console.error('❌ Error adding last_online column:', error.message);
    }
  } finally {
    await sequelize.close();
  }
}

addLastOnlineColumn(); 