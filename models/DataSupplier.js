const mysql = require('mysql2/promise');
const { getConnection } = require('../config/mysqlPool');

class DataSupplier {
  constructor() {
    this.tableName = 'data_supplier';
  }

  // Get database connection
  async getConnection() {
    return await getConnection();
  }

  // Get all suppliers
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

  // Get supplier by ID
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

  // Get suppliers by category
  async getByCategory(category) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE kategori_supplier = ? AND status_deleted = 0 ORDER BY created_at DESC`,
        [category]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Get suppliers by division
  async getByDivision(divisi) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE divisi = ? AND status_deleted = 0 ORDER BY created_at DESC`,
        [divisi]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Create new supplier
  async create(supplierData) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO ${this.tableName} (
          kategori_supplier, divisi, nama_supplier, no_hp_supplier, 
          tanggal_kerjasama, npwp, alamat, keterangan, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          supplierData.kategori_supplier,
          supplierData.divisi,
          supplierData.nama_supplier,
          supplierData.no_hp_supplier,
          supplierData.tanggal_kerjasama,
          supplierData.npwp,
          supplierData.alamat,
          supplierData.keterangan || null,
          supplierData.created_by
        ]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  // Update supplier
  async update(id, supplierData) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET 
          kategori_supplier = ?, divisi = ?, nama_supplier = ?, 
          no_hp_supplier = ?, tanggal_kerjasama = ?, npwp = ?, 
          alamat = ?, keterangan = ?, updated_at = NOW()
        WHERE id = ? AND status_deleted = 0`,
        [
          supplierData.kategori_supplier,
          supplierData.divisi,
          supplierData.nama_supplier,
          supplierData.no_hp_supplier,
          supplierData.tanggal_kerjasama,
          supplierData.npwp,
          supplierData.alamat,
          supplierData.keterangan || null,
          id
        ]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // Soft delete supplier
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

  // Hard delete supplier
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

  // Get supplier statistics
  async getStats() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
          COUNT(*) as total_suppliers,
          COUNT(CASE WHEN kategori_supplier = 'SUPPLIER OUTLET' THEN 1 END) as outlet_count,
          COUNT(CASE WHEN kategori_supplier = 'SUPPLIER TOKO TEPUNG & BB' THEN 1 END) as toko_tepung_count,
          COUNT(CASE WHEN kategori_supplier = 'SUPPLIER PRODUKSI' THEN 1 END) as produksi_count,
          COUNT(CASE WHEN kategori_supplier = 'SUPPLIER KAMBING' THEN 1 END) as kambing_count,
          COUNT(CASE WHEN divisi = 'PRODUKSI' THEN 1 END) as produksi_divisi_count,
          COUNT(CASE WHEN divisi = 'MARKETING' THEN 1 END) as marketing_divisi_count,
          COUNT(CASE WHEN divisi = 'OPERASIONAL' THEN 1 END) as operasional_divisi_count
        FROM ${this.tableName} 
        WHERE status_deleted = 0`
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  // Search suppliers
  async search(query) {
    const connection = await this.getConnection();
    try {
      const searchTerm = `%${query}%`;
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} 
         WHERE status_deleted = 0 
         AND (nama_supplier LIKE ? OR kategori_supplier LIKE ? OR divisi LIKE ? OR alamat LIKE ?)
         ORDER BY created_at DESC`,
        [searchTerm, searchTerm, searchTerm, searchTerm]
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

module.exports = new DataSupplier();
