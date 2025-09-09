const { sequelize } = require('../config/database');

const removeUnusedFields = async () => {
  try {
    console.log('🔄 Removing unused fields from jadwal_pembayaran table...');

    // Remove tanggal_update column
    try {
      await sequelize.query('ALTER TABLE jadwal_pembayaran DROP COLUMN tanggal_update');
      console.log('✅ tanggal_update column removed successfully!');
    } catch (error) {
      if (error.original && error.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⏭️  tanggal_update column does not exist or already removed');
      } else {
        console.error('❌ Error removing tanggal_update column:', error);
      }
    }

    // Remove keterangan column
    try {
      await sequelize.query('ALTER TABLE jadwal_pembayaran DROP COLUMN keterangan');
      console.log('✅ keterangan column removed successfully!');
    } catch (error) {
      if (error.original && error.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⏭️  keterangan column does not exist or already removed');
      } else {
        console.error('❌ Error removing keterangan column:', error);
      }
    }

    console.log('🎉 Unused fields removal completed!');
  } catch (error) {
    console.error('❌ Error removing unused fields:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  removeUnusedFields();
}

module.exports = { removeUnusedFields };
