const { sequelize } = require('../config/database');

async function addSoftDeleteToSdmTables() {
  try {
    console.log('🚀 Starting soft delete migration for SDM tables...');
    
    // Add soft delete columns to sdm_divisi table
    console.log('📂 Adding soft delete columns to sdm_divisi...');
    await sequelize.query(`
      ALTER TABLE sdm_divisi 
      ADD COLUMN status_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Status soft delete divisi',
      ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Timestamp ketika divisi dihapus',
      ADD COLUMN deleted_by INT NULL COMMENT 'ID user yang menghapus divisi'
    `);
    console.log('✅ sdm_divisi soft delete columns added');

    // Add indexes for sdm_divisi
    await sequelize.query(`
      ALTER TABLE sdm_divisi 
      ADD INDEX idx_sdm_divisi_status_deleted (status_deleted),
      ADD INDEX idx_sdm_divisi_deleted_at (deleted_at)
    `);
    console.log('✅ sdm_divisi indexes added');

    // Add soft delete columns to sdm_jabatan table
    console.log('💼 Adding soft delete columns to sdm_jabatan...');
    await sequelize.query(`
      ALTER TABLE sdm_jabatan
      ADD COLUMN status_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Status soft delete jabatan',
      ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Timestamp ketika jabatan dihapus',
      ADD COLUMN deleted_by INT NULL COMMENT 'ID user yang menghapus jabatan'
    `);
    console.log('✅ sdm_jabatan soft delete columns added');

    // Add indexes for sdm_jabatan
    await sequelize.query(`
      ALTER TABLE sdm_jabatan
      ADD INDEX idx_sdm_jabatan_status_deleted (status_deleted),
      ADD INDEX idx_sdm_jabatan_deleted_at (deleted_at)
    `);
    console.log('✅ sdm_jabatan indexes added');

    // Add soft delete columns to sdm_data table
    console.log('👥 Adding soft delete columns to sdm_data...');
    await sequelize.query(`
      ALTER TABLE sdm_data
      ADD COLUMN status_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Status soft delete data SDM',
      ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Timestamp ketika data SDM dihapus',
      ADD COLUMN deleted_by INT NULL COMMENT 'ID user yang menghapus data SDM'
    `);
    console.log('✅ sdm_data soft delete columns added');

    // Add indexes for sdm_data
    await sequelize.query(`
      ALTER TABLE sdm_data
      ADD INDEX idx_sdm_data_status_deleted (status_deleted),
      ADD INDEX idx_sdm_data_deleted_at (deleted_at)
    `);
    console.log('✅ sdm_data indexes added');

    // Add foreign key constraints for deleted_by columns
    console.log('🔗 Adding foreign key constraints...');
    
    await sequelize.query(`
      ALTER TABLE sdm_divisi 
      ADD CONSTRAINT fk_sdm_divisi_deleted_by 
      FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('✅ sdm_divisi foreign key added');

    await sequelize.query(`
      ALTER TABLE sdm_jabatan
      ADD CONSTRAINT fk_sdm_jabatan_deleted_by 
      FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('✅ sdm_jabatan foreign key added');

    await sequelize.query(`
      ALTER TABLE sdm_data
      ADD CONSTRAINT fk_sdm_data_deleted_by 
      FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('✅ sdm_data foreign key added');

    console.log('🎉 Soft delete migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - sdm_divisi: status_deleted, deleted_at, deleted_by');
    console.log('   - sdm_jabatan: status_deleted, deleted_at, deleted_by');
    console.log('   - sdm_data: status_deleted, deleted_at, deleted_by');
    console.log('   - All indexes and foreign keys added');
    
  } catch (error) {
    console.error('❌ Error adding soft delete to SDM tables:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  addSoftDeleteToSdmTables();
}

module.exports = { addSoftDeleteToSdmTables };
