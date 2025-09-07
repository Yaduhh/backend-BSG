const { sequelize } = require('../config/database');

const removeStatusColumn = async () => {
  try {
    console.log('🔄 Removing status column from jadwal_pembayaran table...');

    // Remove status column
    await sequelize.query('ALTER TABLE jadwal_pembayaran DROP COLUMN status');

    console.log('✅ Status column removed successfully!');
  } catch (error) {
    if (error.original && error.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('⏭️  Status column does not exist or already removed');
    } else {
      console.error('❌ Error removing status column:', error);
    }
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  removeStatusColumn();
}

module.exports = { removeStatusColumn };
