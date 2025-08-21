const mysql = require('mysql2/promise');
require('dotenv').config();

class AnekaGrafik {
    static async getConnection() {
        const { getConnection } = require('../config/mysqlPool');
        return await getConnection();
    }

    static async getAll(page = 1, limit = 10, search = '', dateFilter = '') {
        let connection;
        try {
            connection = await this.getConnection();
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE ag.status_deleted = 0';
            const params = [];

            if (search) {
                whereClause += ' AND (ag.isi_grafik LIKE ? OR u.nama LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            if (dateFilter) {
                whereClause += ' AND ag.tanggal_grafik = ?';
                params.push(dateFilter);
            }

            const query = `
        SELECT 
          ag.id,
          ag.id_user,
          ag.tanggal_grafik,
          ag.isi_grafik,
          ag.images,
          ag.created_at,
          ag.updated_at,
          u.nama as user_nama
        FROM aneka_grafik ag
        LEFT JOIN users u ON ag.id_user = u.id
        ${whereClause}
        ORDER BY ag.created_at DESC
        LIMIT ? OFFSET ?
      `;

            const countQuery = `
        SELECT COUNT(*) as total
        FROM aneka_grafik ag
        LEFT JOIN users u ON ag.id_user = u.id
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
            console.error('Error in AnekaGrafik.getAll:', error);
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
          ag.id,
          ag.id_user,
          ag.tanggal_grafik,
          ag.isi_grafik,
          ag.images,
          ag.created_at,
          ag.updated_at,
          u.nama as user_nama
        FROM aneka_grafik ag
        LEFT JOIN users u ON ag.id_user = u.id
        WHERE ag.id = ? AND ag.status_deleted = 0
      `;

            const [rows] = await connection.execute(query, [id]);

            if (rows.length === 0) {
                return { success: false, error: 'Aneka grafik tidak ditemukan' };
            }

            return { success: true, data: rows[0] };
        } catch (error) {
            console.error('Error in AnekaGrafik.getById:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) connection.release();
        }
    }

    static async create(data) {
        let connection;
        try {
            console.log('📝 AnekaGrafik.create called with data:', data);
            connection = await this.getConnection();
            const query = `
        INSERT INTO aneka_grafik (id_user, tanggal_grafik, isi_grafik, images)
        VALUES (?, ?, ?, ?)
      `;

            const params = [
                data.id_user,
                data.tanggal_grafik,
                data.isi_grafik,
                data.images ? JSON.stringify(data.images) : null
            ];
            
            console.log('📝 SQL params:', params);

            const [result] = await connection.execute(query, params);

            console.log('✅ AnekaGrafik created with ID:', result.insertId);
            return { success: true, data: { id: result.insertId } };
        } catch (error) {
            console.error('❌ Error in AnekaGrafik.create:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) connection.release();
        }
    }

    static async update(id, data) {
        let connection;
        try {
            console.log('📝 AnekaGrafik.update called with ID:', id, 'and data:', data);
            connection = await this.getConnection();
            const query = `
        UPDATE aneka_grafik 
        SET tanggal_grafik = ?, isi_grafik = ?, images = ?, updated_at = NOW()
        WHERE id = ? AND status_deleted = 0
      `;

            const params = [
                data.tanggal_grafik,
                data.isi_grafik,
                data.images ? JSON.stringify(data.images) : null,
                id
            ];
            
            console.log('📝 SQL params:', params);

            const [result] = await connection.execute(query, params);

            if (result.affectedRows === 0) {
                console.log('❌ No rows affected, aneka grafik not found');
                return { success: false, error: 'Aneka grafik tidak ditemukan' };
            }

            console.log('✅ AnekaGrafik updated successfully');
            return { success: true, data: { id } };
        } catch (error) {
            console.error('❌ Error in AnekaGrafik.update:', error);
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
        UPDATE aneka_grafik 
        SET status_deleted = 1, updated_at = NOW()
        WHERE id = ? AND status_deleted = 0
      `;

            const [result] = await connection.execute(query, [id]);

            if (result.affectedRows === 0) {
                return { success: false, error: 'Aneka grafik tidak ditemukan' };
            }

            return { success: true, data: { id } };
        } catch (error) {
            console.error('Error in AnekaGrafik.delete:', error);
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
        FROM aneka_grafik 
        WHERE status_deleted = 0
      `;

            const [rows] = await connection.execute(query);

            // Get current month stats
            const currentMonthQuery = `
        SELECT 
          COUNT(*) as total_this_month
        FROM aneka_grafik 
        WHERE status_deleted = 0 
        AND DATE_FORMAT(tanggal_grafik, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
      `;

            const [currentMonthRows] = await connection.execute(currentMonthQuery);

            // Get current year stats
            const currentYearQuery = `
        SELECT 
          COUNT(*) as total_this_year
        FROM aneka_grafik 
        WHERE status_deleted = 0 
        AND YEAR(tanggal_grafik) = YEAR(CURDATE())
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
            console.error('Error in AnekaGrafik.getStats:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = AnekaGrafik; 