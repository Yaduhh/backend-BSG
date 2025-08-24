const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca file .env secara manual
const envPath = path.join(__dirname, '../.env');
const configPath = path.join(__dirname, '../config.env');
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
        const cleanKey = key.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        const cleanValue = value.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        envConfig[cleanKey] = cleanValue;
      }
    }
  });
} else if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  const cleanContent = configContent
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  cleanContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value !== undefined) {
        const cleanKey = key.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        const cleanValue = value.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        envConfig[cleanKey] = cleanValue;
      }
    }
  });
}

require('dotenv').config();

const dbConfig = {
  host: envConfig.DB_HOST || process.env.DB_HOST,
  port: envConfig.DB_PORT || process.env.DB_PORT,
  user: envConfig.DB_USER || process.env.DB_USER,
  password: envConfig.DB_PASSWORD || process.env.DB_PASSWORD,
  database: envConfig.DB_NAME || process.env.DB_NAME
};

async function addSoftDeleteToInvestorTable() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log("Adding soft delete fields to data_investor table...");
    
    // Add status_deleted column
    await connection.execute(`
      ALTER TABLE data_investor 
      ADD COLUMN status_deleted TINYINT(1) DEFAULT 0 
      AFTER tipe_data
    `);
    
    console.log("✅ status_deleted column added successfully!");
    
    // Check if created_by column exists
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM data_investor LIKE 'created_by'
    `);
    
    if (columns.length === 0) {
      // Add created_by column if not exists
      await connection.execute(`
        ALTER TABLE data_investor 
        ADD COLUMN created_by INT 
        AFTER status_deleted
      `);
      console.log("✅ created_by column added successfully!");
    } else {
      console.log("✅ created_by column already exists!");
    }
    
    // Add index for better performance
    await connection.execute(`
      ALTER TABLE data_investor 
      ADD INDEX idx_status_deleted (status_deleted),
      ADD INDEX idx_created_by (created_by)
    `);
    
    console.log("✅ Indexes added successfully!");
    
  } catch (error) {
    console.error("Error adding soft delete fields:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

addSoftDeleteToInvestorTable()
  .then(() => {
    console.log("Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
