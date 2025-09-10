const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTargetHarianTable() {
  let connection;

  try {
    console.log('🚀 Starting taget table creation...');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '192.168.1.2',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sistem_bosgil_group'
    });

    console.log('✅ Database connected successfully');

    // Drop table if exists and recreate
    await connection.execute('DROP TABLE IF EXISTS taget');
    console.log('🗑️ Dropped existing table');

    // Create table (mirror omset_harian structure, but columns renamed for target)
    const createTableQuery = `
      CREATE TABLE taget (
        id int(11) NOT NULL AUTO_INCREMENT,
        id_user int(11) NOT NULL,
        tanggal_target date NOT NULL,
        isi_target text COLLATE utf8mb4_unicode_ci NOT NULL,
        images longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
        status_deleted tinyint(1) DEFAULT '0',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_taget_user (id_user),
        KEY idx_taget_tanggal (tanggal_target),
        KEY idx_taget_status (status_deleted),
        KEY idx_taget_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Table taget created successfully');

    // Verify table structure
    const [columns] = await connection.execute('DESCRIBE taget');
    console.log('📋 Table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    console.log('🎉 taget table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error creating taget table:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

createTargetHarianTable();
