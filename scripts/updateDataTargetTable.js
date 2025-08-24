const { sequelize } = require('../config/database');

const updateDataTargetTable = async () => {
  try {
    console.log('🔄 Updating data_target table...');
    
    // Drop existing table
    await sequelize.query('DROP TABLE IF EXISTS `data_target`');
    console.log('✅ Old table dropped');
    
    // Create new table without unnecessary fields
    await sequelize.query(`
      CREATE TABLE \`data_target\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`nama_target\` varchar(100) NOT NULL COMMENT 'Nama target/lokasi (contoh: TEPUNG BOSGIL, BSG PUSAT, dll)',
        \`target_nominal\` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Target nominal dalam Rupiah',
        \`created_by\` int(11) NOT NULL COMMENT 'ID user yang membuat',
        \`updated_by\` int(11) DEFAULT NULL COMMENT 'ID user yang terakhir update',
        \`status_deleted\` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Status soft delete',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_nama_target\` (\`nama_target\`),
        KEY \`idx_status_deleted\` (\`status_deleted\`),
        KEY \`idx_created_by\` (\`created_by\`),
        KEY \`idx_updated_by\` (\`updated_by\`),
        CONSTRAINT \`fk_data_target_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`fk_data_target_updated_by\` FOREIGN KEY (\`updated_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel untuk menyimpan data target keuangan dari berbagai lokasi BSG'
    `);
    
    console.log('✅ New table created successfully!');
    
    // Insert sample data
    console.log('🔄 Inserting sample data...');
    
    await sequelize.query(`
      INSERT INTO \`data_target\` (\`nama_target\`, \`target_nominal\`, \`created_by\`) VALUES
      ('TEPUNG BOSGIL', 500000000.00, 1),
      ('BSG PUSAT', 300000000.00, 1),
      ('BSG BSD', 250000000.00, 1),
      ('BSG BINTARO', 200000000.00, 1),
      ('BSG CONDET', 180000000.00, 1),
      ('BSG BANDUNG', 220000000.00, 1),
      ('BSG BUAH BATU', 150000000.00, 1),
      ('BSG PAGESANGAN', 120000000.00, 1),
      ('BSG AMPEL', 100000000.00, 1),
      ('BSG SIDOARJO', 130000000.00, 1),
      ('BSG MALANG', 140000000.00, 1),
      ('OUTLET KARANG', 80000000.00, 1),
      ('OUTLET PERMATA', 90000000.00, 1)
    `);
    
    console.log('✅ Sample data inserted successfully!');
    console.log('🎉 Data Target table updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating data_target table:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the script
updateDataTargetTable();
