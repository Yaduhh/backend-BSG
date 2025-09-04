const mysql = require('mysql2/promise');
const { getConnection } = require('../config/mysqlPool');

class DataSewa {
  constructor() {
    this.tableName = 'data_sewa';
  }

  // Get database connection
  async getConnection() {
    return await getConnection();
  }

  // Get all rental data
  async getAll() {
    console.log('🔍 DataSewa.getAll() called');
    const connection = await this.getConnection();
    try {
      console.log('🔍 Executing query:', `SELECT * FROM ${this.tableName} WHERE status_deleted = 0 ORDER BY created_at DESC`);
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE status_deleted = 0 ORDER BY created_at DESC`
      );
      console.log('📊 DataSewa.getAll() result:', rows);
      console.log('📊 DataSewa.getAll() row count:', rows.length);
      return rows;
    } catch (error) {
      console.error('❌ DataSewa.getAll() error:', error);
      throw error;
    } finally {
      connection.release();
      console.log('🔌 DataSewa.getAll() connection released');
    }
  }

  // Get rental data by ID
  async getById(id) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE id = ? AND status_deleted = 0`,
        [id]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  // Get rental data by category
  async getByCategory(kategori) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE kategori_sewa = ? AND status_deleted = 0 ORDER BY created_at DESC`,
        [kategori]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Create new rental data
  async create(sewaData) {
    console.log('📊 DataSewa.create() called with data:', sewaData);
    const connection = await this.getConnection();
    try {
      console.log('🔗 Database connection established');
      const [result] = await connection.execute(
        `INSERT INTO ${this.tableName} (
          nama_aset, jenis_aset, jangka_waktu_sewa, harga_sewa, 
          nama_pemilik, no_hp_pemilik, alamat_pemilik, mulai_sewa, berakhir_sewa, 
          penanggung_jawab_pajak, foto_aset, kategori_sewa, keterangan, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sewaData.nama_aset,
          sewaData.jenis_aset,
          sewaData.jangka_waktu_sewa, // Now VARCHAR, no parsing needed
          sewaData.harga_sewa, // Now VARCHAR, no parsing needed
          sewaData.nama_pemilik,
          sewaData.no_hp_pemilik,
          sewaData.alamat_pemilik,
          sewaData.mulai_sewa,
          sewaData.berakhir_sewa,
          sewaData.penanggung_jawab_pajak,
          sewaData.foto_aset || null,
          sewaData.kategori_sewa,
          sewaData.keterangan || null,
          sewaData.created_by
        ]
      );
      console.log('✅ Data inserted successfully with ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('❌ Database error in create():', error);
      throw error;
    } finally {
      connection.release();
      console.log('🔌 Database connection released');
    }
  }

  // Update rental data
  async update(id, sewaData) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET 
          nama_aset = ?, jenis_aset = ?, jangka_waktu_sewa = ?, harga_sewa = ?, 
          nama_pemilik = ?, no_hp_pemilik = ?, alamat_pemilik = ?, mulai_sewa = ?, berakhir_sewa = ?, 
          penanggung_jawab_pajak = ?, foto_aset = ?, kategori_sewa = ?, keterangan = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status_deleted = 0`,
        [
          sewaData.nama_aset,
          sewaData.jenis_aset,
          sewaData.jangka_waktu_sewa, // Now VARCHAR, no parsing needed
          sewaData.harga_sewa, // Now VARCHAR, no parsing needed
          sewaData.nama_pemilik,
          sewaData.no_hp_pemilik,
          sewaData.alamat_pemilik,
          sewaData.mulai_sewa,
          sewaData.berakhir_sewa,
          sewaData.penanggung_jawab_pajak,
          sewaData.foto_aset || null,
          sewaData.kategori_sewa,
          sewaData.keterangan || null,
          id
        ]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // Soft delete rental data
  async delete(id) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET status_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // Get rental categories
  async getCategories() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT DISTINCT kategori_sewa FROM ${this.tableName} WHERE status_deleted = 0 ORDER BY kategori_sewa`
      );
      return rows.map(row => row.kategori_sewa);
    } finally {
      connection.release();
    }
  }
}

module.exports = DataSewa;
