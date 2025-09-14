const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bosgil_group'
};

async function addLampiranStatusDeletedToBinaLingkunganTable() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔄 Menambahkan field lampiran dan status_deleted ke tabel data_bina_lingkungan...');
    
    // Check if lampiran field exists
    const [lampiranCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'data_bina_lingkungan' AND COLUMN_NAME = 'lampiran'
    `, [dbConfig.database]);
    
    if (lampiranCheck.length === 0) {
      await connection.execute(`
        ALTER TABLE data_bina_lingkungan 
        ADD COLUMN lampiran TEXT AFTER nominal
      `);
      console.log('✅ Field lampiran berhasil ditambahkan');
    } else {
      console.log('ℹ️  Field lampiran sudah ada');
    }
    
    // Check if status_deleted field exists
    const [statusDeletedCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'data_bina_lingkungan' AND COLUMN_NAME = 'status_deleted'
    `, [dbConfig.database]);
    
    if (statusDeletedCheck.length === 0) {
      await connection.execute(`
        ALTER TABLE data_bina_lingkungan 
        ADD COLUMN status_deleted TINYINT(1) DEFAULT 0 AFTER lampiran
      `);
      console.log('✅ Field status_deleted berhasil ditambahkan');
    } else {
      console.log('ℹ️  Field status_deleted sudah ada');
    }
    
    // Check if created_at field exists
    const [createdAtCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'data_bina_lingkungan' AND COLUMN_NAME = 'created_at'
    `, [dbConfig.database]);
    
    if (createdAtCheck.length === 0) {
      await connection.execute(`
        ALTER TABLE data_bina_lingkungan 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status_deleted
      `);
      console.log('✅ Field created_at berhasil ditambahkan');
    } else {
      console.log('ℹ️  Field created_at sudah ada');
    }
    
    // Check if updated_at field exists
    const [updatedAtCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'data_bina_lingkungan' AND COLUMN_NAME = 'updated_at'
    `, [dbConfig.database]);
    
    if (updatedAtCheck.length === 0) {
      await connection.execute(`
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
    await connection.end();
  }
}

addLampiranStatusDeletedToBinaLingkunganTable();
