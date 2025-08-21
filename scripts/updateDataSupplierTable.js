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

async function updateDataSupplierTable() {
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

    // Check if table exists
    const [tables] = await connection.execute('SHOW TABLES LIKE "data_supplier"');
    if (tables.length === 0) {
      console.log('❌ Table data_supplier does not exist. Please run createDataSupplierTable.js first.');
      return;
    }

    console.log('✅ Table data_supplier exists');

    // Check current ENUM values
    const [columns] = await connection.execute('DESCRIBE data_supplier');
    const kategoriColumn = columns.find(col => col.Field === 'kategori_supplier');
    
    if (kategoriColumn) {
      console.log('📋 Current kategori_supplier ENUM:', kategoriColumn.Type);
      
      // Check if SUPPLIER KAMBING already exists
      if (kategoriColumn.Type.includes("'SUPPLIER KAMBING'")) {
        console.log('✅ SUPPLIER KAMBING already exists in ENUM');
        return;
      }
    }

    // Update ENUM to include SUPPLIER KAMBING
    console.log('🔄 Updating ENUM to include SUPPLIER KAMBING...');
    
    const updateEnumQuery = `
      ALTER TABLE data_supplier 
      MODIFY COLUMN kategori_supplier ENUM('SUPPLIER OUTLET', 'SUPPLIER TOKO TEPUNG & BB', 'SUPPLIER PRODUKSI', 'SUPPLIER KAMBING') NOT NULL
    `;

    await connection.execute(updateEnumQuery);
    console.log('✅ ENUM updated successfully');

    // Verify the update
    const [updatedColumns] = await connection.execute('DESCRIBE data_supplier');
    const updatedKategoriColumn = updatedColumns.find(col => col.Field === 'kategori_supplier');
    
    if (updatedKategoriColumn) {
      console.log('📋 Updated kategori_supplier ENUM:', updatedKategoriColumn.Type);
    }

    console.log('🎉 Data Supplier table update completed!');

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
updateDataSupplierTable();
