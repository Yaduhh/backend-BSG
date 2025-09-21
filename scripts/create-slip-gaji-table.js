const { sequelize } = require('../config/database');

const createSlipGajiTable = async () => {
  try {
    console.log('🚀 Creating slip_gaji table...');

    // Create slip_gaji table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS slip_gaji (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lampiran_foto VARCHAR(500) NOT NULL COMMENT 'URL foto slip gaji',
        keterangan TEXT COMMENT 'Keterangan slip gaji',
        id_user INT NOT NULL COMMENT 'ID user pemilik slip gaji',
        status_deleted BOOLEAN DEFAULT FALSE COMMENT 'Status soft delete',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu dibuat',
        created_by INT COMMENT 'ID user yang membuat',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu diupdate',
        INDEX idx_slip_gaji_user (id_user),
        INDEX idx_slip_gaji_created_by (created_by),
        INDEX idx_slip_gaji_status (status_deleted),
        INDEX idx_slip_gaji_created_at (created_at),
        FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel slip gaji karyawan';
    `);

    console.log('✅ slip_gaji table created successfully!');
    
    // Show table structure
    const [results] = await sequelize.query('DESCRIBE slip_gaji');
    console.log('📋 Table structure:');
    console.table(results);

  } catch (error) {
    console.error('❌ Error creating slip_gaji table:', error);
    throw error;
  }
};

// Run the script
if (require.main === module) {
  createSlipGajiTable()
    .then(() => {
      console.log('🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = createSlipGajiTable;
