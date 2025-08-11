const { sequelize } = require('../config/database');

const updateMessageTableForGroup = async () => {
  try {
    console.log('🔄 Menambahkan kolom is_group_message ke tabel messages...');
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'messages' 
      AND COLUMN_NAME = 'is_group_message'
    `);

    if (results.length === 0) {
      // Add is_group_message column
      await sequelize.query(`
        ALTER TABLE messages 
        ADD COLUMN is_group_message BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Kolom is_group_message berhasil ditambahkan');
    } else {
      console.log('ℹ️ Kolom is_group_message sudah ada');
    }

    console.log('🎉 Update tabel messages selesai!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error update tabel:', error);
    process.exit(1);
  }
};

updateMessageTableForGroup();
