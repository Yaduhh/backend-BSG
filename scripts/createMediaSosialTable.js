const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../.env');
let envConfig = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const cleanContent = envContent
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  cleanContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value !== undefined) {
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        envConfig[cleanKey] = cleanValue;
      }
    }
  });
}

require('dotenv').config();

const DB_HOST = envConfig.DB_HOST || process.env.DB_HOST || 'localhost';
const DB_PORT = envConfig.DB_PORT || process.env.DB_PORT || 3306;
const DB_USER = envConfig.DB_USER || process.env.DB_USER || 'root';
const DB_PASSWORD = envConfig.DB_PASSWORD || process.env.DB_PASSWORD || '';
const DB_NAME = envConfig.DB_NAME || process.env.DB_NAME || 'sistem_bosgil_group';

async function createMediaSosialTable() {
  let connection;
  try {
    console.log('🚀 Starting media_sosial table creation...');

    connection = await mysql.createConnection({
      host: DB_HOST,
      port: parseInt(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log('✅ Database connected successfully');

    // Drop table if exists and recreate
    await connection.execute('DROP TABLE IF EXISTS media_sosial');
    console.log('🗑️ Dropped existing table media_sosial');

    // Create table
    const createTableQuery = `
      CREATE TABLE media_sosial (
        id int(11) NOT NULL AUTO_INCREMENT,
        id_user int(11) NOT NULL,
        tanggal_laporan date NOT NULL,
        tahun smallint NOT NULL,
        bulan tinyint NOT NULL,
        isi_laporan text COLLATE utf8mb4_unicode_ci NOT NULL,
        images longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
        status_deleted tinyint(1) DEFAULT '0',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_media_sosial_user (id_user),
        KEY idx_media_sosial_tahun_bulan (tahun, bulan),
        KEY idx_media_sosial_tanggal (tanggal_laporan),
        KEY idx_media_sosial_status (status_deleted)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Table media_sosial created successfully');

    // Insert sample data
    try {
      await connection.execute('TRUNCATE TABLE media_sosial');
    } catch (e) {
      await connection.execute('DELETE FROM media_sosial');
      await connection.execute('ALTER TABLE media_sosial AUTO_INCREMENT = 1');
    }

    const sampleData = [
      { id_user: 1, tanggal_laporan: '2025-08-05', isi_laporan: 'Update harian medsos: engagement stabil, reach naik 5%.' },
      { id_user: 1, tanggal_laporan: '2025-08-12', isi_laporan: 'Konten reels perform terbaik minggu ini.' },
      { id_user: 2, tanggal_laporan: '2025-09-02', isi_laporan: 'Kolaborasi KOL berdampak pada kenaikan follower.' }
    ];

    for (const d of sampleData) {
      const tahun = new Date(d.tanggal_laporan).getFullYear();
      const bulan = new Date(d.tanggal_laporan).getMonth() + 1;
      const insertQuery = `
        INSERT INTO media_sosial (id_user, tanggal_laporan, tahun, bulan, isi_laporan, status_deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())
      `;
      await connection.execute(insertQuery, [d.id_user, d.tanggal_laporan, tahun, bulan, d.isi_laporan]);
    }

    console.log('✅ Sample data for media_sosial inserted');

    // Show table structure
    const [columns] = await connection.execute('DESCRIBE media_sosial');
    console.log('📋 Table structure (media_sosial):');
    columns.forEach(col => console.log(` - ${col.Field}: ${col.Type}`));

    const [countRows] = await connection.execute('SELECT COUNT(*) as cnt FROM media_sosial WHERE status_deleted = 0');
    console.log(`📊 Total records: ${countRows[0].cnt}`);

    const [preview] = await connection.execute('SELECT id, tanggal_laporan, tahun, bulan, LEFT(isi_laporan, 60) preview FROM media_sosial WHERE status_deleted = 0 ORDER BY tanggal_laporan DESC');
    console.log('📝 Sample data preview:');
    preview.forEach(r => console.log(` - ID ${r.id}: ${r.tanggal_laporan} (${r.tahun}-${r.bulan}) - ${r.preview}...`));

    console.log('🎉 media_sosial table setup completed successfully!');
  } catch (error) {
    console.error('❌ Error creating media_sosial table:', error);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

createMediaSosialTable();
