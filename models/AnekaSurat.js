const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

class AnekaSurat {
  constructor() {
    this.tableName = 'aneka_surat';
  }

  async getConnection() {
    return await mysql.createConnection(dbConfig);
  }

  async getAll() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT as.*, u.nama as user_nama 
         FROM ${this.tableName} as 
         LEFT JOIN users u ON as.id_user = u.id 
         WHERE as.status_deleted = 0 
         ORDER BY as.created_at DESC`
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async getById(id) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT as.*, u.nama as user_nama 
         FROM ${this.tableName} as 
         LEFT JOIN users u ON as.id_user = u.id 
         WHERE as.id = ? AND as.status_deleted = 0`,
        [id]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async getByType(type) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT as.*, u.nama as user_nama 
         FROM ${this.tableName} as 
         LEFT JOIN users u ON as.id_user = u.id 
         WHERE as.jenis_dokumen = ? AND as.status_deleted = 0 
         ORDER BY as.created_at DESC`,
        [type]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async create(data) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO ${this.tableName} 
         (jenis_dokumen, judul_dokumen, lampiran, id_user, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [
          data.jenis_dokumen,
          data.judul_dokumen,
          data.lampiran,
          data.id_user,
        ]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  async update(id, data) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} 
         SET jenis_dokumen = ?, judul_dokumen = ?, lampiran = ?, updated_at = NOW() 
         WHERE id = ? AND status_deleted = 0`,
        [
          data.jenis_dokumen,
          data.judul_dokumen,
          data.lampiran,
          id,
        ]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async delete(id) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} 
         SET status_deleted = 1, updated_at = NOW() 
         WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async getDocumentTypes() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT DISTINCT jenis_dokumen, COUNT(*) as total 
         FROM ${this.tableName} 
         WHERE status_deleted = 0 
         GROUP BY jenis_dokumen`
      );
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = AnekaSurat;
