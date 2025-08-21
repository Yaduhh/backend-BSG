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

async function createDataSupplierTable() {
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

    // Create data_supplier table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS data_supplier (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kategori_supplier ENUM('SUPPLIER OUTLET', 'SUPPLIER TOKO TEPUNG & BB', 'SUPPLIER PRODUKSI', 'SUPPLIER KAMBING') NOT NULL,
        divisi ENUM('PRODUKSI', 'MARKETING', 'OPERASIONAL') NOT NULL,
        nama_supplier VARCHAR(255) NOT NULL,
        no_hp_supplier VARCHAR(20) NOT NULL,
        tanggal_kerjasama DATE NOT NULL,
        npwp VARCHAR(50),
        alamat TEXT NOT NULL,
        keterangan TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        status_deleted TINYINT(1) DEFAULT 0,
        
        INDEX idx_kategori_supplier (kategori_supplier),
        INDEX idx_divisi (divisi),
        INDEX idx_nama_supplier (nama_supplier),
        INDEX idx_status_deleted (status_deleted),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Table data_supplier created successfully');

    // Check if table exists and show structure
    const [tables] = await connection.execute('SHOW TABLES LIKE "data_supplier"');
    if (tables.length > 0) {
      console.log('✅ Table data_supplier exists');
      
      const [columns] = await connection.execute('DESCRIBE data_supplier');
      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    console.log('🎉 Data Supplier table setup completed!');

  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
createDataSupplierTable();
