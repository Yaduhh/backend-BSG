const mysql = require('mysql2/promise');
const { getConnection } = require('../config/mysqlPool');

class MedsosKol {
  constructor() {
    this.tableName = 'medsos_kol';
  }

  // Get database connection
  async getConnection() {
    return await getConnection();
  }

  // Get all KOL data
  async getAll() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE status_deleted = 0 ORDER BY created_at DESC`
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Get KOL by ID
  async getById(id) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE id = ? AND status_deleted = 0`,
        [id]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // Create new KOL data
  async create(kolData) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO ${this.tableName} (
          nama_akun, follower_ig, follower_tiktok, ratecard, created_by
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          kolData.nama_akun,
          kolData.follower_ig,
          kolData.follower_tiktok,
          kolData.ratecard,
          kolData.created_by
        ]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  // Update KOL data
  async update(id, kolData) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET 
          nama_akun = ?, follower_ig = ?, follower_tiktok = ?, 
          ratecard = ?, updated_at = NOW()
        WHERE id = ? AND status_deleted = 0`,
        [
          kolData.nama_akun,
          kolData.follower_ig,
          kolData.follower_tiktok,
          kolData.ratecard,
          id
        ]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // Soft delete KOL data
  async delete(id) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET status_deleted = 1, deleted_at = NOW() WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // Get KOL statistics
  async getStats() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
          COUNT(*) as total_kol,
          SUM(follower_ig) as total_follower_ig,
          SUM(follower_tiktok) as total_follower_tiktok,
          SUM(ratecard) as total_ratecard
        FROM ${this.tableName} 
        WHERE status_deleted = 0`
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  // Search KOL data
  async search(query) {
    const connection = await this.getConnection();
    try {
      const searchTerm = `%${query}%`;
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} 
         WHERE status_deleted = 0 
         AND nama_akun LIKE ?
         ORDER BY created_at DESC`,
        [searchTerm]
      );
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = new MedsosKol();
