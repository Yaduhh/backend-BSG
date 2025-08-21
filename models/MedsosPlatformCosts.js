const { getConnection } = require('../config/mysqlPool');

class MedsosPlatformCosts {
  static async getAll() {
    let connection;
    try {
      connection = await getConnection();
      const [rows] = await connection.execute(`
        SELECT * FROM medsos_platform_costs 
        WHERE status_deleted = 0 
        ORDER BY created_at DESC
      `);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error getting all platform costs data:', error);
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
        SELECT * FROM medsos_platform_costs 
        WHERE id = ? AND status_deleted = 0
      `, [id]);
      
      if (rows.length === 0) {
        return { success: false, message: 'Data platform costs tidak ditemukan' };
      }
      
      return { success: true, data: rows[0] };
    } catch (error) {
      console.error('Error getting platform costs by id:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async getByPlatform(platform) {
    let connection;
    try {
      connection = await getConnection();
      const [rows] = await connection.execute(`
        SELECT * FROM medsos_platform_costs 
        WHERE platform = ? AND status_deleted = 0 
        ORDER BY created_at DESC
      `, [platform]);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error getting platform costs by platform:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async create(data) {
    let connection;
    try {
      connection = await getConnection();
      const { platform, biaya, created_by } = data;
      
      const [result] = await connection.execute(`
        INSERT INTO medsos_platform_costs (platform, biaya, created_by)
        VALUES (?, ?, ?)
      `, [platform, biaya || 0, created_by]);
      
      return { success: true, data: { id: result.insertId }, message: 'Data platform costs berhasil ditambahkan' };
    } catch (error) {
      console.error('Error creating platform costs:', error);
      return { success: false, message: error.message };
    } finally {
      if (connection) connection.release();
    }
  }

  static async update(id, data) {
    let connection;
    try {
      connection = await getConnection();
      const { platform, biaya } = data;
      
      const [result] = await connection.execute(`
        UPDATE medsos_platform_costs 
        SET platform = ?, biaya = ?
        WHERE id = ? AND status_deleted = 0
      `, [platform, biaya || 0, id]);
      
      if (result.affectedRows === 0) {
        return { success: false, message: 'Data platform costs tidak ditemukan' };
      }
      
      return { success: true, message: 'Data platform costs berhasil diperbarui' };
    } catch (error) {
      console.error('Error updating platform costs:', error);
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
        UPDATE medsos_platform_costs 
        SET status_deleted = 1, deleted_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND status_deleted = 0
      `, [id]);
      
      if (result.affectedRows === 0) {
        return { success: false, message: 'Data platform costs tidak ditemukan' };
      }
      
      return { success: true, message: 'Data platform costs berhasil dihapus' };
    } catch (error) {
      console.error('Error deleting platform costs:', error);
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
          COUNT(*) as total_platform_costs,
          SUM(biaya) as total_biaya,
          COUNT(CASE WHEN platform = 'TIKTOK' THEN 1 END) as tiktok_count,
          COUNT(CASE WHEN platform = 'INSTAGRAM' THEN 1 END) as instagram_count,
          COUNT(CASE WHEN platform = 'YOUTUBE' THEN 1 END) as youtube_count
        FROM medsos_platform_costs 
        WHERE status_deleted = 0
      `);
      
      return { success: true, data: rows[0] };
    } catch (error) {
      console.error('Error getting platform costs stats:', error);
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
        SELECT * FROM medsos_platform_costs 
        WHERE platform LIKE ? AND status_deleted = 0 
        ORDER BY created_at DESC
      `, [searchQuery]);
      return { success: true, data: rows };
    } catch (error) {
      console.error('Error searching platform costs:', error);
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
        SELECT MAX(id) as max_id FROM medsos_platform_costs
      `);
      
      if (rows[0].max_id) {
        await connection.execute(`
          ALTER TABLE medsos_platform_costs AUTO_INCREMENT = ?
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

module.exports = MedsosPlatformCosts;
