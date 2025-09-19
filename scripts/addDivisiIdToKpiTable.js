const { sequelize } = require('../config/database');

async function addDivisiIdToKpiTable() {
  try {
    console.log('🚀 Starting KPI table alteration to add divisi_id field...');
    
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
    
    // Check if divisi_id column already exists
    console.log('🔍 Checking if divisi_id column already exists...');
    const [columns] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kpis' AND COLUMN_NAME = 'divisi_id'"
    );
    
    if (columns.length > 0) {
      console.log('⚠️ Column divisi_id already exists in kpis table');
      return;
    }
    
    // Add divisi_id column
    console.log('➕ Adding divisi_id column to kpis table...');
    await sequelize.query(`
      ALTER TABLE kpis 
      ADD COLUMN divisi_id INT NULL COMMENT 'ID divisi yang terkait dengan KPI (untuk category divisi)'
    `);
    
    console.log('✅ Column divisi_id added successfully');
    
    // Add index for divisi_id
    console.log('📊 Adding index for divisi_id...');
    await sequelize.query(`
      ALTER TABLE kpis 
      ADD INDEX idx_kpis_divisi_id (divisi_id)
    `);
    
    console.log('✅ Index for divisi_id added successfully');
    
    // Add foreign key constraint if sdm_divisi table exists
    console.log('🔍 Checking if sdm_divisi table exists for foreign key...');
    const [divisiTables] = await sequelize.query(
      "SHOW TABLES LIKE 'sdm_divisi'"
    );
    
    if (divisiTables.length > 0) {
      console.log('🔗 Adding foreign key constraint to sdm_divisi...');
      try {
        await sequelize.query(`
          ALTER TABLE kpis 
          ADD CONSTRAINT fk_kpis_divisi_id 
          FOREIGN KEY (divisi_id) REFERENCES sdm_divisi(id) 
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log('✅ Foreign key constraint added successfully');
      } catch (fkError) {
        console.log('⚠️ Could not add foreign key constraint:', fkError.message);
        console.log('ℹ️ Column added but without foreign key constraint');
      }
    } else {
      console.log('⚠️ sdm_divisi table not found, skipping foreign key constraint');
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
  addDivisiIdToKpiTable();
}

module.exports = addDivisiIdToKpiTable;
