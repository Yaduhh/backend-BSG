const { sequelize } = require('../config/database');

async function addJudulLaporanToLaporanKeuanganTable() {
  try {
    console.log('🚀 Starting migration for laporan_keuangan table...');
    
    // Check if judul_laporan field exists
    console.log('📂 Checking if judul_laporan field exists...');
    const [judulLaporanCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'laporan_keuangan' AND COLUMN_NAME = 'judul_laporan'
    `);
    
    if (judulLaporanCheck.length === 0) {
      await sequelize.query(`
        ALTER TABLE laporan_keuangan 
        ADD COLUMN judul_laporan VARCHAR(255) AFTER id_user
      `);
      console.log('✅ Field judul_laporan berhasil ditambahkan');
    } else {
      console.log('ℹ️  Field judul_laporan sudah ada');
    }
    
    console.log('🎉 Migrasi selesai!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

addJudulLaporanToLaporanKeuanganTable();
