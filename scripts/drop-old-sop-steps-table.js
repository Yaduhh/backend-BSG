const { sequelize } = require('../config/database');

async function dropOldSopStepsTable() {
  try {
    console.log('🔄 Starting to drop old sop_steps table...');
    
    // Check if table exists first
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_steps'
    `);
    
    if (results.length === 0) {
      console.log('ℹ️  Table sop_steps does not exist, nothing to drop.');
      return;
    }
    
    console.log('📋 Found sop_steps table, proceeding to drop...');
    
    // Drop the old sop_steps table
    await sequelize.query('DROP TABLE IF EXISTS sop_steps');
    
    console.log('✅ Successfully dropped old sop_steps table!');
    console.log('ℹ️  The new sop_steps table (renamed from sop_procedures) is now active.');
    
  } catch (error) {
    console.error('❌ Error dropping old sop_steps table:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  dropOldSopStepsTable()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { dropOldSopStepsTable };
