const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bosgil_group'
};

async function addLampiranAhliWarisToInvestorTable() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔄 Menambahkan field lampiran dan ahli_waris ke tabel data_investor...');
    
    // Check if lampiran field exists
    const [lampiranCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'data_investor' AND COLUMN_NAME = 'lampiran'
    `, [dbConfig.database]);
    
    if (lampiranCheck.length === 0) {
      await connection.execute(`
        ALTER TABLE data_investor 
        ADD COLUMN lampiran TEXT AFTER nama_anak
      `);
      console.log('✅ Field lampiran berhasil ditambahkan');
    } else {
      console.log('ℹ️  Field lampiran sudah ada');
    }
    
    // Check if ahli_waris field exists
    const [ahliWarisCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'data_investor' AND COLUMN_NAME = 'ahli_waris'
    `, [dbConfig.database]);
    
    if (ahliWarisCheck.length === 0) {
      await connection.execute(`
        ALTER TABLE data_investor 
        ADD COLUMN ahli_waris VARCHAR(100) AFTER nama_anak
      `);
      console.log('✅ Field ahli_waris berhasil ditambahkan');
    } else {
      console.log('ℹ️  Field ahli_waris sudah ada');
    }
    
    console.log('🎉 Migrasi selesai!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

addLampiranAhliWarisToInvestorTable();
