const { sequelize } = require('../config/database');

async function addReceiveIdToSaranTable() {
  try {
    console.log('🚀 Starting saran table alteration to add receive_id field...');
    
    // Check if saran table exists
    console.log('🔍 Checking if saran table exists...');
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'saran'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Table saran does not exist. Please create it first.');
      return;
    }
    
    console.log('✅ Table saran exists');
    
    // Check if receive_id column already exists
    console.log('🔍 Checking if receive_id column already exists...');
    const [receiveIdColumns] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'saran' AND COLUMN_NAME = 'receive_id'"
    );
    
    if (receiveIdColumns.length > 0) {
      console.log('⚠️ Column receive_id already exists in saran table');
    } else {
      // Add receive_id column after created_by
      console.log('➕ Adding receive_id column to saran table...');
      await sequelize.query(`
        ALTER TABLE saran 
        ADD COLUMN receive_id INT NULL COMMENT 'ID user yang menerima saran' 
        AFTER created_by
      `);
      console.log('✅ Column receive_id added successfully');
      
      // Add foreign key constraint
      console.log('🔗 Adding foreign key constraint for receive_id...');
      await sequelize.query(`
        ALTER TABLE saran 
        ADD CONSTRAINT fk_saran_receive_id 
        FOREIGN KEY (receive_id) REFERENCES users(id) 
        ON UPDATE CASCADE ON DELETE SET NULL
      `);
      console.log('✅ Foreign key constraint added successfully');
    }
    
    // Verify the changes
    console.log('🔍 Verifying table structure...');
    const [newColumns] = await sequelize.query(
      "DESCRIBE saran"
    );
    
    console.log('📋 Updated saran table structure:');
    newColumns.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `(${column.Key})` : ''}`);
    });
    
    // Show foreign key constraints
    console.log('🔗 Foreign key constraints:');
    const [constraints] = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'saran' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    constraints.forEach(constraint => {
      console.log(`  - ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} → ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
    });
    
    console.log('✅ Saran table alteration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during saran table alteration:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the script
if (require.main === module) {
  addReceiveIdToSaranTable()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addReceiveIdToSaranTable };
