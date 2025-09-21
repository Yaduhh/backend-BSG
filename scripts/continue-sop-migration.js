const { sequelize } = require('../config/database');

const continueSopMigration = async () => {
  try {
    console.log('🔄 Continuing SOP migration from current state...');
    console.log('📋 Current state: sop_categories has sdm_divisi_id, need to clean up old constraints');

    // Step 1: Check current state
    console.log('🔍 Checking current table state...');
    
    const [sopCategoriesStructure] = await sequelize.query(`
      DESCRIBE sop_categories
    `);
    
    console.log('📋 Current sop_categories structure:');
    sopCategoriesStructure.forEach(column => {
      console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Step 2: Check for existing foreign key constraints
    console.log('🔍 Checking existing foreign key constraints...');
    
    const [constraints] = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_categories'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('📋 Existing foreign key constraints:');
    constraints.forEach(constraint => {
      console.log(`   - ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
    });

    // Step 3: Drop old foreign key constraints
    console.log('🔗 Dropping old foreign key constraints...');
    
    for (const constraint of constraints) {
      if (constraint.REFERENCED_TABLE_NAME === 'sop_divisi') {
        try {
          await sequelize.query(`
            ALTER TABLE sop_categories 
            DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
          `);
          console.log(`✅ Dropped constraint: ${constraint.CONSTRAINT_NAME}`);
        } catch (error) {
          console.log(`⚠️  Error dropping constraint ${constraint.CONSTRAINT_NAME}:`, error.message);
        }
      }
    }

    // Step 4: Drop old divisi_id column if it still exists
    console.log('🗑️  Checking and dropping old divisi_id column...');
    
    const divisiIdColumn = sopCategoriesStructure.find(col => col.Field === 'divisi_id');
    if (divisiIdColumn) {
      try {
        await sequelize.query(`
          ALTER TABLE sop_categories DROP COLUMN divisi_id
        `);
        console.log('✅ divisi_id column dropped successfully');
      } catch (error) {
        console.log('⚠️  Error dropping divisi_id column:', error.message);
      }
    } else {
      console.log('ℹ️  divisi_id column does not exist, skipping...');
    }

    // Step 5: Drop sop_divisi table if it still exists
    console.log('🗑️  Checking and dropping sop_divisi table...');
    
    const [sopDivisiExists] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_divisi'
    `);
    
    if (sopDivisiExists.length > 0) {
      try {
        await sequelize.query('DROP TABLE sop_divisi');
        console.log('✅ sop_divisi table dropped successfully');
      } catch (error) {
        console.log('⚠️  Error dropping sop_divisi table:', error.message);
      }
    } else {
      console.log('ℹ️  sop_divisi table does not exist, skipping...');
    }

    // Step 6: Verify final state
    console.log('🔍 Verifying final state...');
    
    const [finalStructure] = await sequelize.query(`
      DESCRIBE sop_categories
    `);
    
    const [finalConstraints] = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'sop_categories'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
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

    console.log('\n📊 Final Migration Results:');
    console.log(`   sop_categories records: ${sopCategoriesCount[0].count}`);
    console.log(`   sdm_divisi records: ${sdmDivisiCount[0].count}`);
    console.log(`   sop_divisi table exists: ${sopDivisiExistsAfter.length > 0 ? 'YES' : 'NO'}`);
    
    console.log('\n📋 Final sop_categories structure:');
    finalStructure.forEach(column => {
      console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n📋 Final foreign key constraints:');
    if (finalConstraints.length > 0) {
      finalConstraints.forEach(constraint => {
        console.log(`   - ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('   - No foreign key constraints found');
    }
    
    if (sopDivisiExistsAfter.length === 0 && finalStructure.some(col => col.Field === 'sdm_divisi_id')) {
      console.log('\n✅ Migration completed successfully!');
      console.log('🎉 sop_categories now references sdm_divisi directly');
      console.log('🗑️  sop_divisi table has been removed');
    } else {
      console.log('\n⚠️  Migration may not be complete, please check the results above');
    }

  } catch (error) {
    console.error('❌ Error during SOP migration continuation:', error);
    throw error;
  }
};

// Run if this file is executed directly
if (require.main === module) {
  continueSopMigration()
    .then(() => {
      console.log('🎉 SOP migration continuation process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 SOP migration continuation process failed:', error);
      process.exit(1);
    });
}

module.exports = continueSopMigration;
