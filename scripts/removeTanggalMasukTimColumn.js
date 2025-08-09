const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca file .env secara manual
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

const config = {
  host: envConfig.DB_HOST || 'localhost',
  port: envConfig.DB_PORT || 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group'
};

async function removeTanggalMasukTimColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL database');

    // Remove column from tim_merah table
    const removeFromTimMerahQuery = `
      ALTER TABLE tim_merah 
      DROP COLUMN tanggal_masuk_tim;
    `;

    await connection.execute(removeFromTimMerahQuery);
    console.log('✅ Column tanggal_masuk_tim removed from tim_merah table');

    // Remove column from tim_biru table
    const removeFromTimBiruQuery = `
      ALTER TABLE tim_biru 
      DROP COLUMN tanggal_masuk_tim;
    `;

    await connection.execute(removeFromTimBiruQuery);
    console.log('✅ Column tanggal_masuk_tim removed from tim_biru table');

    console.log('🎉 tanggal_masuk_tim columns removed successfully!');

  } catch (error) {
    console.error('❌ Error removing columns:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
removeTanggalMasukTimColumn();
