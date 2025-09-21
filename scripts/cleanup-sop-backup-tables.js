const { sequelize } = require('../config/database');

const cleanupSopBackupTables = async () => {
  try {
    console.log('🧹 Starting cleanup of SOP backup tables...');

    // Step 1: Check if backup tables exist
    console.log('🔍 Checking for backup tables...');
    
    const [backupTables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('sop_divisi_backup', 'sop_categories_backup')
    `);
    
    if (backupTables.length === 0) {
      console.log('ℹ️  No backup tables found, nothing to clean up.');
      return;
    }

    console.log('📋 Found backup tables:');
    backupTables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });

    // Step 2: Verify migration was successful before cleanup
    console.log('🔍 Verifying migration was successful...');
    
    const [sopCategoriesExists] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_categories'
    `);
    
    const [sdmDivisiExists] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sdm_divisi'
    `);
    
    const [sopDivisiExists] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_divisi'
    `);

    if (sopCategoriesExists.length === 0) {
      console.log('❌ sop_categories table does not exist, migration may have failed. Aborting cleanup.');
      return;
    }

    if (sdmDivisiExists.length === 0) {
      console.log('❌ sdm_divisi table does not exist, migration may have failed. Aborting cleanup.');
      return;
    }

    if (sopDivisiExists.length > 0) {
      console.log('⚠️  sop_divisi table still exists, migration may not be complete. Aborting cleanup.');
      return;
    }

    // Step 3: Check if sop_categories has sdm_divisi_id column
    const [sopCategoriesStructure] = await sequelize.query(`
      DESCRIBE sop_categories
    `);
    
    const hasSdmDivisiId = sopCategoriesStructure.some(col => col.Field === 'sdm_divisi_id');
    if (!hasSdmDivisiId) {
      console.log('❌ sop_categories does not have sdm_divisi_id column, migration may have failed. Aborting cleanup.');
      return;
    }

    console.log('✅ Migration verification passed, proceeding with cleanup...');

    // Step 4: Drop backup tables
    console.log('🗑️  Dropping backup tables...');
    
    for (const table of backupTables) {
      try {
        await sequelize.query(`DROP TABLE ${table.TABLE_NAME}`);
        console.log(`✅ Dropped table: ${table.TABLE_NAME}`);
      } catch (error) {
        console.log(`⚠️  Error dropping table ${table.TABLE_NAME}:`, error.message);
      }
    }

    // Step 5: Verify cleanup
    console.log('🔍 Verifying cleanup...');
    
    const [remainingBackupTables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('sop_divisi_backup', 'sop_categories_backup')
    `);
    
    if (remainingBackupTables.length === 0) {
      console.log('✅ All backup tables cleaned up successfully!');
    } else {
      console.log('⚠️  Some backup tables still exist:');
      remainingBackupTables.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
    }

    // Step 6: Final verification
    console.log('\n📊 Final State:');
    console.log(`   sop_categories: ${sopCategoriesExists.length > 0 ? 'EXISTS' : 'NOT EXISTS'}`);
    console.log(`   sdm_divisi: ${sdmDivisiExists.length > 0 ? 'EXISTS' : 'NOT EXISTS'}`);
    console.log(`   sop_divisi: ${sopDivisiExists.length > 0 ? 'EXISTS' : 'NOT EXISTS'}`);
    console.log(`   sop_divisi_backup: ${backupTables.some(t => t.TABLE_NAME === 'sop_divisi_backup') ? 'REMOVED' : 'NOT FOUND'}`);
    console.log(`   sop_categories_backup: ${backupTables.some(t => t.TABLE_NAME === 'sop_categories_backup') ? 'REMOVED' : 'NOT FOUND'}`);

    console.log('\n🎉 Backup cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during backup cleanup:', error);
    throw error;
  }
};

// Run if this file is executed directly
if (require.main === module) {
  cleanupSopBackupTables()
    .then(() => {
      console.log('🎉 Backup cleanup process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Backup cleanup process failed:', error);
      process.exit(1);
    });
}

module.exports = cleanupSopBackupTables;
