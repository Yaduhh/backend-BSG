const { sequelize } = require('../config/database');

async function createPicLeaderTable() {
  try {
    console.log('🔄 Starting pic_leader table creation...');

    // 1. Check if table already exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'pic_leader'");
    if (tables.length > 0) {
      console.log('⚠️  Table pic_leader already exists. Skipping creation.');
      return;
    }

    // 2. Create pic_leader table
    await sequelize.query(`
      CREATE TABLE pic_leader (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_user INT NOT NULL,
        nama VARCHAR(255) NOT NULL COMMENT 'Nama menu/tanggung jawab leader',
        link VARCHAR(500) NULL COMMENT 'Link/navigasi untuk menu',
        deskripsi TEXT NULL COMMENT 'Deskripsi detail tanggung jawab',
        prioritas ENUM('tinggi', 'sedang', 'rendah') DEFAULT 'sedang' COMMENT 'Prioritas menu',
        status_aktif BOOLEAN DEFAULT TRUE COMMENT 'Status aktif menu',
        status_deleted BOOLEAN DEFAULT FALSE COMMENT 'Soft delete flag',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_id_user (id_user),
        INDEX idx_status_deleted (status_deleted),
        INDEX idx_status_aktif (status_aktif),
        INDEX idx_prioritas (prioritas),
        
        FOREIGN KEY (id_user) REFERENCES users(id) 
          ON UPDATE CASCADE ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Table untuk menyimpan menu dan tanggung jawab leader'
    `);

    console.log('✅ Table pic_leader created successfully!');

    // 3. Insert sample data
    console.log('🔄 Inserting sample data...');
    
    await sequelize.query(`
      INSERT INTO pic_leader (id_user, nama, link, deskripsi, prioritas, status_aktif, created_at, updated_at) VALUES
      (1, 'Kelola SOP', 'AdminSopManagement', 'Mengelola Standard Operating Procedure untuk tim', 'tinggi', TRUE, NOW(), NOW()),
      (1, 'Daftar Komplain', 'AdminKomplain', 'Menangani dan mengelola komplain dari owner', 'tinggi', TRUE, NOW(), NOW()),
      (1, 'Buat Saran', 'AdminSaran', 'Membuat dan mengirim saran kepada atasan', 'sedang', TRUE, NOW(), NOW()),
      (1, 'Data Pribadi', 'AdminDataPribadi', 'Mengelola data pribadi dan profil leader', 'sedang', TRUE, NOW(), NOW()),
      (1, 'KPI Saya', 'AdminKpiSaya', 'Melihat dan mengelola KPI pribadi', 'sedang', TRUE, NOW(), NOW()),
      (1, 'Tugas Saya', 'AdminTugasSaya', 'Melihat dan mengelola tugas yang diberikan', 'tinggi', TRUE, NOW(), NOW()),
      (1, 'SOP Terkait', 'AdminSopTerkait', 'Melihat SOP yang relevan dengan divisi', 'sedang', TRUE, NOW(), NOW()),
      (1, 'Aturan Perusahaan', 'AdminAturan', 'Melihat aturan dan kebijakan perusahaan', 'rendah', TRUE, NOW(), NOW()),
      (1, 'Slip Gaji', 'AdminSlipGaji', 'Melihat dan mengunduh slip gaji', 'rendah', TRUE, NOW(), NOW())
    `);

    console.log('✅ Sample data inserted successfully!');
    console.log('🎉 pic_leader table creation completed successfully!');

  } catch (error) {
    console.error('❌ Error creating pic_leader table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if called directly
if (require.main === module) {
  createPicLeaderTable()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createPicLeaderTable };
