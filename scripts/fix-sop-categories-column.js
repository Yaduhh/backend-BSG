const { sequelize } = require('../config/database');

async function fixSopCategoriesColumn() {
  try {
    console.log('🔧 Checking sop_categories table structure...');
    
    // Check current table structure
    const [columns] = await sequelize.query(`
      DESCRIBE sop_categories
    `);
    
    console.log('📋 Current columns in sop_categories:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Check if divisi_id still exists
    const divisiIdExists = columns.some(col => col.Field === 'divisi_id');
    
    if (divisiIdExists) {
      console.log('⚠️  divisi_id column still exists, removing it...');
      
      // Drop foreign key constraint first
      try {
        await sequelize.query(`
          ALTER TABLE sop_categories 
          DROP FOREIGN KEY fk_sop_categories_divisi
        `);
        console.log('✅ Old foreign key constraint dropped');
      } catch (fkError) {
        console.log('ℹ️  Foreign key constraint does not exist or already dropped');
      }
      
      // Drop the divisi_id column
      await sequelize.query(`
        ALTER TABLE sop_categories DROP COLUMN divisi_id
      `);
      console.log('✅ divisi_id column dropped successfully');
    } else {
      console.log('✅ divisi_id column does not exist');
    }
    
    // Check if sdm_divisi_id exists
    const sdmDivisiIdExists = columns.some(col => col.Field === 'sdm_divisi_id');
    
    if (!sdmDivisiIdExists) {
      console.log('⚠️  sdm_divisi_id column does not exist, adding it...');
      
      // Add sdm_divisi_id column
      await sequelize.query(`
        ALTER TABLE sop_categories 
        ADD COLUMN sdm_divisi_id INT NOT NULL AFTER id
      `);
      console.log('✅ sdm_divisi_id column added');
      
      // Add foreign key constraint
      await sequelize.query(`
        ALTER TABLE sop_categories 
        ADD CONSTRAINT fk_sop_categories_sdm_divisi 
        FOREIGN KEY (sdm_divisi_id) REFERENCES sdm_divisi(id)
      `);
      console.log('✅ Foreign key constraint added');
    } else {
      console.log('✅ sdm_divisi_id column exists');
    }
    
    // Verify final structure
    const [finalColumns] = await sequelize.query(`
      DESCRIBE sop_categories
    `);
    
    console.log('\n📋 Final columns in sop_categories:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    console.log('\n✅ sop_categories table structure fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing sop_categories table:', error);
  } finally {
    await sequelize.close();
  }
}

fixSopCategoriesColumn();
