const { sequelize } = require('../config/database');

async function analyzeTimTables() {
  try {
    console.log('🔍 Analyzing tim_merah and tim_biru table structures...\n');

    // Check tim_merah table structure
    console.log('📋 TIM_MERAH Table Structure:');
    const timMerahColumns = await sequelize.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_COMMENT,
        COLUMN_KEY,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
      AND TABLE_NAME = 'tim_merah'
      ORDER BY ORDINAL_POSITION
    `, { type: sequelize.QueryTypes.SELECT });

    timMerahColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_COMMENT ? `(${col.COLUMN_COMMENT})` : ''}`);
    });

    console.log('\n📋 TIM_BIRU Table Structure:');
    const timBiruColumns = await sequelize.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_COMMENT,
        COLUMN_KEY,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
      AND TABLE_NAME = 'tim_biru'
      ORDER BY ORDINAL_POSITION
    `, { type: sequelize.QueryTypes.SELECT });

    timBiruColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_COMMENT ? `(${col.COLUMN_COMMENT})` : ''}`);
    });

    // Check indexes
    console.log('\n🔍 TIM_MERAH Indexes:');
    const timMerahIndexes = await sequelize.query(`
      SELECT 
        INDEX_NAME,
        COLUMN_NAME,
        NON_UNIQUE,
        INDEX_TYPE
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
      AND TABLE_NAME = 'tim_merah'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, { type: sequelize.QueryTypes.SELECT });

    timMerahIndexes.forEach(idx => {
      console.log(`  - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME} (${idx.NON_UNIQUE ? 'Non-unique' : 'Unique'})`);
    });

    console.log('\n🔍 TIM_BIRU Indexes:');
    const timBiruIndexes = await sequelize.query(`
      SELECT 
        INDEX_NAME,
        COLUMN_NAME,
        NON_UNIQUE,
        INDEX_TYPE
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
      AND TABLE_NAME = 'tim_biru'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, { type: sequelize.QueryTypes.SELECT });

    timBiruIndexes.forEach(idx => {
      console.log(`  - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME} (${idx.NON_UNIQUE ? 'Non-unique' : 'Unique'})`);
    });

    // Check foreign keys
    console.log('\n🔗 TIM_MERAH Foreign Keys:');
    const timMerahFKs = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
      AND TABLE_NAME = 'tim_merah'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, { type: sequelize.QueryTypes.SELECT });

    timMerahFKs.forEach(fk => {
      console.log(`  - ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });

    console.log('\n🔗 TIM_BIRU Foreign Keys:');
    const timBiruFKs = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
      AND TABLE_NAME = 'tim_biru'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, { type: sequelize.QueryTypes.SELECT });

    timBiruFKs.forEach(fk => {
      console.log(`  - ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });

    // Analyze differences
    console.log('\n📊 ANALYSIS:');
    console.log('Expected fields based on models:');
    console.log('TIM_MERAH: id, status, keterangan, user_id, created_by, created_at, updated_at');
    console.log('TIM_BIRU: id, prestasi, keterangan, user_id, created_by, created_at, updated_at');
    
    const timMerahFieldNames = timMerahColumns.map(col => col.COLUMN_NAME);
    const timBiruFieldNames = timBiruColumns.map(col => col.COLUMN_NAME);
    
    console.log('\nActual fields in database:');
    console.log('TIM_MERAH:', timMerahFieldNames.join(', '));
    console.log('TIM_BIRU:', timBiruFieldNames.join(', '));

    // Check if user_id exists
    const hasUserIdMerah = timMerahFieldNames.includes('user_id');
    const hasUserIdBiru = timBiruFieldNames.includes('user_id');
    
    console.log('\n✅ Status:');
    console.log(`TIM_MERAH has user_id: ${hasUserIdMerah ? 'YES' : 'NO'}`);
    console.log(`TIM_BIRU has user_id: ${hasUserIdBiru ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('❌ Error analyzing tables:', error);
    throw error;
  }
}

// Run the analysis
analyzeTimTables()
  .then(() => {
    console.log('\n✅ Analysis completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
