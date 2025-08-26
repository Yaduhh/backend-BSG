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
  host: envConfig.DB_HOST || '192.168.66.232',
  port: envConfig.DB_PORT || 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group'
};

async function addFormattedContentColumns() {
  const connection = await mysql.createConnection(config);

  try {
    console.log('🔄 Menambahkan kolom formatted_content dan images ke tabel keuangan_poskas...');

    // Check if columns already exist
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM keuangan_poskas LIKE 'formatted_content'`
    );

    if (columns.length === 0) {
      // Add formatted_content column
      await connection.execute(
        `ALTER TABLE keuangan_poskas 
         ADD COLUMN formatted_content TEXT NULL AFTER isi_poskas`
      );
      console.log('✅ Kolom formatted_content berhasil ditambahkan');
    } else {
      console.log('ℹ️  Kolom formatted_content sudah ada');
    }

    // Check if images column exists
    const [imageColumns] = await connection.execute(
      `SHOW COLUMNS FROM keuangan_poskas LIKE 'images'`
    );

    if (imageColumns.length === 0) {
      // Add images column
      await connection.execute(
        `ALTER TABLE keuangan_poskas 
         ADD COLUMN images JSON NULL AFTER formatted_content`
      );
      console.log('✅ Kolom images berhasil ditambahkan');
    } else {
      console.log('ℹ️  Kolom images sudah ada');
    }

    console.log('🎉 Semua kolom berhasil ditambahkan ke tabel keuangan_poskas!');

  } catch (error) {
    console.error('❌ Error menambahkan kolom:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
addFormattedContentColumns()
  .then(() => {
    console.log('✅ Script selesai dijalankan');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script gagal:', error);
    process.exit(1);
  }); 