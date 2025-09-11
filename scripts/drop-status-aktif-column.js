const { sequelize } = require('../config/database');

async function dropStatusAktifColumn() {
  try {
    console.log('🔄 Starting to drop status_aktif column from sop_steps table...');
    
    // Check if column exists first
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_steps'
      AND COLUMN_NAME = 'status_aktif'
    `);
    
    if (results.length === 0) {
      console.log('ℹ️  Column status_aktif does not exist, nothing to drop.');
      return;
    }
    
    console.log('📋 Found status_aktif column, proceeding to drop...');
    
    // Drop the status_aktif column
    await sequelize.query('ALTER TABLE sop_steps DROP COLUMN status_aktif');
    
    console.log('✅ Successfully dropped status_aktif column from sop_steps table!');
    console.log('ℹ️  The table now only has: id, category_id, judul_procedure, keterangan, created_by, updated_by, created_at, updated_at');
    
  } catch (error) {
    console.error('❌ Error dropping status_aktif column:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  dropStatusAktifColumn()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { dropStatusAktifColumn };
