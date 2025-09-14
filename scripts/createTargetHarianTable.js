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

async function createTargetHarianTable() {
  let connection;

  try {
    console.log('🚀 Starting target table creation...');

    // Create connection
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: parseInt(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log('✅ Database connected successfully');

    // Drop table if exists and recreate
    await connection.execute('DROP TABLE IF EXISTS taget');
    console.log('🗑️ Dropped existing table');

    // Create table (mirror omset_harian structure, but columns renamed for target)
    const createTableQuery = `
      CREATE TABLE taget (
        id int(11) NOT NULL AUTO_INCREMENT,
        id_user int(11) NOT NULL,
        tanggal_target date NOT NULL,
        isi_target text COLLATE utf8mb4_unicode_ci NOT NULL,
        images longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
        status_deleted tinyint(1) DEFAULT '0',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_taget_user (id_user),
        KEY idx_taget_tanggal (tanggal_target),
        KEY idx_taget_status (status_deleted),
        KEY idx_taget_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Table target created successfully');

    // Insert sample data
    try {
      await connection.execute('TRUNCATE TABLE taget');
    } catch (e) {
      await connection.execute('DELETE FROM taget');
      await connection.execute('ALTER TABLE taget AUTO_INCREMENT = 1');
    }

    const sampleData = [
      { id_user: 1, tanggal_target: '2025-01-15', isi_target: 'Target harian untuk meningkatkan penjualan produk utama.' },
      { id_user: 2, tanggal_target: '2025-01-16', isi_target: 'Fokus pada promosi produk baru dan engagement customer.' },
      { id_user: 1, tanggal_target: '2025-01-17', isi_target: 'Target mingguan untuk mencapai target bulanan.' }
    ];

    for (const d of sampleData) {
      const insertQuery = `
        INSERT INTO taget (id_user, tanggal_target, isi_target, status_deleted, created_at, updated_at)
        VALUES (?, ?, ?, 0, NOW(), NOW())
      `;
      await connection.execute(insertQuery, [d.id_user, d.tanggal_target, d.isi_target]);
    }

    console.log('✅ Sample data for target inserted');

    // Verify table structure
    const [columns] = await connection.execute('DESCRIBE taget');
    console.log('📋 Table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    const [countRows] = await connection.execute('SELECT COUNT(*) as cnt FROM taget WHERE status_deleted = 0');
    console.log(`📊 Total records: ${countRows[0].cnt}`);

    console.log('🎉 Target table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error creating taget table:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

createTargetHarianTable();
