const { getConnection } = require('../config/mysqlPool');

class MedsosAnggaran {
  static async getAll() {
    let connection;
    try {
      connection = await getConnection();
      const [rows] = await connection.execute(`
        SELECT * FROM medsos_anggaran 
        WHERE status_deleted = 0 
        ORDER BY created_at DESC
      `);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error getting all anggaran data:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async getById(id) {
    let connection;
    try {
      connection = await getConnection();
      const [rows] = await connection.execute(`
        SELECT * FROM medsos_anggaran 
        WHERE id = ? AND status_deleted = 0
      `, [id]);
      
      if (rows.length === 0) {
        return { success: false, message: 'Data anggaran tidak ditemukan' };
      }
      
      return { success: true, data: rows[0] };
    } catch (error) {
      console.error('Error getting anggaran by id:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }



  static async create(data) {
    let connection;
    try {
      connection = await getConnection();
      const { nama_akun, follower_ig, follower_tiktok, ratecard, created_by } = data;
      
      const [result] = await connection.execute(`
        INSERT INTO medsos_anggaran (nama_akun, follower_ig, follower_tiktok, ratecard, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [nama_akun, follower_ig || 0, follower_tiktok || 0, ratecard || 0, created_by]);
      
      return { success: true, data: { id: result.insertId }, message: 'Data anggaran berhasil ditambahkan' };
    } catch (error) {
      console.error('Error creating anggaran:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async update(id, data) {
    let connection;
    try {
      connection = await getConnection();
      const { nama_akun, follower_ig, follower_tiktok, ratecard } = data;
      
      const [result] = await connection.execute(`
        UPDATE medsos_anggaran 
        SET nama_akun = ?, follower_ig = ?, follower_tiktok = ?, ratecard = ?
        WHERE id = ? AND status_deleted = 0
      `, [nama_akun, follower_ig || 0, follower_tiktok || 0, ratecard || 0, id]);
      
      if (result.affectedRows === 0) {
        return { success: false, message: 'Data anggaran tidak ditemukan' };
      }
      
      return { success: true, message: 'Data anggaran berhasil diperbarui' };
    } catch (error) {
      console.error('Error updating anggaran:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async delete(id) {
    let connection;
    try {
      connection = await getConnection();
      const [result] = await connection.execute(`
        UPDATE medsos_anggaran 
        SET status_deleted = 1, deleted_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND status_deleted = 0
      `, [id]);
      
      if (result.affectedRows === 0) {
        return { success: false, message: 'Data anggaran tidak ditemukan' };
      }
      
      return { success: true, message: 'Data anggaran berhasil dihapus' };
    } catch (error) {
      console.error('Error deleting anggaran:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async getStats() {
    let connection;
    try {
      connection = await getConnection();
      const [rows] = await connection.execute(`
        SELECT 
          COUNT(*) as total_anggaran,
          COUNT(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN 1 END) as anggaran_bulan_ini,
          SUM(ratecard) as total_ratecard,
          SUM(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN ratecard ELSE 0 END) as ratecard_bulan_ini
        FROM medsos_anggaran 
        WHERE status_deleted = 0
      `);
      
      return { success: true, data: rows[0] };
    } catch (error) {
      console.error('Error getting anggaran stats:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async search(query) {
    let connection;
    try {
      connection = await getConnection();
      const searchQuery = `%${query}%`;
      const [rows] = await connection.execute(`
        SELECT * FROM medsos_anggaran 
        WHERE nama_akun LIKE ? AND status_deleted = 0 
        ORDER BY created_at DESC
      `, [searchQuery]);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error searching anggaran:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async checkAndFixAutoIncrement() {
    let connection;
    try {
      connection = await getConnection();
      const [rows] = await connection.execute(`
        SELECT MAX(id) as max_id FROM medsos_anggaran
      `);
      
      if (rows[0].max_id) {
        await connection.execute(`
          ALTER TABLE medsos_anggaran AUTO_INCREMENT = ?
        `, [rows[0].max_id + 1]);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error checking/fixing auto increment:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = MedsosAnggaran;
