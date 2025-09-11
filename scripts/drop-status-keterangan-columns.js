const { sequelize } = require('../config/database');

async function dropStatusKeteranganColumns() {
  try {
    console.log('🔄 Starting to drop status_aktif and keterangan columns from sop_procedures table...');
    
    // Check if columns exist first
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_procedures'
      AND COLUMN_NAME IN ('status_aktif', 'keterangan')
    `);
    
    if (results.length === 0) {
      console.log('ℹ️  Columns status_aktif and keterangan do not exist, nothing to drop.');
      return;
    }
    
    console.log('📋 Found columns to drop:', results.map(r => r.COLUMN_NAME));
    
    // Drop the status_aktif column if exists
    if (results.some(r => r.COLUMN_NAME === 'status_aktif')) {
      await sequelize.query('ALTER TABLE sop_procedures DROP COLUMN status_aktif');
      console.log('✅ Dropped status_aktif column');
    }
    
    // Drop the keterangan column if exists
    if (results.some(r => r.COLUMN_NAME === 'keterangan')) {
      await sequelize.query('ALTER TABLE sop_procedures DROP COLUMN keterangan');
      console.log('✅ Dropped keterangan column');
    }
    
    console.log('✅ Successfully dropped columns from sop_procedures table!');
    console.log('ℹ️  The table now has: id, category_id, judul_procedure, created_by, updated_by, created_at, updated_at');
    
  } catch (error) {
    console.error('❌ Error dropping columns:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  dropStatusKeteranganColumns()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { dropStatusKeteranganColumns };
