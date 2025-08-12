const mysql = require('mysql2/promise');
require('dotenv').config();

class OmsetHarian {
    static async getConnection() {
        return await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistem_bosgil_group'
        });
    }

    static async getAll(page = 1, limit = 10, search = '', dateFilter = '') {
        let connection;
        try {
            connection = await this.getConnection();
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE oh.status_deleted = 0';
            const params = [];

            if (search) {
                whereClause += ' AND (oh.isi_omset LIKE ? OR u.nama LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            if (dateFilter) {
                whereClause += ' AND oh.tanggal_omset = ?';
                params.push(dateFilter);
            }

            const query = `
        SELECT 
          oh.id,
          oh.id_user,
          oh.tanggal_omset,
          oh.isi_omset,
          oh.images,
          oh.created_at,
          oh.updated_at,
          u.nama as user_nama
        FROM omset_harian oh
        LEFT JOIN users u ON oh.id_user = u.id
        ${whereClause}
        ORDER BY oh.created_at DESC
        LIMIT ? OFFSET ?
      `;

            const countQuery = `
        SELECT COUNT(*) as total
        FROM omset_harian oh
        LEFT JOIN users u ON oh.id_user = u.id
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
            console.error('Error in OmsetHarian.getAll:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) await connection.end();
        }
    }

    static async getById(id) {
        let connection;
        try {
            connection = await this.getConnection();
            const query = `
        SELECT 
          oh.id,
          oh.id_user,
          oh.tanggal_omset,
          oh.isi_omset,
          oh.images,
          oh.created_at,
          oh.updated_at,
          u.nama as user_nama
        FROM omset_harian oh
        LEFT JOIN users u ON oh.id_user = u.id
        WHERE oh.id = ? AND oh.status_deleted = 0
      `;

            const [rows] = await connection.execute(query, [id]);

            if (rows.length === 0) {
                return { success: false, error: 'Data tidak ditemukan' };
            }

            return { success: true, data: rows[0] };
        } catch (error) {
            console.error('Error in OmsetHarian.getById:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) await connection.end();
        }
    }

    static async create(data) {
        let connection;
        try {
            connection = await this.getConnection();
            const query = `
        INSERT INTO omset_harian (id_user, tanggal_omset, isi_omset, images)
        VALUES (?, ?, ?, ?)
      `;

            const [result] = await connection.execute(query, [
                data.id_user,
                data.tanggal_omset,
                data.isi_omset,
                data.images ? JSON.stringify(data.images) : null
            ]);

            return { success: true, data: { id: result.insertId } };
        } catch (error) {
            console.error('Error in OmsetHarian.create:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) await connection.end();
        }
    }

    static async update(id, data) {
        let connection;
        try {
            connection = await this.getConnection();
            const query = `
        UPDATE omset_harian 
        SET tanggal_omset = ?, isi_omset = ?, images = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status_deleted = 0
      `;

            const [result] = await connection.execute(query, [
                data.tanggal_omset,
                data.isi_omset,
                data.images ? JSON.stringify(data.images) : null,
                id
            ]);

            if (result.affectedRows === 0) {
                return { success: false, error: 'Data tidak ditemukan' };
            }

            return { success: true, data: { id } };
        } catch (error) {
            console.error('Error in OmsetHarian.update:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) await connection.end();
        }
    }

    static async delete(id) {
        let connection;
        try {
            connection = await this.getConnection();
            const query = `
        UPDATE omset_harian 
        SET status_deleted = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status_deleted = 0
      `;

            const [result] = await connection.execute(query, [id]);

            if (result.affectedRows === 0) {
                return { success: false, error: 'Data tidak ditemukan' };
            }

            return { success: true, data: { id } };
        } catch (error) {
            console.error('Error in OmsetHarian.delete:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) await connection.end();
        }
    }

    static async getStats() {
        let connection;
        try {
            connection = await this.getConnection();
            const query = `
        SELECT 
          COUNT(*) as total_records
        FROM omset_harian 
        WHERE status_deleted = 0
      `;

            const [rows] = await connection.execute(query);

            // Get current month stats
            const currentMonthQuery = `
        SELECT 
          COUNT(*) as total_this_month
        FROM omset_harian 
        WHERE status_deleted = 0 
        AND DATE_FORMAT(tanggal_omset, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
      `;

            const [currentMonthRows] = await connection.execute(currentMonthQuery);

            // Get current year stats
            const currentYearQuery = `
        SELECT 
          COUNT(*) as total_this_year
        FROM omset_harian 
        WHERE status_deleted = 0 
        AND YEAR(tanggal_omset) = YEAR(CURDATE())
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
            console.error('Error in OmsetHarian.getStats:', error);
            return { success: false, error: error.message };
        } finally {
            if (connection) await connection.end();
        }
    }
}

module.exports = OmsetHarian; 