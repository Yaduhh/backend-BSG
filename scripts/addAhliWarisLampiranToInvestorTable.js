const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

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

(async function run() {
  const dbConfig = {
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to DB:", dbConfig.database);

    // Helper: check if column exists
    const columnExists = async (colName) => {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) AS cnt
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'data_investor'
           AND COLUMN_NAME = ?`,
        [colName]
      );
      return rows[0].cnt > 0;
    };

    // Ensure table exists (optional safe-guard)
    await connection.execute(`CREATE TABLE IF NOT EXISTS data_investor (
      id INT AUTO_INCREMENT PRIMARY KEY,
      outlet VARCHAR(100) NOT NULL,
      nama_investor VARCHAR(255) NOT NULL,
      ttl_investor VARCHAR(100),
      no_hp VARCHAR(20),
      alamat TEXT,
      tanggal_join DATE,
      kontak_darurat VARCHAR(20),
      nama_pasangan VARCHAR(100),
      nama_anak TEXT,
      investasi_di_outlet DECIMAL(15,2),
      persentase_bagi_hasil VARCHAR(50),
      tipe_data ENUM('outlet', 'biodata') DEFAULT 'outlet',
      status_deleted TINYINT(1) DEFAULT 0,
      created_by INT(11) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Add ahli_waris
    if (!(await columnExists("ahli_waris"))) {
      console.log("Adding column ahli_waris ...");
      await connection.execute(
        "ALTER TABLE data_investor ADD COLUMN `ahli_waris` VARCHAR(150) DEFAULT NULL AFTER `nama_anak`"
      );
      console.log("Column ahli_waris added.");
    } else {
      console.log("Column ahli_waris already exists. Skipped.");
    }

    // Add lampiran (TEXT to store JSON array of URLs/objects)
    if (!(await columnExists("lampiran"))) {
      console.log("Adding column lampiran ...");
      await connection.execute(
        "ALTER TABLE data_investor ADD COLUMN `lampiran` TEXT DEFAULT NULL AFTER `ahli_waris`"
      );
      console.log("Column lampiran added.");
    } else {
      console.log("Column lampiran already exists. Skipped.");
    }

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
})();
