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
                const cleanKey = key.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
                const cleanValue = value.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
                envConfig[cleanKey] = cleanValue;
            }
        }
    });
}

// Load dotenv juga sebagai backup
require('dotenv').config();

// Ambil config dari .env file
const DB_NAME = envConfig.DB_NAME || process.env.DB_NAME;
const DB_HOST = envConfig.DB_HOST || process.env.DB_HOST;
const DB_USER = envConfig.DB_USER || process.env.DB_USER;
const DB_PASSWORD = envConfig.DB_PASSWORD || process.env.DB_PASSWORD;
const DB_PORT = envConfig.DB_PORT || process.env.DB_PORT;

console.log('🔧 Database Configuration:');
console.log('DB_NAME:', DB_NAME);
console.log('DB_HOST:', DB_HOST);
console.log('DB_USER:', DB_USER);
console.log('DB_PORT:', DB_PORT);

async function createLaporanKeuanganTable() {
    let connection;

    try {
        // Buat koneksi ke database
        connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            port: DB_PORT,
            database: DB_NAME
        });

        console.log('✅ Connected to database successfully');

        // Drop table if exists untuk membuat ulang
        try {
            await connection.execute('DROP TABLE IF EXISTS laporan_keuangan');
            console.log('🗑️ Dropped existing laporan_keuangan table');
        } catch (error) {
            console.log('ℹ️ No existing table to drop');
        }

        // SQL untuk membuat tabel laporan_keuangan
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS laporan_keuangan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_user INT NOT NULL,
        tanggal_laporan DATE NOT NULL,
        isi_laporan TEXT NOT NULL,
        images LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
        status_deleted TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

        // Eksekusi query untuk membuat tabel
        await connection.execute(createTableSQL);
        console.log('✅ Table laporan_keuangan created successfully');

        // Buat index untuk performa
        const createIndexesSQL = [
            'CREATE INDEX IF NOT EXISTS idx_laporan_keuangan_user ON laporan_keuangan(id_user);',
            'CREATE INDEX IF NOT EXISTS idx_laporan_keuangan_tanggal ON laporan_keuangan(tanggal_laporan);',
            'CREATE INDEX IF NOT EXISTS idx_laporan_keuangan_status ON laporan_keuangan(status_deleted);',
            'CREATE INDEX IF NOT EXISTS idx_laporan_keuangan_created ON laporan_keuangan(created_at);'
        ];

        for (const indexSQL of createIndexesSQL) {
            try {
                await connection.execute(indexSQL);
                console.log('✅ Index created successfully');
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    console.log('ℹ️ Index already exists, skipping...');
                } else {
                    console.log('⚠️ Error creating index:', error.message);
                }
            }
        }

        console.log('🎉 All operations completed successfully!');
        console.log('📋 Table laporan_keuangan is ready to use');

    } catch (error) {
        console.error('❌ Error creating table:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Jalankan fungsi
createLaporanKeuanganTable()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }); 