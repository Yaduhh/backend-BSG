const mysql = require('mysql2/promise');
require('dotenv').config();

class LaporanKeuangan {
    static async getConnection() {
        const { getConnection } = require('../config/mysqlPool');
        return await getConnection();
    }

    static async getAll(page = 1, limit = 10, search = '', dateFilter = '') {
        let connection;
        try {
            connection = await this.getConnection();
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE lk.status_deleted = 0';
            const params = [];

            if (search) {
                whereClause += ' AND (lk.isi_laporan LIKE ? OR u.nama LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            if (dateFilter) {
                whereClause += ' AND lk.tanggal_laporan = ?';
                params.push(dateFilter);
            }

            const query = `
        SELECT 
          lk.id,
          lk.id_user,
          lk.tanggal_laporan,
          lk.isi_laporan,
          lk.images,
          lk.created_at,
          lk.updated_at,
          u.nama as user_nama
        FROM laporan_keuangan lk
        LEFT JOIN users u ON lk.id_user = u.id
        ${whereClause}
        ORDER BY lk.created_at DESC
        LIMIT ? OFFSET ?
      `;

            const countQuery = `
        SELECT COUNT(*) as total
        FROM laporan_keuangan lk
        LEFT JOIN users u ON lk.id_user = u.id
        ${whereClause}
      `;

            const [rows] = await connection.execute(query, [...params, limit, offset]);
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
            console.error('Error in LaporanKeuangan.getAll:', error);
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
          lk.id,
          lk.id_user,
          lk.tanggal_laporan,
          lk.isi_laporan,
          lk.images,
          lk.created_at,
          lk.updated_at,
          u.nama as user_nama
        FROM laporan_keuangan lk
        LEFT JOIN users u ON lk.id_user = u.id
        WHERE lk.id = ? AND lk.status_deleted = 0
      `;

            const [rows] = await connection.execute(query, [id]);

            if (rows.length === 0) {
                return { success: false, error: 'Data tidak ditemukan' };
            }

            return { success: true, data: rows[0] };
        } catch (error) {
            console.error('Error in LaporanKeuangan.getById:', error);
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
        INSERT INTO laporan_keuangan (id_user, tanggal_laporan, isi_laporan, images)
        VALUES (?, ?, ?, ?)
      `;

            const [result] = await connection.execute(query, [
                data.id_user,
                data.tanggal_laporan,
                data.isi_laporan,
                data.images ? JSON.stringify(data.images) : null
            ]);

            return { success: true, id: result.insertId };
        } catch (error) {
            console.error('Error in LaporanKeuangan.create:', error);
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
        UPDATE laporan_keuangan 
        SET tanggal_laporan = ?, isi_laporan = ?, images = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status_deleted = 0
      `;

            const [result] = await connection.execute(query, [
                data.tanggal_laporan,
                data.isi_laporan,
                data.images ? JSON.stringify(data.images) : null,
                id
            ]);

            if (result.affectedRows === 0) {
                return { success: false, error: 'Data tidak ditemukan' };
            }

            return { success: true };
        } catch (error) {
            console.error('Error in LaporanKeuangan.update:', error);
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
        UPDATE laporan_keuangan 
        SET status_deleted = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status_deleted = 0
      `;

            const [result] = await connection.execute(query, [id]);

            if (result.affectedRows === 0) {
                return { success: false, error: 'Data tidak ditemukan' };
            }

            return { success: true };
        } catch (error) {
            console.error('Error in LaporanKeuangan.delete:', error);
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
          COUNT(*) as total_records,
          COUNT(DISTINCT tanggal_laporan) as total_days,
          COUNT(DISTINCT id_user) as total_users
        FROM laporan_keuangan 
        WHERE status_deleted = 0
      `;

            const [rows] = await connection.execute(query);

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            console.error('Error in LaporanKeuangan.getStats:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = LaporanKeuangan; 