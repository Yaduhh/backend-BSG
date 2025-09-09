const { sequelize } = require('../config/database');

const removePicIdConstraint = async () => {
  try {
    console.log('🔄 Removing pic_id foreign key constraint...');

    // 1. Drop foreign key constraint first
    try {
      await sequelize.query('ALTER TABLE jadwal_pembayaran DROP FOREIGN KEY jadwal_pembayaran_ibfk_1');
      console.log('✅ Foreign key constraint dropped successfully!');
    } catch (error) {
      console.log('⏭️  Foreign key constraint does not exist or already removed');
    }

    // 2. Drop the pic_id column
    try {
      await sequelize.query('ALTER TABLE jadwal_pembayaran DROP COLUMN pic_id');
      console.log('✅ pic_id column removed successfully!');
    } catch (error) {
      if (error.original && error.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⏭️  pic_id column does not exist or already removed');
      } else {
        console.error('❌ Error removing pic_id column:', error);
      }
    }

    console.log('🎉 pic_id constraint and column removal completed!');
  } catch (error) {
    console.error('❌ Error removing pic_id constraint:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  removePicIdConstraint();
}

module.exports = { removePicIdConstraint };
