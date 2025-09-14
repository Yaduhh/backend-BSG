const { sequelize } = require('../config/database');

async function addLampiranToBinaLingkunganTable() {
  try {
    console.log('🚀 Starting migration for data_bina_lingkungan table...');
    
    // Check if lampiran field exists
    console.log('📂 Checking if lampiran field exists...');
    const [lampiranCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'data_bina_lingkungan' AND COLUMN_NAME = 'lampiran'
    `);
    
    if (lampiranCheck.length === 0) {
      await sequelize.query(`
        ALTER TABLE data_bina_lingkungan 
        ADD COLUMN lampiran TEXT AFTER nominal
      `);
      console.log('✅ Field lampiran berhasil ditambahkan');
    } else {
      console.log('ℹ️  Field lampiran sudah ada');
    }
    
    // Check if created_at field exists
    console.log('📂 Checking if created_at field exists...');
    const [createdAtCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'data_bina_lingkungan' AND COLUMN_NAME = 'created_at'
    `);
    
    if (createdAtCheck.length === 0) {
      await sequelize.query(`
        ALTER TABLE data_bina_lingkungan 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status_deleted
      `);
      console.log('✅ Field created_at berhasil ditambahkan');
    } else {
      console.log('ℹ️  Field created_at sudah ada');
    }
    
    // Check if updated_at field exists
    console.log('📂 Checking if updated_at field exists...');
    const [updatedAtCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'data_bina_lingkungan' AND COLUMN_NAME = 'updated_at'
    `);
    
    if (updatedAtCheck.length === 0) {
      await sequelize.query(`
        ALTER TABLE data_bina_lingkungan 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
      `);
      console.log('✅ Field updated_at berhasil ditambahkan');
    } else {
      console.log('ℹ️  Field updated_at sudah ada');
    }
    
    console.log('🎉 Migrasi selesai!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

addLampiranToBinaLingkunganTable();
