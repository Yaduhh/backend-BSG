const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

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

class DataInvestor {
  static async createTable() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS data_investor (
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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    } finally {
      await connection.end();
    }
  }

  static async getAllInvestors() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [rows] = await connection.execute(`
        SELECT * FROM data_investor 
        WHERE status_deleted = 0
        ORDER BY created_at DESC
      `);
      return rows;
    } finally {
      await connection.end();
    }
  }

  static async getInvestorsByTipe(tipe) {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [rows] = await connection.execute(`
        SELECT * FROM data_investor 
        WHERE tipe_data = ? AND status_deleted = 0
        ORDER BY created_at DESC
      `, [tipe]);
      return rows;
    } finally {
      await connection.end();
    }
  }

  static async getInvestorsByOutlet(outlet) {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [rows] = await connection.execute(`
        SELECT * FROM data_investor 
        WHERE outlet = ? AND status_deleted = 0
        ORDER BY created_at DESC
      `, [outlet]);
      return rows;
    } finally {
      await connection.end();
    }
  }

  static async getUniqueOutlets() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [rows] = await connection.execute(`
        SELECT DISTINCT outlet FROM data_investor 
        WHERE status_deleted = 0 
        ORDER BY outlet
      `);
      return rows.map(row => row.outlet);
    } finally {
      await connection.end();
    }
  }

  static async getInvestorById(id) {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [rows] = await connection.execute(`
        SELECT * FROM data_investor WHERE id = ? AND status_deleted = 0
      `, [id]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      await connection.end();
    }
  }

  static async createInvestor(data) {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const {
        outlet,
        nama_investor,
        ttl_investor,
        no_hp,
        alamat,
        tanggal_join,
        kontak_darurat,
        nama_pasangan,
        nama_anak,
        investasi_di_outlet,
        persentase_bagi_hasil,
        tipe_data,
        created_by
      } = data;

      const [result] = await connection.execute(`
        INSERT INTO data_investor (
          outlet, nama_investor, ttl_investor, no_hp, alamat, 
          tanggal_join, kontak_darurat, nama_pasangan, nama_anak, 
          investasi_di_outlet, persentase_bagi_hasil, tipe_data, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        outlet,
        nama_investor,
        ttl_investor,
        no_hp,
        alamat,
        tanggal_join,
        kontak_darurat,
        nama_pasangan,
        nama_anak,
        investasi_di_outlet,
        persentase_bagi_hasil,
        tipe_data || 'outlet',
        created_by
      ]);
      
      return result.insertId;
    } finally {
      await connection.end();
    }
  }

  static async updateInvestor(id, data) {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const {
        outlet,
        nama_investor,
        ttl_investor,
        no_hp,
        alamat,
        tanggal_join,
        kontak_darurat,
        nama_pasangan,
        nama_anak,
        investasi_di_outlet,
        persentase_bagi_hasil,
        tipe_data
      } = data;

      const [result] = await connection.execute(`
        UPDATE data_investor SET
          outlet = ?, nama_investor = ?, ttl_investor = ?, no_hp = ?, 
          alamat = ?, tanggal_join = ?, kontak_darurat = ?, nama_pasangan = ?, 
          nama_anak = ?, investasi_di_outlet = ?, persentase_bagi_hasil = ?, tipe_data = ?
        WHERE id = ?
      `, [
        outlet,
        nama_investor,
        ttl_investor,
        no_hp,
        alamat,
        tanggal_join,
        kontak_darurat,
        nama_pasangan,
        nama_anak,
        investasi_di_outlet,
        persentase_bagi_hasil,
        tipe_data || 'outlet',
        id
      ]);
      
      return result.affectedRows > 0;
    } finally {
      await connection.end();
    }
  }

  static async deleteInvestor(id) {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [result] = await connection.execute(`
        UPDATE data_investor SET status_deleted = 1 WHERE id = ?
      `, [id]);
      
      return result.affectedRows > 0;
    } finally {
      await connection.end();
    }
  }
}

module.exports = DataInvestor;
