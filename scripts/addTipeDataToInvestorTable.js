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

async function addTipeDataToInvestorTable() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log("Adding tipe_data column to data_investor table...");
    
    // Add tipe_data column
    await connection.execute(`
      ALTER TABLE data_investor 
      ADD COLUMN tipe_data ENUM('outlet', 'biodata') DEFAULT 'outlet' 
      AFTER persentase_bagi_hasil
    `);
    
    console.log("✅ tipe_data column added successfully!");
    
    // Update existing data based on completeness
    console.log("Updating existing data...");
    
    // Data dengan field kosong = outlet, data lengkap = biodata
    await connection.execute(`
      UPDATE data_investor 
      SET tipe_data = CASE 
        WHEN (ttl_investor IS NULL OR ttl_investor = '') 
          AND (no_hp IS NULL OR no_hp = '') 
          AND (alamat IS NULL OR alamat = '') 
          AND (kontak_darurat IS NULL OR kontak_darurat = '') 
          AND (nama_pasangan IS NULL OR nama_pasangan = '') 
          AND (nama_anak IS NULL OR nama_anak = '') 
          AND (investasi_di_outlet IS NULL OR investasi_di_outlet = 0)
        THEN 'outlet'
        ELSE 'biodata'
      END
    `);
    
    console.log("✅ Existing data updated successfully!");
    
  } catch (error) {
    console.error("Error adding tipe_data column:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

addTipeDataToInvestorTable()
  .then(() => {
    console.log("Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
