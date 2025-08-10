const { sequelize } = require('../config/database');
const ChatGroup = require('../models/ChatGroup');
const ChatGroupMember = require('../models/ChatGroupMember');

const createChatGroupTables = async () => {
  try {
    // Hapus tabel yang ada terlebih dahulu (jika ada)
    console.log('🔄 Menghapus tabel yang ada...');
    await sequelize.query('DROP TABLE IF EXISTS chat_group_members');
    await sequelize.query('DROP TABLE IF EXISTS chat_groups');
    console.log('✅ Tabel lama berhasil dihapus');

    console.log('🔄 Membuat tabel chat_groups...');
    await ChatGroup.sync({ force: true });
    console.log('✅ Tabel chat_groups berhasil dibuat');

    console.log('🔄 Membuat tabel chat_group_members...');
    await ChatGroupMember.sync({ force: true });
    console.log('✅ Tabel chat_group_members berhasil dibuat');

    console.log('🎉 Semua tabel group chat berhasil dibuat!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error membuat tabel:', error);
    process.exit(1);
  }
};

createChatGroupTables();
