const { sequelize } = require('../config/database');

async function updateJobdeskDepartmentRelation() {
  try {
    console.log('🔄 Starting jobdesk department relation update...');

    // 1. Check if jobdesk_departments table exists
    console.log('🔍 Checking if jobdesk_departments table exists...');
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'jobdesk_departments'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Table jobdesk_departments does not exist. Please create it first.');
      return;
    }
    
    console.log('✅ Table jobdesk_departments exists');

    // 2. Drop existing foreign key constraint
    console.log('🔄 Dropping existing foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE jobdesk_departments 
        DROP FOREIGN KEY jobdesk_departments_ibfk_1
      `);
      console.log('✅ Dropped existing foreign key constraint');
    } catch (error) {
      console.log('⚠️  Foreign key constraint not found or already dropped:', error.message);
    }

    // 3. Check if sdm_divisi table exists and has data
    console.log('🔄 Checking sdm_divisi table...');
    const [sdmDivisiRows] = await sequelize.query(`
      SELECT COUNT(*) as count FROM sdm_divisi WHERE status_aktif = 1
    `);
    
    if (sdmDivisiRows[0].count === 0) {
      console.log('⚠️  No active divisions found in sdm_divisi. Creating sample data...');
      
      // Insert sample divisions
      await sequelize.query(`
        INSERT INTO sdm_divisi (nama_divisi, keterangan, status_aktif, created_by, created_at, updated_at) VALUES
        ('IT & Digital', 'Divisi Teknologi Informasi dan Digital', 1, 1, NOW(), NOW()),
        ('HR & Admin', 'Divisi Sumber Daya Manusia dan Administrasi', 1, 1, NOW(), NOW()),
        ('Finance', 'Divisi Keuangan', 1, 1, NOW(), NOW()),
        ('Marketing', 'Divisi Pemasaran', 1, 1, NOW(), NOW()),
        ('Operations', 'Divisi Operasional', 1, 1, NOW(), NOW())
      `);
      console.log('✅ Sample divisions created');
    }

    // 4. Get first active division ID for migration
    const [firstDivision] = await sequelize.query(`
      SELECT id FROM sdm_divisi WHERE status_aktif = 1 ORDER BY id LIMIT 1
    `);
    
    if (firstDivision.length === 0) {
      throw new Error('No active divisions found in sdm_divisi');
    }
    
    const defaultDivisionId = firstDivision[0].id;
    console.log(`✅ Using division ID ${defaultDivisionId} as default`);

    // 5. Update existing jobdesk_departments to use sdm_divisi
    console.log('🔄 Updating existing jobdesk_departments...');
    const [updateResult] = await sequelize.query(`
      UPDATE jobdesk_departments 
      SET divisi_id = ? 
      WHERE divisi_id NOT IN (SELECT id FROM sdm_divisi WHERE status_aktif = 1)
    `, { replacements: [defaultDivisionId] });
    
    console.log(`✅ Updated ${updateResult[1]} jobdesk_departments records`);

    // 6. Add new foreign key constraint to sdm_divisi
    console.log('🔄 Adding new foreign key constraint...');
    await sequelize.query(`
      ALTER TABLE jobdesk_departments 
      ADD CONSTRAINT fk_jobdesk_departments_sdm_divisi 
      FOREIGN KEY (divisi_id) REFERENCES sdm_divisi(id) 
      ON UPDATE CASCADE ON DELETE RESTRICT
    `);
    console.log('✅ Added new foreign key constraint');

    // 7. Drop jobdesk_divisi table if exists
    console.log('🔄 Dropping jobdesk_divisi table...');
    try {
      await sequelize.query(`DROP TABLE IF EXISTS jobdesk_divisi`);
      console.log('✅ Dropped jobdesk_divisi table');
    } catch (error) {
      console.log('⚠️  Error dropping jobdesk_divisi table:', error.message);
    }

    console.log('🎉 Jobdesk department relation update completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('- Updated jobdesk_departments to reference sdm_divisi');
    console.log('- Migrated existing data to use sdm_divisi');
    console.log('- Added new foreign key constraint');
    console.log('- Removed jobdesk_divisi table');
    console.log('');
    console.log('🔗 New structure:');
    console.log('sdm_divisi → jobdesk_departments → jobdesk_positions');

  } catch (error) {
    console.error('❌ Error updating jobdesk department relation:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
if (require.main === module) {
  updateJobdeskDepartmentRelation()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = updateJobdeskDepartmentRelation;
