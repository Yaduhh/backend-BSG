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
  host: envConfig.DB_HOST || '192.168.1.6',
  port: envConfig.DB_PORT || 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group'
};

async function removeFormattedContentColumn() {
  const connection = await mysql.createConnection(config);
  try {
    console.log('🔍 Checking if formatted_content column exists...');

    // Check if column exists
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM keuangan_poskas LIKE 'formatted_content'`
    );

    if (columns.length === 0) {
      console.log('✅ Column formatted_content does not exist (already removed)');
      return;
    }

    console.log('🗑️ Removing formatted_content column...');

    // Remove formatted_content column
    await connection.execute(
      `ALTER TABLE keuangan_poskas DROP COLUMN formatted_content`
    );

    console.log('✅ Column formatted_content removed successfully');

    // Verify the column was removed
    const [newColumns] = await connection.execute(
      `SHOW COLUMNS FROM keuangan_poskas LIKE 'formatted_content'`
    );

    if (newColumns.length === 0) {
      console.log('✅ Verification successful: formatted_content column removed');
    } else {
      console.log('❌ Verification failed: formatted_content column still exists');
    }

  } catch (error) {
    console.error('❌ Error removing formatted_content column:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

removeFormattedContentColumn()
  .then(() => {
    console.log('🎉 Database migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database migration failed:', error.message);
    process.exit(1);
  }); 