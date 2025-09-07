const mysql = require('mysql2/promise');
require('dotenv').config();

class MediaSosial {
  static async getConnection() {
    const { getConnection } = require('../config/mysqlPool');
    return await getConnection();
  }

  static buildWhereClause({ search = '', date = '', year = '', month = '' }) {
    let where = 'WHERE ms.status_deleted = 0';
    const params = [];

    if (search) {
      where += ' AND (ms.isi_laporan LIKE ? OR u.nama LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (date) {
      where += ' AND ms.tanggal_laporan = ?';
      params.push(date);
    }

    if (year) {
      where += ' AND ms.tahun = ?';
      params.push(year);
    }

    if (month) {
      where += ' AND ms.bulan = ?';
      params.push(month);
    }

    return { where, params };
  }

  static async getAll(page = 1, limit = 10, search = '', date = '', year = '', month = '') {
    let connection;
    try {
      connection = await this.getConnection();
      const offset = (page - 1) * limit;

      const { where, params } = this.buildWhereClause({ search, date, year, month });

      const query = `
        SELECT 
          ms.id,
          ms.id_user,
          ms.tanggal_laporan,
          ms.tahun,
          ms.bulan,
          ms.isi_laporan,
          ms.images,
          ms.created_at,
          ms.updated_at,
          u.nama as user_nama
        FROM media_sosial ms
        LEFT JOIN users u ON ms.id_user = u.id
        ${where}
        ORDER BY ms.tanggal_laporan DESC, ms.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM media_sosial ms
        LEFT JOIN users u ON ms.id_user = u.id
        ${where}
      `;

      const [rows] = await connection.execute(query, [...params, limit, offset]);
      const [countRows] = await connection.execute(countQuery, params);

      return {
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(countRows[0].total / limit),
          totalItems: countRows[0].total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      console.error('Error in MediaSosial.getAll:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async getYearsDistinct() {
    let connection;
    try {
      connection = await this.getConnection();
      const [rows] = await connection.execute(
        `SELECT DISTINCT tahun FROM media_sosial WHERE status_deleted = 0 ORDER BY tahun DESC`
      );
      return { success: true, data: rows.map(r => r.tahun) };
    } catch (error) {
      console.error('Error in MediaSosial.getYearsDistinct:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async getMonthsDistinct(year) {
    let connection;
    try {
      connection = await this.getConnection();
      const [rows] = await connection.execute(
        `SELECT DISTINCT bulan FROM media_sosial WHERE status_deleted = 0 AND tahun = ? ORDER BY bulan DESC`,
        [year]
      );
      return { success: true, data: rows.map(r => r.bulan) };
    } catch (error) {
      console.error('Error in MediaSosial.getMonthsDistinct:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async getById(id) {
    let connection;
    try {
      connection = await this.getConnection();
      const [rows] = await connection.execute(
        `SELECT 
           ms.id, ms.id_user, ms.tanggal_laporan, ms.tahun, ms.bulan, ms.isi_laporan, ms.images, ms.created_at, ms.updated_at,
           u.nama as user_nama
         FROM media_sosial ms
         LEFT JOIN users u ON ms.id_user = u.id
         WHERE ms.id = ? AND ms.status_deleted = 0`,
        [id]
      );
      if (rows.length === 0) return { success: false, error: 'Data tidak ditemukan' };
      return { success: true, data: rows[0] };
    } catch (error) {
      console.error('Error in MediaSosial.getById:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async create(data) {
    let connection;
    try {
      connection = await this.getConnection();
      const tanggal = new Date(data.tanggal_laporan);
      const tahun = tanggal.getFullYear();
      const bulan = tanggal.getMonth() + 1;

      const [result] = await connection.execute(
        `INSERT INTO media_sosial (id_user, tanggal_laporan, tahun, bulan, isi_laporan, images)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.id_user,
          data.tanggal_laporan,
          tahun,
          bulan,
          data.isi_laporan,
          data.images ? JSON.stringify(data.images) : null,
        ]
      );
      return { success: true, data: { id: result.insertId } };
    } catch (error) {
      console.error('Error in MediaSosial.create:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async update(id, data) {
    let connection;
    try {
      connection = await this.getConnection();

      const tanggal = new Date(data.tanggal_laporan);
      const tahun = tanggal.getFullYear();
      const bulan = tanggal.getMonth() + 1;

      const [result] = await connection.execute(
        `UPDATE media_sosial 
         SET tanggal_laporan = ?, tahun = ?, bulan = ?, isi_laporan = ?, images = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status_deleted = 0`,
        [
          data.tanggal_laporan,
          tahun,
          bulan,
          data.isi_laporan,
          data.images ? JSON.stringify(data.images) : null,
          id,
        ]
      );
      if (result.affectedRows === 0) return { success: false, error: 'Data tidak ditemukan' };
      return { success: true, data: { id } };
    } catch (error) {
      console.error('Error in MediaSosial.update:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async delete(id) {
    let connection;
    try {
      connection = await this.getConnection();
      const [result] = await connection.execute(
        `UPDATE media_sosial SET status_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status_deleted = 0`,
        [id]
      );
      if (result.affectedRows === 0) return { success: false, error: 'Data tidak ditemukan' };
      return { success: true, data: { id } };
    } catch (error) {
      console.error('Error in MediaSosial.delete:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async getStats() {
    let connection;
    try {
      connection = await this.getConnection();
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) as total_records FROM media_sosial WHERE status_deleted = 0`
      );

      const [monthRows] = await connection.execute(
        `SELECT COUNT(*) as total_this_month FROM media_sosial WHERE status_deleted = 0 AND DATE_FORMAT(tanggal_laporan, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')`
      );

      const [yearRows] = await connection.execute(
        `SELECT COUNT(*) as total_this_year FROM media_sosial WHERE status_deleted = 0 AND YEAR(tanggal_laporan) = YEAR(CURDATE())`
      );

      return {
        success: true,
        data: {
          ...totalRows[0],
          ...monthRows[0],
          ...yearRows[0],
        },
      };
    } catch (error) {
      console.error('Error in MediaSosial.getStats:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = MediaSosial;
