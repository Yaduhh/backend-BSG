const { sequelize } = require('../config/database');

async function updateDaftarTugasTable() {
  try {
    // Add rating field
    await sequelize.query(`
      ALTER TABLE daftar_tugas 
      ADD COLUMN rating INT NULL COMMENT 'Rating tugas (1-5)'
    `);
    console.log('✅ Successfully added rating field');

    // Add catatan field
    await sequelize.query(`
      ALTER TABLE daftar_tugas 
      ADD COLUMN catatan TEXT NULL COMMENT 'Catatan tambahan untuk tugas'
    `);
    console.log('✅ Successfully added catatan field');

    // Update status enum to include new values
    await sequelize.query(`
      ALTER TABLE daftar_tugas 
      MODIFY COLUMN status ENUM('belum', 'proses', 'revisi', 'selesai') NOT NULL DEFAULT 'belum' COMMENT 'Status tugas'
    `);
    console.log('✅ Successfully updated status enum');

    // Update existing data to use new status values
    await sequelize.query(`
      UPDATE daftar_tugas 
      SET status = CASE 
        WHEN status = 'pending' THEN 'belum'
        WHEN status = 'in_progress' THEN 'proses'
        WHEN status = 'completed' THEN 'selesai'
        WHEN status = 'cancelled' THEN 'revisi'
        ELSE 'belum'
      END
    `);
    console.log('✅ Successfully migrated existing status data');

    console.log('🎉 All updates completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating daftar_tugas table:', error.message);
  } finally {
    await sequelize.close();
  }
}

updateDaftarTugasTable(); 