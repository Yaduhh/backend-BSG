const mysql = require('mysql2/promise');
require('dotenv').config();

class TargetHarian {
  static async getConnection() {
    const { getConnection } = require('../config/mysqlPool');
    return await getConnection();
  }

  static async getAll(page = 1, limit = 10, search = '', dateFilter = '', year = '') {
    let connection;
    try {
      connection = await this.getConnection();
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE th.status_deleted = 0';
      const params = [];

      if (search) {
        whereClause += ' AND (th.isi_target LIKE ?)';
        params.push(`%${search}%`);
      }

      if (dateFilter) {
        whereClause += ' AND th.tanggal_target = ?';
        params.push(dateFilter);
      }

      if (year) {
        whereClause += ' AND YEAR(th.tanggal_target) = ?';
        params.push(parseInt(year, 10));
      }

      const query = `
        SELECT 
          th.id,
          th.id_user,
          th.tanggal_target,
          th.isi_target,
          th.images,
          th.created_at,
          th.updated_at,
          u.nama as user_nama
        FROM taget th
        LEFT JOIN users u ON th.id_user = u.id
        ${whereClause}
        ORDER BY th.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM taget th
        LEFT JOIN users u ON th.id_user = u.id
        ${whereClause}
      `;

      const [rows] = await connection.execute(query, params);
      const [countResult] = await connection.execute(countQuery, params);

      return {
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(countResult[0].total / limit),
          totalItems: countResult[0].total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('Error in TargetHarian.getAll:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async getYears() {
    let connection;
    try {
      connection = await this.getConnection();
      const query = `
        SELECT DISTINCT YEAR(tanggal_target) AS year
        FROM taget
        WHERE status_deleted = 0 AND tanggal_target IS NOT NULL
        ORDER BY year DESC
      `;
      const [rows] = await connection.execute(query);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error in TargetHarian.getYears:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async getById(id) {
    let connection;
    try {
      connection = await this.getConnection();
      const query = `
        SELECT 
          th.id,
          th.id_user,
          th.tanggal_target,
          th.isi_target,
          th.images,
          th.created_at,
          th.updated_at,
          u.nama as user_nama
        FROM taget th
        LEFT JOIN users u ON th.id_user = u.id
        WHERE th.id = ? AND th.status_deleted = 0
      `;

      const [rows] = await connection.execute(query, [id]);

      if (rows.length === 0) {
        return { success: false, error: 'Data tidak ditemukan' };
      }

      return { success: true, data: rows[0] };
    } catch (error) {
      console.error('Error in TargetHarian.getById:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async create(data) {
    let connection;
    try {
      connection = await this.getConnection();
      const query = `
        INSERT INTO taget (id_user, tanggal_target, isi_target, images)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await connection.execute(query, [
        data.id_user,
        data.tanggal_target,
        data.isi_target,
        data.images ? JSON.stringify(data.images) : null
      ]);

      return { success: true, data: { id: result.insertId } };
    } catch (error) {
      console.error('Error in TargetHarian.create:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async update(id, data) {
    let connection;
    try {
      connection = await this.getConnection();
      const query = `
        UPDATE taget 
        SET tanggal_target = ?, isi_target = ?, images = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status_deleted = 0
      `;

      const [result] = await connection.execute(query, [
        data.tanggal_target,
        data.isi_target,
        data.images ? JSON.stringify(data.images) : null,
        id
      ]);

      if (result.affectedRows === 0) {
        return { success: false, error: 'Data tidak ditemukan' };
      }

      return { success: true, data: { id } };
    } catch (error) {
      console.error('Error in TargetHarian.update:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async delete(id) {
    let connection;
    try {
      connection = await this.getConnection();
      const query = `
        UPDATE taget 
        SET status_deleted = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status_deleted = 0
      `;

      const [result] = await connection.execute(query, [id]);

      if (result.affectedRows === 0) {
        return { success: false, error: 'Data tidak ditemukan' };
      }

      return { success: true, data: { id } };
    } catch (error) {
      console.error('Error in TargetHarian.delete:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async getStats() {
    let connection;
    try {
      connection = await this.getConnection();
      const query = `
        SELECT 
          COUNT(*) as total_records
        FROM taget 
        WHERE status_deleted = 0
      `;

      const [rows] = await connection.execute(query);

      // Get current month stats
      const currentMonthQuery = `
        SELECT 
          COUNT(*) as total_this_month
        FROM taget 
        WHERE status_deleted = 0 
        AND DATE_FORMAT(tanggal_target, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
      `;

      const [currentMonthRows] = await connection.execute(currentMonthQuery);

      // Get current year stats
      const currentYearQuery = `
        SELECT 
          COUNT(*) as total_this_year
        FROM taget 
        WHERE status_deleted = 0 
        AND YEAR(tanggal_target) = YEAR(CURDATE())
      `;

      const [currentYearRows] = await connection.execute(currentYearQuery);

      return {
        success: true,
        data: {
          ...rows[0],
          ...currentMonthRows[0],
          ...currentYearRows[0]
        }
      };
    } catch (error) {
      console.error('Error in TargetHarian.getStats:', error);
      return { success: false, error: error.message };
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = TargetHarian;
