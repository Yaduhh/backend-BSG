const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../.env');
let envConfig = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const cleanContent = envContent
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  cleanContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value !== undefined) {
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        envConfig[cleanKey] = cleanValue;
      }
    }
  });
}

require('dotenv').config();

const DB_HOST = envConfig.DB_HOST || process.env.DB_HOST || 'localhost';
const DB_PORT = envConfig.DB_PORT || process.env.DB_PORT || 3306;
const DB_USER = envConfig.DB_USER || process.env.DB_USER || 'root';
const DB_PASSWORD = envConfig.DB_PASSWORD || process.env.DB_PASSWORD || '';
const DB_NAME = envConfig.DB_NAME || process.env.DB_NAME || 'sistem_bosgil_group';

async function updateDataSewaTableToString() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: parseInt(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log('🔧 Connected to database:', DB_NAME);

    // Update jangka_waktu_sewa from INT to VARCHAR
    const updateJangkaWaktuQuery = `
      ALTER TABLE data_sewa 
      MODIFY COLUMN jangka_waktu_sewa VARCHAR(255) NOT NULL COMMENT 'Jangka waktu sewa (contoh: 10 TAHUN, 2 BULAN)';
    `;

    await connection.execute(updateJangkaWaktuQuery);
    console.log('✅ Updated jangka_waktu_sewa to VARCHAR');

    // Update harga_sewa from DECIMAL to VARCHAR
    const updateHargaSewaQuery = `
      ALTER TABLE data_sewa 
      MODIFY COLUMN harga_sewa VARCHAR(255) NOT NULL COMMENT 'Harga sewa (contoh: 1 M/TAHUN, 200 JT/TAHUN)';
    `;

    await connection.execute(updateHargaSewaQuery);
    console.log('✅ Updated harga_sewa to VARCHAR');

    // Check table structure
    const [columns] = await connection.execute('DESCRIBE data_sewa');
    console.log('📋 Updated table structure:');
    columns.forEach(col => {
      if (col.Field === 'jangka_waktu_sewa' || col.Field === 'harga_sewa') {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      }
    });

    console.log('🎉 Data Sewa table updated to use STRING fields!');

  } catch (error) {
    console.error('❌ Error updating table:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
updateDataSewaTableToString();
