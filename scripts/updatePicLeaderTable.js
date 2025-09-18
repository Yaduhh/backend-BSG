const { sequelize } = require('../config/database');

async function updatePicLeaderTable() {
  try {
    console.log('🔄 Starting pic_leader table update...');

    // 1. Check if table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'pic_leader'");
    if (tables.length === 0) {
      console.log('❌ Table pic_leader does not exist. Please create it first.');
      return;
    }

    // 2. Drop columns if they exist
    try {
      await sequelize.query(`ALTER TABLE pic_leader DROP COLUMN deskripsi`);
      console.log('✅ Dropped deskripsi column');
    } catch (error) {
      console.log('⚠️  deskripsi column not found or already dropped:', error.message);
    }

    try {
      await sequelize.query(`ALTER TABLE pic_leader DROP COLUMN prioritas`);
      console.log('✅ Dropped prioritas column');
    } catch (error) {
      console.log('⚠️  prioritas column not found or already dropped:', error.message);
    }

    // 3. Drop indexes if they exist
    try {
      await sequelize.query(`ALTER TABLE pic_leader DROP INDEX idx_prioritas`);
      console.log('✅ Dropped prioritas index');
    } catch (error) {
      console.log('⚠️  prioritas index not found or already dropped:', error.message);
    }

    console.log('🎉 pic_leader table update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating pic_leader table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if called directly
if (require.main === module) {
  updatePicLeaderTable()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updatePicLeaderTable };
