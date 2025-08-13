const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca file .env secara manual
const envPath = path.join(__dirname, '../.env');
let envConfig = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const cleanContent = envContent
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  cleanContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value !== undefined) {
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        envConfig[cleanKey] = cleanValue;
      }
    }
  });
}

const config = {
  host: envConfig.DB_HOST || '192.168.38.223',
  port: envConfig.DB_PORT || 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group'
};

class KeuanganPoskas {
  constructor() {
    this.tableName = 'keuangan_poskas';
  }

  // Get database connection
  async getConnection() {
    return await mysql.createConnection(config);
  }

  // Get all keuangan poskas (not deleted)
  async getAll() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE kp.status_deleted = 0 
         ORDER BY kp.created_at DESC`
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Get keuangan poskas by ID
  async getById(id) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE kp.id = ? AND kp.status_deleted = 0`,
        [id]
      );
      return rows[0] || null;
    } finally {
      await connection.end();
    }
  }

  // Get keuangan poskas by user ID
  async getByUserId(userId) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE kp.id_user = ? AND kp.status_deleted = 0 
         ORDER BY kp.created_at DESC`,
        [userId]
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Get keuangan poskas by date range
  async getByDateRange(startDate, endDate) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE kp.tanggal_poskas BETWEEN ? AND ? AND kp.status_deleted = 0 
         ORDER BY kp.tanggal_poskas DESC`,
        [startDate, endDate]
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Create new keuangan poskas
  async create(data) {
    const connection = await this.getConnection();
    try {
      const { id_user, tanggal_poskas, isi_poskas, images } = data;

      console.log('📝 Creating poskas with data:', { id_user, tanggal_poskas, isi_poskas: isi_poskas ? 'has content' : 'no content', images: images ? 'has images' : 'no images' });

      // Get next available record ID
      const nextRecordId = await this.getNextRecordId();

      const [result] = await connection.execute(
        `INSERT INTO ${this.tableName} (id, id_user, tanggal_poskas, isi_poskas, images, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [nextRecordId, id_user, tanggal_poskas, isi_poskas, images ? JSON.stringify(images) : null]
      );

      console.log('✅ Insert result:', result);

      // Get the created record
      const createdRecord = await this.getById(nextRecordId);

      return createdRecord;
    } catch (error) {
      console.error('❌ Error in create method:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Update keuangan poskas
  async update(id, data) {
    const connection = await this.getConnection();
    try {
      const { tanggal_poskas, isi_poskas, images } = data;

      const [result] = await connection.execute(
        `UPDATE ${this.tableName} 
         SET tanggal_poskas = ?, isi_poskas = ?, images = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND status_deleted = 0`,
        [tanggal_poskas, isi_poskas, images ? JSON.stringify(images) : null, id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Keuangan poskas not found or already deleted');
      }

      return await this.getById(id);
    } finally {
      await connection.end();
    }
  }

  // Soft delete keuangan poskas
  async delete(id) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} 
         SET status_deleted = 1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND status_deleted = 0`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Keuangan poskas not found or already deleted');
      }

      return { success: true, message: 'Keuangan poskas deleted successfully' };
    } finally {
      await connection.end();
    }
  }

  // Hard delete keuangan poskas (permanent)
  async hardDelete(id) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Keuangan poskas not found');
      }

      return { success: true, message: 'Keuangan poskas permanently deleted' };
    } finally {
      await connection.end();
    }
  }

  // Get statistics/summary
  async getSummary() {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
           COUNT(*) as total_entries,
           COUNT(DISTINCT id_user) as total_users,
           MIN(tanggal_poskas) as earliest_date,
           MAX(tanggal_poskas) as latest_date
         FROM ${this.tableName} 
         WHERE status_deleted = 0`
      );

      return rows[0];
    } finally {
      await connection.end();
    }
  }

  // Get keuangan poskas by month
  async getByMonth(year, month) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE YEAR(kp.tanggal_poskas) = ? 
         AND MONTH(kp.tanggal_poskas) = ? 
         AND kp.status_deleted = 0 
         ORDER BY kp.tanggal_poskas DESC`,
        [year, month]
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Search keuangan poskas
  async search(searchTerm) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT kp.*, u.nama as user_nama 
         FROM ${this.tableName} kp 
         LEFT JOIN users u ON kp.id_user = u.id 
         WHERE (kp.isi_poskas LIKE ? OR u.nama LIKE ?) 
         AND kp.status_deleted = 0 
         ORDER BY kp.created_at DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Check and fix auto increment
  async checkAndFixAutoIncrement() {
    const connection = await this.getConnection();
    try {
      // First, check if there's a record with ID 0 and remove it
      const [checkZero] = await connection.execute(
        `SELECT id FROM ${this.tableName} WHERE id = 0`
      );

      if (checkZero.length > 0) {
        console.log('🔧 Found record with ID 0, removing it...');
        await connection.execute(
          `DELETE FROM ${this.tableName} WHERE id = 0`
        );
        console.log('✅ Removed record with ID 0');
      }

      // Check table structure
      const [tableInfo] = await connection.execute(
        `DESCRIBE ${this.tableName}`
      );

      const idColumn = tableInfo.find(col => col.Field === 'id');
      console.log('🔍 ID column info:', idColumn);

      // Get the current auto increment value
      const [rows] = await connection.execute(
        `SELECT AUTO_INCREMENT FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [config.database, this.tableName]
      );

      console.log('🔍 Current AUTO_INCREMENT:', rows[0]?.AUTO_INCREMENT);

      // Get the maximum ID
      const [maxRows] = await connection.execute(
        `SELECT MAX(id) as max_id FROM ${this.tableName}`
      );

      const maxId = maxRows[0]?.max_id || 0;
      console.log('🔍 Max ID in table:', maxId);

      // If auto increment is less than max ID, fix it
      if (rows[0]?.AUTO_INCREMENT <= maxId) {
        console.log('🔧 Fixing AUTO_INCREMENT...');
        await connection.execute(
          `ALTER TABLE ${this.tableName} AUTO_INCREMENT = ${maxId + 1}`
        );
        console.log('✅ AUTO_INCREMENT fixed to:', maxId + 1);
      }

      // If no records exist, set auto increment to 1
      if (maxId === 0 && (!rows[0]?.AUTO_INCREMENT || rows[0]?.AUTO_INCREMENT === 0)) {
        console.log('🔧 Setting AUTO_INCREMENT to 1 for empty table...');
        await connection.execute(
          `ALTER TABLE ${this.tableName} AUTO_INCREMENT = 1`
        );
        console.log('✅ AUTO_INCREMENT set to 1');
      }
    } catch (error) {
      console.error('❌ Error checking/fixing auto increment:', error);
    } finally {
      await connection.end();
    }
  }

  // Get next available image ID
  async getNextImageId() {
    const connection = await this.getConnection();
    try {
      // Get all images from all records
      const [rows] = await connection.execute(
        `SELECT images FROM ${this.tableName} WHERE status_deleted = 0 AND images IS NOT NULL`
      );

      let maxImageId = 0;

      // Parse all images and find the maximum ID
      rows.forEach(row => {
        if (row.images) {
          try {
            const images = JSON.parse(row.images);
            if (Array.isArray(images)) {
              images.forEach(img => {
                if (img.id && img.id > maxImageId) {
                  maxImageId = img.id;
                }
              });
            }
          } catch (error) {
            console.error('Error parsing images JSON:', error);
          }
        }
      });

      console.log('🔍 Current max image ID:', maxImageId);
      return maxImageId;
    } catch (error) {
      console.error('❌ Error getting next image ID:', error);
      return 0;
    } finally {
      await connection.end();
    }
  }

  // Get next available record ID
  async getNextRecordId() {
    const connection = await this.getConnection();
    try {
      // Get the maximum ID from the table
      const [rows] = await connection.execute(
        `SELECT MAX(id) as max_id FROM ${this.tableName}`
      );

      const maxId = rows[0]?.max_id || 0;
      const nextId = maxId + 1;

      console.log('🔍 Current max record ID:', maxId);
      console.log('🔍 Next available record ID:', nextId);

      return nextId;
    } catch (error) {
      console.error('❌ Error getting next record ID:', error);
      return 1;
    } finally {
      await connection.end();
    }
  }
}

module.exports = new KeuanganPoskas(); 