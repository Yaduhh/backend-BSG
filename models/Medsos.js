const mysql = require('mysql2/promise');
const { getConnection } = require('../config/mysqlPool');

class Medsos {
  constructor() {
    this.tableName = 'medsos';
  }

  // Get database connection
  async getConnection() {
    return await getConnection();
  }

  // Get all medsos data
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

  // Get medsos by ID
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

  // Get medsos by platform
  async getByPlatform(platform) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE platform = ? AND status_deleted = 0 ORDER BY created_at DESC`,
        [platform]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Create new medsos data
  async create(medsosData) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO ${this.tableName} (
          platform, follower_saat_ini, follower_bulan_lalu,
          konten_terupload, story_terupload, konten_terbaik_link, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          medsosData.platform,
          medsosData.follower_saat_ini,
          medsosData.follower_bulan_lalu,
          medsosData.konten_terupload,
          medsosData.story_terupload,
          medsosData.konten_terbaik_link || null,
          medsosData.created_by
        ]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  // Update medsos data
  async update(id, medsosData) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET 
          platform = ?, follower_saat_ini = ?, 
          follower_bulan_lalu = ?, konten_terupload = ?, story_terupload = ?, 
          konten_terbaik_link = ?, updated_at = NOW()
        WHERE id = ? AND status_deleted = 0`,
        [
          medsosData.platform,
          medsosData.follower_saat_ini,
          medsosData.follower_bulan_lalu,
          medsosData.konten_terupload,
          medsosData.story_terupload,
          medsosData.konten_terbaik_link || null,
          id
        ]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // Soft delete medsos data
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

  // Hard delete medsos data
  async hardDelete(id) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // Get medsos statistics
  async getStats() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
          COUNT(*) as total_records,
          COUNT(CASE WHEN platform = 'TIKTOK' THEN 1 END) as tiktok_count,
          COUNT(CASE WHEN platform = 'INSTAGRAM' THEN 1 END) as instagram_count,
          COUNT(CASE WHEN platform = 'YOUTUBE' THEN 1 END) as youtube_count,
          SUM(follower_saat_ini) as total_followers,
          SUM(konten_terupload) as total_konten,
          SUM(story_terupload) as total_story
        FROM ${this.tableName} 
        WHERE status_deleted = 0`
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  // Search medsos data
  async search(query) {
    const connection = await this.getConnection();
    try {
      const searchTerm = `%${query}%`;
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} 
         WHERE status_deleted = 0 
         AND (platform LIKE ? OR konten_terbaik_link LIKE ?)
         ORDER BY created_at DESC`,
        [searchTerm, searchTerm]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Check and fix auto increment
  async checkAndFixAutoIncrement() {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `SELECT MAX(id) as max_id FROM ${this.tableName}`
      );
      const maxId = result[0].max_id || 0;
      
      if (maxId > 0) {
        await connection.execute(
          `ALTER TABLE ${this.tableName} AUTO_INCREMENT = ${maxId + 1}`
        );
      }
      return true;
    } finally {
      connection.release();
    }
  }
}

module.exports = new Medsos();
