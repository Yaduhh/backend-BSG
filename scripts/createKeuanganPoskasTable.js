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

async function createKeuanganPoskasTable() {
  const connection = await mysql.createConnection(config);

  try {
    console.log('Creating keuangan_poskas table...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS keuangan_poskas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_user INT NOT NULL,
        tanggal_poskas DATE NOT NULL,
        isi_poskas TEXT NOT NULL,
        status_deleted TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
    console.log('✅ keuangan_poskas table created successfully!');

    // Add indexes for better performance
    const indexes = [
      'CREATE INDEX idx_keuangan_poskas_user ON keuangan_poskas(id_user)',
      'CREATE INDEX idx_keuangan_poskas_tanggal ON keuangan_poskas(tanggal_poskas)',
      'CREATE INDEX idx_keuangan_poskas_status ON keuangan_poskas(status_deleted)',
      'CREATE INDEX idx_keuangan_poskas_created ON keuangan_poskas(created_at)'
    ];

    for (const indexQuery of indexes) {
      try {
        await connection.execute(indexQuery);
        console.log('✅ Index created successfully');
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('ℹ️  Index already exists, skipping...');
        } else {
          console.error('❌ Error creating index:', error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error creating keuangan_poskas table:', error.message);
  } finally {
    await connection.end();
  }
}

// Run the script
createKeuanganPoskasTable(); 