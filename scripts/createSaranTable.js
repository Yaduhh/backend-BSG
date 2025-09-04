const { sequelize } = require('../config/database');

const createSaranTable = async () => {
  try {
    // Create saran table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS saran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        saran VARCHAR(500) NOT NULL,
        deskripsi_saran TEXT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status_deleted BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table saran berhasil dibuat!');
    
    // Insert sample data
    await sequelize.query(`
      INSERT INTO saran (nama, saran, deskripsi_saran, created_by) VALUES
      ('RANGGA', 'CETAK BANNER', 'Perlu banner untuk promosi produk baru', 1),
      ('RICO', 'PERBAIKAN PUSAT', 'Pusat perlu perbaikan infrastruktur', 1),
      ('HERDI', 'PERBAIKAN BSD', 'Area BSD perlu maintenance rutin', 1)
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
    `);

    console.log('✅ Sample data saran berhasil ditambahkan!');
    
  } catch (error) {
    console.error('❌ Error creating saran table:', error);
  } finally {
    await sequelize.close();
  }
};

createSaranTable();
