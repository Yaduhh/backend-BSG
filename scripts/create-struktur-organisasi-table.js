const { sequelize } = require('../config/database');

const createStrukturOrganisasiTable = async () => {
  try {
    console.log('🔨 Creating Struktur Organisasi table...');

    // Create struktur_organisasi table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS struktur_organisasi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL COMMENT 'Judul struktur organisasi',
        deskripsi TEXT COMMENT 'Deskripsi struktur organisasi',
        foto VARCHAR(500) COMMENT 'Path foto struktur organisasi',
        created_by INT NULL COMMENT 'ID admin yang menginput',
        updated_by INT NULL COMMENT 'ID admin yang mengupdate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_judul (judul),
        INDEX idx_created_by (created_by),
        
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table struktur_organisasi created successfully');

    // Insert sample data
    await sequelize.query(`
      INSERT IGNORE INTO struktur_organisasi (judul, deskripsi, foto) VALUES 
      ('STRUKTUR ORGANISASI BOSCIL GROUP 2025', 'Struktur organisasi lengkap BOSCIL GROUP untuk tahun 2025 yang mencakup semua divisi dan departemen.', 'struktur-org-2025.jpg'),
      ('MANAJEMEN PUNCAK', 'Tim manajemen puncak yang bertanggung jawab atas strategi dan pengambilan keputusan perusahaan.', 'manajemen-puncak.jpg');
    `);

    console.log('✅ Sample data inserted successfully');

  } catch (error) {
    console.error('❌ Error creating struktur organisasi table:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
createStrukturOrganisasiTable();
