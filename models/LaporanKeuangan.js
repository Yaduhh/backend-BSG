const mysql = require('mysql2/promise');
require('dotenv').config();

class LaporanKeuangan {
    static async getConnection() {
        const { getConnection } = require('../config/mysqlPool');
        return await getConnection();
    }

    static async getAll(page = 1, limit = 10, search = '', dateFilter = '', monthFilter = '') {
        let connection;
        try {
            connection = await this.getConnection();
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE lk.status_deleted = 0';
            const params = [];
            
            console.log('LaporanKeuangan.getAll - params:', { page, limit, search, dateFilter, monthFilter });

            if (search) {
                whereClause += ' AND (lk.isi_laporan LIKE ? OR u.nama LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            // Prioritaskan monthFilter jika diisi (format: YYYY-MM)
            if (monthFilter) {
                // Validasi sederhana format YYYY-MM
                const match = /^([0-9]{4})-([0-9]{2})$/.exec(monthFilter);
                if (match) {
                    const year = parseInt(match[1], 10);
                    const month = parseInt(match[2], 10);
                    whereClause += ' AND YEAR(lk.tanggal_laporan) = ? AND MONTH(lk.tanggal_laporan) = ?';
                    params.push(year, month);
                }
            } else if (dateFilter) {
                // Fallback ke filter tanggal exact (YYYY-MM-DD)
                whereClause += ' AND lk.tanggal_laporan = ?';
                params.push(dateFilter);
            }

            const query = `
        SELECT 
          lk.id,
          lk.id_user,
          COALESCE(lk.judul_laporan, CONCAT('Laporan ', DATE_FORMAT(lk.tanggal_laporan, '%d %M %Y'))) as judul_laporan,
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
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

            const countQuery = `
        SELECT COUNT(*) as total
        FROM laporan_keuangan lk
        LEFT JOIN users u ON lk.id_user = u.id
        ${whereClause}
      `;

            console.log('LaporanKeuangan.getAll - query:', query);
            console.log('LaporanKeuangan.getAll - query params:', params);
            
            const [rows] = await connection.execute(query, params);
            const [countResult] = await connection.execute(countQuery, params);
            
            console.log('LaporanKeuangan.getAll - rows count:', rows.length);
            console.log('LaporanKeuangan.getAll - total count:', countResult[0].total);

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
          COALESCE(lk.judul_laporan, CONCAT('Laporan ', DATE_FORMAT(lk.tanggal_laporan, '%d %M %Y'))) as judul_laporan,
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
        INSERT INTO laporan_keuangan (id_user, judul_laporan, tanggal_laporan, isi_laporan, images)
        VALUES (?, ?, ?, ?, ?)
      `;

            const [result] = await connection.execute(query, [
                data.id_user,
                data.judul_laporan || null,
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
        SET judul_laporan = ?, tanggal_laporan = ?, isi_laporan = ?, images = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status_deleted = 0
      `;

            const [result] = await connection.execute(query, [
                data.judul_laporan || null,
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

    static async getAvailableMonths() {
        let connection;
        try {
            connection = await this.getConnection();
            const query = `
        SELECT DISTINCT
          YEAR(tanggal_laporan) AS year,
          MONTH(tanggal_laporan) AS month
        FROM laporan_keuangan
        WHERE status_deleted = 0
        ORDER BY YEAR(tanggal_laporan) DESC, MONTH(tanggal_laporan) DESC
      `;
            const [rows] = await connection.execute(query);
            return { success: true, data: rows };
        } catch (error) {
            console.error('Error in LaporanKeuangan.getAvailableMonths:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) connection.release();
        }
    }

    static async getStatistics() {
        let connection;
        try {
            connection = await this.getConnection();
            const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN YEAR(tanggal_laporan) = YEAR(CURDATE()) AND MONTH(tanggal_laporan) = MONTH(CURDATE()) THEN 1 END) as thisMonth,
          COUNT(CASE WHEN YEAR(tanggal_laporan) = YEAR(CURDATE()) THEN 1 END) as thisYear
        FROM laporan_keuangan
        WHERE status_deleted = 0
      `;
            const [rows] = await connection.execute(query);
            return { success: true, data: rows[0] };
        } catch (error) {
            console.error('Error in LaporanKeuangan.getStatistics:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = LaporanKeuangan;