const { sequelize } = require('../config/database');

async function createPengumumanTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS pengumuman (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL COMMENT 'Judul pengumuman',
        konten TEXT NOT NULL COMMENT 'Isi pengumuman',
        penulis_id INT NOT NULL COMMENT 'ID user yang membuat pengumuman (owner)',
        status ENUM('aktif', 'non_aktif') NOT NULL DEFAULT 'aktif' COMMENT 'Status pengumuman',
        prioritas ENUM('tinggi', 'sedang', 'rendah') NOT NULL DEFAULT 'sedang' COMMENT 'Prioritas pengumuman',
        tanggal_berlaku_dari DATETIME NOT NULL COMMENT 'Tanggal mulai berlaku',
        tanggal_berlaku_sampai DATETIME NULL COMMENT 'Tanggal selesai berlaku (opsional)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (penulis_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_penulis_id (penulis_id),
        INDEX idx_status (status),
        INDEX idx_prioritas (prioritas),
        INDEX idx_tanggal_berlaku (tanggal_berlaku_dari, tanggal_berlaku_sampai),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ Successfully created pengumuman table');
    
  } catch (error) {
    console.error('❌ Error creating pengumuman table:', error.message);
  } finally {
    await sequelize.close();
  }
}

createPengumumanTable();
