const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca file .env secara manual
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

const config = {
  host: envConfig.DB_HOST || 'localhost',
  port: envConfig.DB_PORT || 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group'
};

class KeuanganPoskas {
  constructor() {
    this.tableName = 'keuangan_poskas';
  }

  // Get database connection
  async getConnection() {
    return await mysql.createConnection(config);
  }

  // Get all keuangan poskas (not deleted)
  async getAll() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE kp.status_deleted = 0 
         ORDER BY kp.created_at DESC`
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Get keuangan poskas by ID
  async getById(id) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE kp.id = ? AND kp.status_deleted = 0`,
        [id]
      );
      return rows[0] || null;
    } finally {
      await connection.end();
    }
  }

  // Get keuangan poskas by user ID
  async getByUserId(userId) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE kp.id_user = ? AND kp.status_deleted = 0 
         ORDER BY kp.created_at DESC`,
        [userId]
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Get keuangan poskas by date range
  async getByDateRange(startDate, endDate) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE kp.tanggal_poskas BETWEEN ? AND ? AND kp.status_deleted = 0 
         ORDER BY kp.tanggal_poskas DESC`,
        [startDate, endDate]
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Create new keuangan poskas
  async create(data) {
    const connection = await this.getConnection();
    try {
      const { id_user, tanggal_poskas, isi_poskas } = data;
      
      const [result] = await connection.execute(
        `INSERT INTO ${this.tableName} (id_user, tanggal_poskas, isi_poskas) 
         VALUES (?, ?, ?)`,
        [id_user, tanggal_poskas, isi_poskas]
      );
      
      return {
        id: result.insertId,
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      };
    } finally {
      await connection.end();
    }
  }

  // Update keuangan poskas
  async update(id, data) {
    const connection = await this.getConnection();
    try {
      const { tanggal_poskas, isi_poskas } = data;
      
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} 
         SET tanggal_poskas = ?, isi_poskas = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND status_deleted = 0`,
        [tanggal_poskas, isi_poskas, id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Keuangan poskas not found or already deleted');
      }
      
      return await this.getById(id);
    } finally {
      await connection.end();
    }
  }

  // Soft delete keuangan poskas
  async delete(id) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} 
         SET status_deleted = 1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND status_deleted = 0`,
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Keuangan poskas not found or already deleted');
      }
      
      return { success: true, message: 'Keuangan poskas deleted successfully' };
    } finally {
      await connection.end();
    }
  }

  // Hard delete keuangan poskas (permanent)
  async hardDelete(id) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Keuangan poskas not found');
      }
      
      return { success: true, message: 'Keuangan poskas permanently deleted' };
    } finally {
      await connection.end();
    }
  }

  // Get statistics/summary
  async getSummary() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
           COUNT(*) as total_entries,
           COUNT(DISTINCT id_user) as total_users,
           MIN(tanggal_poskas) as earliest_date,
           MAX(tanggal_poskas) as latest_date
         FROM ${this.tableName} 
         WHERE status_deleted = 0`
      );
      
      return rows[0];
    } finally {
      await connection.end();
    }
  }

  // Get keuangan poskas by month
  async getByMonth(year, month) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE YEAR(kp.tanggal_poskas) = ? 
         AND MONTH(kp.tanggal_poskas) = ? 
         AND kp.status_deleted = 0 
         ORDER BY kp.tanggal_poskas DESC`,
        [year, month]
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Search keuangan poskas
  async search(searchTerm) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE (kp.isi_poskas LIKE ? OR u.nama LIKE ?) 
         AND kp.status_deleted = 0 
         ORDER BY kp.created_at DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows;
    } finally {
      await connection.end();
    }
  }
}

module.exports = new KeuanganPoskas(); 