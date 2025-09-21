const { sequelize } = require('../config/database');

const migrateSopToSdmDivisi = async () => {
  try {
    console.log('🔄 Starting SOP structure migration...');
    console.log('📋 Migrating sop_categories to use sdm_divisi instead of sop_divisi');

    // Step 1: Check if tables exist
    console.log('🔍 Checking table existence...');
    
    const [sopDivisiExists] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_divisi'
    `);
    
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

    if (sopDivisiExists.length === 0) {
      console.log('ℹ️  Table sop_divisi does not exist, nothing to migrate.');
      return;
    }

    if (sopCategoriesExists.length === 0) {
      console.log('❌ Table sop_categories does not exist, cannot migrate.');
      return;
    }

    if (sdmDivisiExists.length === 0) {
      console.log('❌ Table sdm_divisi does not exist, cannot migrate.');
      return;
    }

    console.log('✅ All required tables exist, proceeding with migration...');

    // Step 2: Backup existing data
    console.log('💾 Creating backup tables...');
    
    try {
      await sequelize.query('CREATE TABLE sop_categories_backup AS SELECT * FROM sop_categories');
      await sequelize.query('CREATE TABLE sop_divisi_backup AS SELECT * FROM sop_divisi');
      console.log('✅ Backup tables created successfully');
    } catch (backupError) {
      console.log('⚠️  Backup creation failed, but continuing with migration...');
      console.log('Backup error:', backupError.message);
    }

    // Step 3: Add new column to sop_categories
    console.log('🔧 Adding sdm_divisi_id column to sop_categories...');
    
    try {
      await sequelize.query(`
        ALTER TABLE sop_categories 
        ADD COLUMN sdm_divisi_id INT AFTER id,
        ADD INDEX idx_sop_categories_sdm_divisi_id (sdm_divisi_id)
      `);
      console.log('✅ sdm_divisi_id column added successfully');
    } catch (addColumnError) {
      if (addColumnError.message.includes('Duplicate column name')) {
        console.log('ℹ️  sdm_divisi_id column already exists, skipping...');
      } else {
        throw addColumnError;
      }
    }

    // Step 4: Migrate data from sop_divisi to sop_categories
    console.log('🔄 Migrating data from sop_divisi to sop_categories...');
    
    const [migrationResults] = await sequelize.query(`
      UPDATE sop_categories sc
      JOIN sop_divisi sd ON sc.divisi_id = sd.id
      JOIN sdm_divisi sdm ON sd.nama_divisi = sdm.nama_divisi
      SET sc.sdm_divisi_id = sdm.id
    `);
    
    console.log(`✅ Migrated ${migrationResults.affectedRows} records`);

    // Step 5: Handle unmapped records
    console.log('🔍 Checking for unmapped records...');
    
    const [unmappedRecords] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM sop_categories 
      WHERE sdm_divisi_id IS NULL
    `);
    
    if (unmappedRecords[0].count > 0) {
      console.log(`⚠️  Found ${unmappedRecords[0].count} unmapped records`);
      
      // Get the first sdm_divisi as fallback
      const [firstSdmDivisi] = await sequelize.query(`
        SELECT id FROM sdm_divisi LIMIT 1
      `);
      
      if (firstSdmDivisi.length > 0) {
        console.log('🔧 Assigning unmapped records to first sdm_divisi...');
        await sequelize.query(`
          UPDATE sop_categories 
          SET sdm_divisi_id = ?
          WHERE sdm_divisi_id IS NULL
        `, {
          replacements: [firstSdmDivisi[0].id]
        });
        console.log('✅ Unmapped records assigned');
      }
    } else {
      console.log('✅ All records mapped successfully');
    }

    // Step 6: Add foreign key constraint
    console.log('🔗 Adding foreign key constraint...');
    
    try {
      await sequelize.query(`
        ALTER TABLE sop_categories 
        ADD CONSTRAINT fk_sop_categories_sdm_divisi 
        FOREIGN KEY (sdm_divisi_id) REFERENCES sdm_divisi(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('✅ Foreign key constraint added successfully');
    } catch (constraintError) {
      if (constraintError.message.includes('Duplicate key name')) {
        console.log('ℹ️  Foreign key constraint already exists, skipping...');
      } else {
        throw constraintError;
      }
    }

    // Step 7: Make sdm_divisi_id NOT NULL
    console.log('🔧 Making sdm_divisi_id NOT NULL...');
    
    await sequelize.query(`
      ALTER TABLE sop_categories 
      MODIFY COLUMN sdm_divisi_id INT NOT NULL
    `);
    console.log('✅ sdm_divisi_id is now NOT NULL');

    // Step 8: Drop foreign key constraint first, then drop the old divisi_id column
    console.log('🔗 Dropping old foreign key constraint...');
    
    try {
      await sequelize.query(`
        ALTER TABLE sop_categories 
        DROP FOREIGN KEY fk_sop_categories_divisi
      `);
      console.log('✅ Old foreign key constraint dropped successfully');
    } catch (fkError) {
      if (fkError.message.includes("doesn't exist")) {
        console.log('ℹ️  Old foreign key constraint does not exist, skipping...');
      } else {
        console.log('⚠️  Error dropping old foreign key constraint:', fkError.message);
      }
    }

    console.log('🗑️  Dropping old divisi_id column...');
    
    await sequelize.query(`
      ALTER TABLE sop_categories DROP COLUMN divisi_id
    `);
    console.log('✅ divisi_id column dropped successfully');

    // Step 9: Drop the sop_divisi table
    console.log('🗑️  Dropping sop_divisi table...');
    
    await sequelize.query('DROP TABLE sop_divisi');
    console.log('✅ sop_divisi table dropped successfully');

    // Step 10: Verification
    console.log('🔍 Verifying migration...');
    
    const [sopCategoriesCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM sop_categories
    `);
    
    const [sdmDivisiCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM sdm_divisi
    `);
    
    const [sopDivisiExistsAfter] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_divisi'
    `);

    console.log('\n📊 Migration Results:');
    console.log(`   sop_categories records: ${sopCategoriesCount[0].count}`);
    console.log(`   sdm_divisi records: ${sdmDivisiCount[0].count}`);
    console.log(`   sop_divisi table exists: ${sopDivisiExistsAfter.length > 0 ? 'YES' : 'NO'}`);
    
    if (sopDivisiExistsAfter.length === 0) {
      console.log('✅ Migration completed successfully!');
      console.log('🎉 sop_categories now references sdm_divisi directly');
      console.log('🗑️  sop_divisi table has been removed');
    } else {
      console.log('⚠️  Migration completed but sop_divisi table still exists');
    }

  } catch (error) {
    console.error('❌ Error during SOP migration:', error);
    throw error;
  }
};

// Run if this file is executed directly
if (require.main === module) {
  migrateSopToSdmDivisi()
    .then(() => {
      console.log('🎉 SOP migration process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 SOP migration process failed:', error);
      process.exit(1);
    });
}

module.exports = migrateSopToSdmDivisi;
