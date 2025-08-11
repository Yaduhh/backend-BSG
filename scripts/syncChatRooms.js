const { sequelize } = require('../config/database');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

const syncChatRooms = async () => {
  try {
    console.log('🔄 Syncing chat rooms database...');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    
    console.log('✅ Chat rooms database synced successfully');
    
    // Check if we need to add missing columns
    const tableInfo = await sequelize.query("DESCRIBE chat_rooms", { type: sequelize.QueryTypes.SELECT });
    const columns = tableInfo.map(col => col.Field);
    
    console.log('📋 Current columns:', columns);
    
    // Add missing columns if needed
    if (!columns.includes('user1_unread_count')) {
      console.log('➕ Adding user1_unread_count column...');
      await sequelize.query("ALTER TABLE chat_rooms ADD COLUMN user1_unread_count INT DEFAULT 0");
    }
    
    if (!columns.includes('user2_unread_count')) {
      console.log('➕ Adding user2_unread_count column...');
      await sequelize.query("ALTER TABLE chat_rooms ADD COLUMN user2_unread_count INT DEFAULT 0");
    }
    
    console.log('✅ Database structure updated');
    
  } catch (error) {
    console.error('❌ Error syncing chat rooms:', error);
  } finally {
    await sequelize.close();
  }
};

// Run if called directly
if (require.main === module) {
  syncChatRooms();
}

module.exports = syncChatRooms; 