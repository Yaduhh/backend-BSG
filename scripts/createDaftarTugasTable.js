const { sequelize } = require('../config/database');

async function createDaftarTugasTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS daftar_tugas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pemberi_tugas INT NOT NULL COMMENT 'ID user yang membuat tugas',
        penerima_tugas INT NOT NULL COMMENT 'ID user yang ditugaskan',
        pihak_terkait TEXT NULL COMMENT 'JSON array of user IDs yang terlibat dalam tugas',
        skala_prioritas ENUM('mendesak', 'penting', 'berproses') NOT NULL DEFAULT 'berproses' COMMENT 'Skala prioritas tugas',
        target_selesai DATETIME NOT NULL COMMENT 'Target waktu selesai tugas',
        keterangan_tugas TEXT NOT NULL COMMENT 'Deskripsi detail tugas',
        lampiran TEXT NULL COMMENT 'JSON array of file paths (foto, file, video)',
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT 'Status tugas',
        judul_tugas VARCHAR(255) NOT NULL COMMENT 'Judul tugas',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (pemberi_tugas) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (penerima_tugas) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_pemberi_tugas (pemberi_tugas),
        INDEX idx_penerima_tugas (penerima_tugas),
        INDEX idx_status (status),
        INDEX idx_skala_prioritas (skala_prioritas),
        INDEX idx_target_selesai (target_selesai)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ Successfully created daftar_tugas table');
    
  } catch (error) {
    console.error('❌ Error creating daftar_tugas table:', error.message);
  } finally {
    await sequelize.close();
  }
}

createDaftarTugasTable(); 