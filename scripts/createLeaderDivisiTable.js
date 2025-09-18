const { sequelize } = require('../config/database');

async function createLeaderDivisiTable() {
  try {
    console.log('🔄 Starting leader_divisi table creation...');

    // 1. Check if table already exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'leader_divisi'");
    if (tables.length > 0) {
      console.log('⚠️  Table leader_divisi already exists. Skipping creation.');
      return;
    }

    // 2. Create leader_divisi table
    await sequelize.query(`
      CREATE TABLE leader_divisi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_user INT NOT NULL COMMENT 'ID user leader',
        id_divisi INT NOT NULL COMMENT 'ID divisi',
        status_aktif BOOLEAN DEFAULT TRUE COMMENT 'Status aktif relasi',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT COMMENT 'ID user yang membuat relasi',
        updated_by INT COMMENT 'ID user yang update relasi',
        status_deleted BOOLEAN DEFAULT FALSE COMMENT 'Soft delete flag',
        deleted_at TIMESTAMP NULL COMMENT 'Timestamp soft delete',
        deleted_by INT NULL COMMENT 'ID user yang menghapus relasi',
        
        INDEX idx_id_user (id_user),
        INDEX idx_id_divisi (id_divisi),
        INDEX idx_status_aktif (status_aktif),
        INDEX idx_status_deleted (status_deleted),
        UNIQUE INDEX idx_leader_divisi_unique (id_user, id_divisi, status_deleted),
        
        FOREIGN KEY (id_user) REFERENCES users(id) 
          ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (id_divisi) REFERENCES sdm_divisi(id) 
          ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) 
          ON UPDATE CASCADE ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users(id) 
          ON UPDATE CASCADE ON DELETE SET NULL,
        FOREIGN KEY (deleted_by) REFERENCES users(id) 
          ON UPDATE CASCADE ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Table junction untuk relasi leader dan divisi'
    `);

    console.log('✅ Table leader_divisi created successfully!');

    // 3. Insert sample data (optional)
    console.log('🔄 Inserting sample data...');
    
    // Get first leader and first divisi for sample
    const [leaders] = await sequelize.query(`
      SELECT id FROM users WHERE role = 'leader' AND status_deleted = false LIMIT 1
    `);
    
    const [divisis] = await sequelize.query(`
      SELECT id FROM sdm_divisi WHERE status_aktif = true AND status_deleted = false LIMIT 1
    `);

    if (leaders.length > 0 && divisis.length > 0) {
      await sequelize.query(`
        INSERT INTO leader_divisi (id_user, id_divisi, created_by, created_at, updated_at) VALUES
        (${leaders[0].id}, ${divisis[0].id}, 1, NOW(), NOW())
      `);
      console.log('✅ Sample data inserted successfully!');
    } else {
      console.log('⚠️  No leaders or divisi found for sample data');
    }

    console.log('🎉 leader_divisi table creation completed successfully!');

  } catch (error) {
    console.error('❌ Error creating leader_divisi table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script if called directly
if (require.main === module) {
  createLeaderDivisiTable()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createLeaderDivisiTable };
