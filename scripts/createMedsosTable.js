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

async function createMedsosTable() {
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

    // Create medsos table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS medsos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform ENUM('TIKTOK', 'INSTAGRAM', 'YOUTUBE') NOT NULL,
        bulan_tahun VARCHAR(7) NOT NULL,
        follower_saat_ini INT DEFAULT 0,
        follower_bulan_lalu INT DEFAULT 0,
        konten_terupload INT DEFAULT 0,
        story_terupload INT DEFAULT 0,
        konten_terbaik_link TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        status_deleted TINYINT(1) DEFAULT 0,
        
        INDEX idx_platform (platform),
        INDEX idx_bulan_tahun (bulan_tahun),
        INDEX idx_status_deleted (status_deleted),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Table medsos created successfully');

    // Create medsos_kol table for KOL database
    const createKolTableQuery = `
      CREATE TABLE IF NOT EXISTS medsos_kol (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_akun VARCHAR(255) NOT NULL,
        follower_ig INT DEFAULT 0,
        follower_tiktok INT DEFAULT 0,
        ratecard DECIMAL(15,2) DEFAULT 0,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        status_deleted TINYINT(1) DEFAULT 0,
        
        INDEX idx_nama_akun (nama_akun),
        INDEX idx_status_deleted (status_deleted),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createKolTableQuery);
    console.log('✅ Table medsos_kol created successfully');

    // Create medsos_anggaran table for marketing budget
    const createAnggaranTableQuery = `
      CREATE TABLE IF NOT EXISTS medsos_anggaran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform ENUM('TIKTOK', 'INSTAGRAM', 'YOUTUBE') NOT NULL,
        bulan_tahun VARCHAR(7) NOT NULL,
        anggaran DECIMAL(15,2) DEFAULT 0,
        keterangan TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        status_deleted TINYINT(1) DEFAULT 0,
        
        INDEX idx_platform (platform),
        INDEX idx_bulan_tahun (bulan_tahun),
        INDEX idx_status_deleted (status_deleted),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createAnggaranTableQuery);
    console.log('✅ Table medsos_anggaran created successfully');

    // Check if tables exist and show structure
    const tables = ['medsos', 'medsos_kol', 'medsos_anggaran'];
    
    for (const tableName of tables) {
      const [tableExists] = await connection.execute(`SHOW TABLES LIKE "${tableName}"`);
      if (tableExists.length > 0) {
        console.log(`✅ Table ${tableName} exists`);
        
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
        console.log(`📋 ${tableName} structure:`);
        columns.forEach(col => {
          console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
      }
    }

    console.log('🎉 Medsos tables setup completed!');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
createMedsosTable();
