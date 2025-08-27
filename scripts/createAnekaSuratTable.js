const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAnekaSuratTable() {
  let connection;

  try {
    console.log('🚀 Starting aneka_surat table creation...');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sistem_bosgil_group'
    });

    console.log('✅ Database connected successfully');

    // Drop table if exists and recreate
    await connection.execute('DROP TABLE IF EXISTS aneka_surat');
    console.log('🗑️ Dropped existing table');

    // Create table
    const createTableQuery = `
      CREATE TABLE aneka_surat (
        id int(11) NOT NULL AUTO_INCREMENT,
        jenis_dokumen ENUM('PERJANJIAN KERJA', 'SEWA MENYEWA', 'PIHAK KE-3', 'INVESTOR', 'NIB', 'PBG/IMB', 'SERTIFIKAT MERK', 'SERTIFIKAT HALAL', 'DOKUMEN LAIN') NOT NULL,
        judul_dokumen varchar(255) NOT NULL COMMENT 'Judul dokumen',
        lampiran longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'JSON array of file paths',
        id_user int(11) NOT NULL COMMENT 'ID user yang membuat',
        status_deleted tinyint(1) DEFAULT '0',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_aneka_surat_user (id_user),
        KEY idx_aneka_surat_jenis (jenis_dokumen),
        KEY idx_aneka_surat_status (status_deleted),
        KEY idx_aneka_surat_created (created_at),
        CONSTRAINT fk_aneka_surat_user FOREIGN KEY (id_user) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Table aneka_surat created successfully');

    // Insert sample data
    console.log('🔄 Inserting sample data...');
    
    const sampleData = [
      {
        jenis_dokumen: 'PERJANJIAN KERJA',
        judul_dokumen: 'Perjanjian Kerja Karyawan Tetap',
        lampiran: JSON.stringify([
          {
            file_path: 'uploads/aneka-surat/perjanjian-kerja-1.pdf',
            file_name: 'perjanjian_kerja_2024.pdf',
            upload_date: new Date().toISOString()
          }
        ]),
        id_user: 1
      },
      {
        jenis_dokumen: 'NIB',
        judul_dokumen: 'Nomor Induk Berusaha PT. Bosgil Group',
        lampiran: JSON.stringify([
          {
            file_path: 'uploads/aneka-surat/nib-bosgil.pdf',
            file_name: 'NIB_Bosgil_Group.pdf',
            upload_date: new Date().toISOString()
          }
        ]),
        id_user: 1
      },
      {
        jenis_dokumen: 'SERTIFIKAT HALAL',
        judul_dokumen: 'Sertifikat Halal Produk Roti',
        lampiran: JSON.stringify([
          {
            file_path: 'uploads/aneka-surat/sertifikat-halal.jpg',
            file_name: 'sertifikat_halal_roti.jpg',
            upload_date: new Date().toISOString()
          },
          {
            file_path: 'uploads/aneka-surat/sertifikat-halal-detail.pdf',
            file_name: 'detail_sertifikat_halal.pdf',
            upload_date: new Date().toISOString()
          }
        ]),
        id_user: 1
      }
    ];

    for (const data of sampleData) {
      await connection.execute(
        'INSERT INTO aneka_surat (jenis_dokumen, judul_dokumen, lampiran, id_user) VALUES (?, ?, ?, ?)',
        [data.jenis_dokumen, data.judul_dokumen, data.lampiran, data.id_user]
      );
    }

    console.log('✅ Sample data inserted successfully');

    // Show table structure
    const [columns] = await connection.execute('DESCRIBE aneka_surat');
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Show sample data
    const [rows] = await connection.execute('SELECT * FROM aneka_surat LIMIT 3');
    console.log('\n📊 Sample data:');
    rows.forEach(row => {
      console.log(`  ID: ${row.id}, Jenis: ${row.jenis_dokumen}, Judul: ${row.judul_dokumen}`);
    });

  } catch (error) {
    console.error('❌ Error creating aneka_surat table:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

createAnekaSuratTable();
