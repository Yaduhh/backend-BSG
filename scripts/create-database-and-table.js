const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabaseAndTable() {
  let connection;
  
  try {
    console.log('🔧 ===== CREATING DATABASE AND TABLE =====');
    
    // Create connection without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected to MySQL server');

    // Create database if not exists
    const dbName = process.env.DB_NAME || 'bosgil_group';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database ${dbName} created/verified`);

    // Use the database
    await connection.execute(`USE \`${dbName}\``);
    console.log(`✅ Using database ${dbName}`);

    // Create struktur_organisasi table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS struktur_organisasi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        foto VARCHAR(500),
        created_by INT,
        updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Table struktur_organisasi created successfully');

    // Check if table exists and show structure
    const [tables] = await connection.execute("SHOW TABLES LIKE 'struktur_organisasi'");
    if (tables.length > 0) {
      console.log('✅ Table struktur_organisasi exists');
      
      // Show table structure
      const [columns] = await connection.execute("DESCRIBE struktur_organisasi");
      console.log('📋 Table structure:');
      console.table(columns);
    } else {
      console.log('❌ Table struktur_organisasi not found');
    }

    // Insert sample data
    const sampleData = [
      {
        judul: 'STRUKTUR ORGANISASI BOSCIL GROUP 2025',
        deskripsi: 'Struktur organisasi lengkap BOSCIL GROUP untuk tahun 2025 yang mencakup semua divisi dan departemen.',
        foto: 'struktur-org-2025.jpg'
      },
      {
        judul: 'MANAJEMEN PUNCAK',
        deskripsi: 'Tim manajemen puncak yang bertanggung jawab atas strategi dan pengambilan keputusan perusahaan.',
        foto: 'manajemen-puncak.jpg'
      }
    ];

    for (const data of sampleData) {
      await connection.execute(
        'INSERT INTO struktur_organisasi (judul, deskripsi, foto) VALUES (?, ?, ?)',
        [data.judul, data.deskripsi, data.foto]
      );
    }
    console.log('✅ Sample data inserted successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
createDatabaseAndTable();
