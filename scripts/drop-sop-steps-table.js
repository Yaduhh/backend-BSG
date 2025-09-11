const { sequelize } = require('../config/database');

async function dropSopStepsTable() {
  try {
    console.log('🔄 Starting to drop sop_steps table...');
    
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
    
    // Drop the sop_steps table
    await sequelize.query('DROP TABLE IF EXISTS sop_steps');
    
    console.log('✅ Successfully dropped sop_steps table!');
    console.log('ℹ️  Now using sop_procedures table for Step SOP management.');
    
  } catch (error) {
    console.error('❌ Error dropping sop_steps table:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  dropSopStepsTable()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { dropSopStepsTable };
