const { sequelize } = require('../config/database');

async function addUserIdToKpiTable() {
  try {
    console.log('🚀 Starting KPI table alteration to add id_user field...');
    
    // Check if kpis table exists
    console.log('🔍 Checking if kpis table exists...');
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'kpis'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Table kpis does not exist. Please create it first.');
      return;
    }
    
    console.log('✅ Table kpis exists');
    
    // Check if id_user column already exists
    console.log('🔍 Checking if id_user column already exists...');
    const [columns] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kpis' AND COLUMN_NAME = 'id_user'"
    );
    
    if (columns.length > 0) {
      console.log('⚠️ Column id_user already exists in kpis table');
      return;
    }
    
    // Add id_user column
    console.log('➕ Adding id_user column to kpis table...');
    await sequelize.query(`
      ALTER TABLE kpis 
      ADD COLUMN id_user INT NULL COMMENT 'ID user yang terkait dengan KPI'
    `);
    
    console.log('✅ Column id_user added successfully');
    
    // Add index for id_user
    console.log('📊 Adding index for id_user...');
    await sequelize.query(`
      ALTER TABLE kpis 
      ADD INDEX idx_kpis_id_user (id_user)
    `);
    
    console.log('✅ Index for id_user added successfully');
    
    // Add foreign key constraint if users table exists
    console.log('🔍 Checking if users table exists for foreign key...');
    const [userTables] = await sequelize.query(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (userTables.length > 0) {
      console.log('🔗 Adding foreign key constraint to users table...');
      try {
        await sequelize.query(`
          ALTER TABLE kpis 
          ADD CONSTRAINT fk_kpis_id_user 
          FOREIGN KEY (id_user) REFERENCES users(id) 
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log('✅ Foreign key constraint added successfully');
      } catch (fkError) {
        console.log('⚠️ Could not add foreign key constraint:', fkError.message);
        console.log('ℹ️ Column added but without foreign key constraint');
      }
    } else {
      console.log('⚠️ Users table not found, skipping foreign key constraint');
    }
    
    // Verify the changes
    console.log('🔍 Verifying table structure...');
    const [newColumns] = await sequelize.query(
      "DESCRIBE kpis"
    );
    
    console.log('📋 Updated kpis table structure:');
    newColumns.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `(${column.Key})` : ''}`);
    });
    
    console.log('✅ KPI table alteration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during KPI table alteration:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the script
if (require.main === module) {
  addUserIdToKpiTable()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addUserIdToKpiTable };
