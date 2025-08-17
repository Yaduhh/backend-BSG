const { Sequelize, Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Baca file .env secara manual
const envPath = path.join(__dirname, '../.env');
const configPath = path.join(__dirname, '../config.env');
let envConfig = {};

if (fs.existsSync(envPath)) {
  // Baca file dengan encoding yang benar
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Bersihkan BOM dan karakter aneh
  const cleanContent = envContent
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n');

  console.log('📄 Reading .env file from:', envPath);

  cleanContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value !== undefined) {
        const cleanKey = key.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
        const cleanValue = value.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
        envConfig[cleanKey] = cleanValue;
        console.log(`📝 Parsed: ${cleanKey} = ${cleanValue}`);
      }
    }
  });

  console.log('📝 Final envConfig:', envConfig);
} else if (fs.existsSync(configPath)) {
  // Baca file config.env sebagai alternatif
  const configContent = fs.readFileSync(configPath, 'utf8');

  // Bersihkan BOM dan karakter aneh
  const cleanContent = configContent
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n');

  console.log('📄 Reading config.env file from:', configPath);

  cleanContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value !== undefined) {
        const cleanKey = key.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
        const cleanValue = value.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
        envConfig[cleanKey] = cleanValue;
        console.log(`📝 Parsed: ${cleanKey} = ${cleanValue}`);
      }
    }
  });

  console.log('📝 Final envConfig:', envConfig);
} else {
  console.log('❌ .env file not found at:', envPath);
  console.log('❌ config.env file not found at:', configPath);
}

// Load dotenv juga sebagai backup
require('dotenv').config();

// Ambil config dari .env file
const DB_NAME = envConfig.DB_NAME || process.env.DB_NAME;
const DB_HOST = envConfig.DB_HOST || process.env.DB_HOST;
const DB_USER = envConfig.DB_USER || process.env.DB_USER;
const DB_PASSWORD = envConfig.DB_PASSWORD || process.env.DB_PASSWORD;
const DB_PORT = envConfig.DB_PORT || process.env.DB_PORT;
const DB_DIALECT = envConfig.DB_DIALECT || process.env.DB_DIALECT;

// Validasi config
if (!DB_NAME || !DB_HOST || !DB_USER || !DB_DIALECT) {
  throw new Error('Database configuration tidak lengkap. Pastikan file .env berisi DB_NAME, DB_HOST, DB_USER, dan DB_DIALECT');
}

console.log('🔧 Environment Variables from .env file:');
console.log('DB_NAME:', DB_NAME);
console.log('DB_HOST:', DB_HOST);
console.log('DB_USER:', DB_USER);
console.log('DB_PASSWORD:', DB_PASSWORD);
console.log('DB_DIALECT:', DB_DIALECT);

const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  {
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

// Test koneksi database
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful.');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

module.exports = { sequelize, Op, testConnection }; 