const { sequelize } = require('../config/database');

async function addJudulProcedureColumn() {
  try {
    console.log('🔄 Starting to add judul_procedure column to sop_steps table...');
    
    // Check if column exists first
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_steps'
      AND COLUMN_NAME = 'judul_procedure'
    `);
    
    if (results.length > 0) {
      console.log('ℹ️  Column judul_procedure already exists, nothing to add.');
      return;
    }
    
    console.log('📋 Column judul_procedure not found, proceeding to add...');
    
    // Add the judul_procedure column
    await sequelize.query(`
      ALTER TABLE sop_steps 
      ADD COLUMN judul_procedure VARCHAR(255) NOT NULL 
      AFTER category_id
    `);
    
    console.log('✅ Successfully added judul_procedure column to sop_steps table!');
    console.log('ℹ️  The table now has: id, category_id, judul_procedure, keterangan, created_by, updated_by, created_at, updated_at');
    
  } catch (error) {
    console.error('❌ Error adding judul_procedure column:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  addJudulProcedureColumn()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addJudulProcedureColumn };
