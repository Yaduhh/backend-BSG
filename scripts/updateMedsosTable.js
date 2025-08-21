const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Read environment variables
const envPath = path.join(__dirname, '..', 'config.env');
let envConfig = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envConfig[key.trim()] = value.trim();
    }
  });
}

const config = {
  host: envConfig.DB_HOST || process.env.DB_HOST || 'localhost',
  user: envConfig.DB_USER || process.env.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || process.env.DB_PASSWORD || '',
  database: envConfig.DB_NAME || process.env.DB_NAME || 'bosgil_group',
  port: envConfig.DB_PORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function updateMedsosTable() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database successfully');

    // Check if medsos table exists
    const [tables] = await connection.execute('SHOW TABLES LIKE "medsos"');
    if (tables.length === 0) {
      console.log('❌ Table medsos does not exist');
      return;
    }

    console.log('📋 Checking current table structure...');
    const [columns] = await connection.execute('DESCRIBE medsos');
    const hasBulanTahun = columns.some(col => col.Field === 'bulan_tahun');
    
    if (hasBulanTahun) {
      console.log('🗑️ Removing bulan_tahun column from medsos table...');
      await connection.execute('ALTER TABLE medsos DROP COLUMN bulan_tahun');
      console.log('✅ Successfully removed bulan_tahun column from medsos table');
    } else {
      console.log('ℹ️ bulan_tahun column does not exist in medsos table');
    }

    console.log('✅ Table medsos updated successfully');

  } catch (error) {
    console.error('❌ Error updating medsos table:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

updateMedsosTable();
