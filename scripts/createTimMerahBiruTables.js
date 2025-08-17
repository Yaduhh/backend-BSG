const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca file .env secara manual
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

const config = {
  host: envConfig.DB_HOST || '192.168.30.124',
  port: envConfig.DB_PORT || 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group'
};

async function createTimMerahBiruTables() {
  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL database');

    // Create tim_merah table
    const createTimMerahQuery = `
      CREATE TABLE IF NOT EXISTS tim_merah (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL COMMENT 'Nama karyawan',
        divisi VARCHAR(255) NOT NULL COMMENT 'Divisi/cabang tempat kerja',
        posisi VARCHAR(255) NOT NULL COMMENT 'Posisi/jabatan karyawan',
        status ENUM('SP1', 'SP2', 'SP3') NOT NULL COMMENT 'Status peringatan',
        keterangan TEXT COMMENT 'Keterangan pelanggaran',
        tanggal_masuk_tim DATE NOT NULL COMMENT 'Tanggal masuk ke tim merah',
        created_by INT NOT NULL COMMENT 'ID admin yang menginput',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_nama (nama),
        INDEX idx_divisi (divisi),
        INDEX idx_status (status),
        INDEX idx_tanggal_masuk_tim (tanggal_masuk_tim),
        INDEX idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTimMerahQuery);
    console.log('✅ Table tim_merah created successfully');

    // Create tim_biru table
    const createTimBiruQuery = `
      CREATE TABLE IF NOT EXISTS tim_biru (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL COMMENT 'Nama karyawan',
        divisi VARCHAR(255) NOT NULL COMMENT 'Divisi/cabang tempat kerja',
        posisi VARCHAR(255) NOT NULL COMMENT 'Posisi/jabatan karyawan',
        prestasi VARCHAR(500) NOT NULL COMMENT 'Prestasi yang diraih',
        keterangan TEXT COMMENT 'Keterangan tambahan',
        tanggal_masuk_tim DATE NOT NULL COMMENT 'Tanggal masuk ke tim biru',
        created_by INT NOT NULL COMMENT 'ID admin yang menginput',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_nama (nama),
        INDEX idx_divisi (divisi),
        INDEX idx_tanggal_masuk_tim (tanggal_masuk_tim),
        INDEX idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTimBiruQuery);
    console.log('✅ Table tim_biru created successfully');

    // Insert sample data for tim_merah
    const sampleTimMerah = [
      ['Ahmad Rizki', 'BSG PUSAT', 'KOKI', 'SP2', 'Pelecehan terhadap rekan kerja', '2024-01-15', 1],
      ['Sari Indah', 'BSG BSD', 'PR', 'SP2', 'Tidak hadir tanpa keterangan 3 hari', '2024-01-10', 1],
      ['Budi Santoso', 'SOGIL', 'KOKI', 'SP1', 'Terlambat berulang kali', '2024-01-12', 1],
      ['Maya Sari', 'SOGIL', 'WAITRESS', 'SP1', 'Tidak mengikuti SOP', '2024-01-08', 1],
      ['Andi Pratama', 'BSG KARAWACI', 'KASIR', 'SP1', '', '2024-01-05', 1],
    ];

    const insertTimMerahQuery = `
      INSERT INTO tim_merah (nama, divisi, posisi, status, keterangan, tanggal_masuk_tim, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const data of sampleTimMerah) {
      await connection.execute(insertTimMerahQuery, data);
    }
    console.log('✅ Sample data inserted into tim_merah');

    // Insert sample data for tim_biru
    const sampleTimBiru = [
      ['Joko Widodo', 'BSG PUSAT', 'KOKI', 'Karyawan Terbaik Bulan Ini', 'Konsisten dan inovatif', '2024-01-01', 1],
      ['Dewi Lestari', 'BSG BSD', 'MANAGER', 'Peningkatan Sales 20%', 'Leadership yang baik', '2024-01-03', 1],
      ['Rizky Febian', 'SOGIL', 'BARISTA', 'Customer Service Terbaik', 'Ramah dan profesional', '2024-01-05', 1],
      ['Putri Ayu', 'BSG SIDOARJO', 'WAITRESS', 'Zero Complaint 3 Bulan', 'Pelayanan memuaskan', '2024-01-07', 1],
      ['Agus Salim', 'BSG BUAH BATU', 'KOKI', 'Menu Inovasi Terlaris', 'Kreatif dalam memasak', '2024-01-10', 1],
    ];

    const insertTimBiruQuery = `
      INSERT INTO tim_biru (nama, divisi, posisi, prestasi, keterangan, tanggal_masuk_tim, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const data of sampleTimBiru) {
      await connection.execute(insertTimBiruQuery, data);
    }
    console.log('✅ Sample data inserted into tim_biru');

    console.log('🎉 Tim Merah/Biru tables created and populated successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
createTimMerahBiruTables();
