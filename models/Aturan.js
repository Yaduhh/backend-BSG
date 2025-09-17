const path = require('path');
const fs = require('fs');

// Baca file .env secara manual (mengikuti pola KeuanganPoskas)
const envPath = path.join(__dirname, '../.env');
let envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value !== undefined) envConfig[key.trim()] = value.trim();
    }
  });
}

class AturanModel {
  constructor() {
    this.tableName = 'aturan';
  }

  async getConnection() {
    const { getConnection } = require('../config/mysqlPool');
    return await getConnection();
  }

  // Utilities
  async getNextRecordId() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(`SELECT MAX(id) as max_id FROM ${this.tableName}`);
      const maxId = rows[0]?.max_id || 0;
      return maxId + 1;
    } finally {
      connection.release();
    }
  }

  // CRUD
  async getAll() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT a.*, u.nama as user_nama
         FROM ${this.tableName} a
         LEFT JOIN users u ON a.id_user = u.id
         WHERE a.status_deleted = 0
         ORDER BY a.created_at DESC`
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
        `SELECT a.*, u.nama as user_nama
         FROM ${this.tableName} a
         LEFT JOIN users u ON a.id_user = u.id
         WHERE a.id = ? AND a.status_deleted = 0`,
        [id]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async search(term) {
    const connection = await this.getConnection();
    try {
      const like = `%${term}%`;
      const [rows] = await connection.execute(
        `SELECT a.*, u.nama as user_nama
         FROM ${this.tableName} a
         LEFT JOIN users u ON a.id_user = u.id
         WHERE a.status_deleted = 0
           AND (a.judul_aturan LIKE ? OR a.isi_aturan LIKE ? OR u.nama LIKE ?)
         ORDER BY a.created_at DESC`,
        [like, like, like]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async create(data) {
    const connection = await this.getConnection();
    try {
      const { id_user, tanggal_aturan, judul_aturan, isi_aturan, images } = data;
      const [res] = await connection.execute(
        `INSERT INTO ${this.tableName}
         (id_user, tanggal_aturan, judul_aturan, isi_aturan, images, status_deleted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [id_user, tanggal_aturan, judul_aturan, isi_aturan ?? null, images ? JSON.stringify(images) : null]
      );
      const insertedId = res.insertId;
      return await this.getById(insertedId);
    } finally {
      connection.release();
    }
  }

  async update(id, data) {
    const connection = await this.getConnection();
    try {
      const { tanggal_aturan, judul_aturan, isi_aturan, images } = data;
      const [res] = await connection.execute(
        `UPDATE ${this.tableName}
         SET tanggal_aturan = ?, judul_aturan = ?, isi_aturan = ?, images = ?, updated_at = NOW()
         WHERE id = ? AND status_deleted = 0`,
        [tanggal_aturan, judul_aturan, isi_aturan ?? null, images ? JSON.stringify(images) : null, id]
      );
      if (res.affectedRows === 0) {
        throw new Error('Aturan not found or already deleted');
      }
      return await this.getById(id);
    } finally {
      connection.release();
    }
  }

  async delete(id) {
    const connection = await this.getConnection();
    try {
      const [res] = await connection.execute(
        `UPDATE ${this.tableName} SET status_deleted = 1, updated_at = NOW() WHERE id = ? AND status_deleted = 0`,
        [id]
      );
      if (res.affectedRows === 0) {
        throw new Error('Aturan not found or already deleted');
      }
      return { success: true };
    } finally {
      connection.release();
    }
  }
}

module.exports = new AturanModel();
