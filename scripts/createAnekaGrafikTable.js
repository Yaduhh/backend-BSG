const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAnekaGrafikTable() {
    let connection;

    try {
        console.log('🚀 Starting aneka_grafik table creation...');

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
        await connection.execute('DROP TABLE IF EXISTS aneka_grafik');
        console.log('🗑️ Dropped existing table');

        // Create table
        const createTableQuery = `
      CREATE TABLE aneka_grafik (
        id int(11) NOT NULL AUTO_INCREMENT,
        id_user int(11) NOT NULL,
        tanggal_grafik date NOT NULL,
        isi_grafik text COLLATE utf8mb4_unicode_ci NOT NULL,
        images longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
        status_deleted tinyint(1) DEFAULT '0',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_aneka_grafik_user (id_user),
        KEY idx_aneka_grafik_tanggal (tanggal_grafik),
        KEY idx_aneka_grafik_status (status_deleted),
        KEY idx_aneka_grafik_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1
    `;

        await connection.execute(createTableQuery);
        console.log('✅ Table aneka_grafik created successfully');

        // Clear existing data and insert fresh sample data
        try {
            await connection.execute('DELETE FROM aneka_grafik');
            console.log('🗑️ Cleared existing data');
        } catch (error) {
            console.log('ℹ️ No existing data to clear');
        }

        // Insert fresh sample data
        const sampleData = [
            {
                id_user: 1,
                tanggal_grafik: '2024-01-15',
                isi_grafik: 'ANEKA GRAFIK OUTLET\nHari : Senin\nTgl : 15/01/2024\n\n#GRAFIK PENJUALAN\nGrafik Produk A\nGrafik Produk B\nGrafik Produk C\n\nTotal Grafik Hari Ini   Rp 8.500.000\n\n#GRAFIK JASA\nGrafik Konsultasi\nGrafik Training\n\nTotal Grafik Jasa   Rp 2.800.000'
            },
            {
                id_user: 1,
                tanggal_grafik: '2024-01-16',
                isi_grafik: 'ANEKA GRAFIK OUTLET\nHari : Selasa\nTgl : 16/01/2024\n\n#GRAFIK PENJUALAN\nGrafik Produk D\nGrafik Produk E\n\nJumlah Grafik Hari Ini   Rp 6.200.000\n\n#GRAFIK JASA\nGrafik Maintenance\n\nTotal Grafik Jasa   Rp 1.500.000'
            },
            {
                id_user: 1,
                tanggal_grafik: '2024-01-17',
                isi_grafik: 'ANEKA GRAFIK OUTLET\nHari : Rabu\nTgl : 17/01/2024\n\n#GRAFIK PENJUALAN\nGrafik Produk F\nGrafik Produk G\nGrafik Produk H\n\nJumlah Grafik Hari Ini   Rp 7.800.000\n\n#GRAFIK JASA\nGrafik Konsultasi\nGrafik Training\n\nTotal Grafik Jasa   Rp 3.200.000'
            },
            {
                id_user: 1,
                tanggal_grafik: '2024-01-18',
                isi_grafik: 'ANEKA GRAFIK OUTLET\nHari : Kamis\nTgl : 18/01/2024\n\n#GRAFIK PENJUALAN\nGrafik Produk I\nGrafik Produk J\n\nJumlah Grafik Hari Ini   Rp 5.600.000\n\n#GRAFIK JASA\nGrafik Konsultasi\n\nTotal Grafik Jasa   Rp 1.800.000'
            },
            {
                id_user: 1,
                tanggal_grafik: '2024-01-19',
                isi_grafik: 'ANEKA GRAFIK OUTLET\nHari : Jumat\nTgl : 19/01/2024\n\n#GRAFIK PENJUALAN\nGrafik Produk K\nGrafik Produk L\nGrafik Produk M\n\nJumlah Grafik Hari Ini   Rp 9.100.000\n\n#GRAFIK JASA\nGrafik Training\nGrafik Maintenance\n\nTotal Grafik Jasa   Rp 4.500.000'
            }
        ];

        for (const data of sampleData) {
            const insertQuery = `
          INSERT INTO aneka_grafik (id_user, tanggal_grafik, isi_grafik, status_deleted, created_at, updated_at)
          VALUES (?, ?, ?, 0, NOW(), NOW())
        `;

            await connection.execute(insertQuery, [data.id_user, data.tanggal_grafik, data.isi_grafik]);
        }

        console.log('✅ Fresh sample data inserted successfully');

        // Verify table structure
        const [columns] = await connection.execute('DESCRIBE aneka_grafik');
        console.log('📋 Table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });

        // Verify data
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM aneka_grafik WHERE status_deleted = 0');
        console.log(`📊 Total records: ${rows[0].count}`);

        // Show sample data
        const [sampleRows] = await connection.execute('SELECT id, tanggal_grafik, LEFT(isi_grafik, 50) as preview FROM aneka_grafik WHERE status_deleted = 0 ORDER BY tanggal_grafik');
        console.log('📝 Sample data preview:');
        sampleRows.forEach(row => {
            console.log(`  - ID ${row.id}: ${row.tanggal_grafik} - ${row.preview}...`);
        });

        console.log('🎉 Aneka Grafik table creation completed successfully!');
    } catch (error) {
        console.error('❌ Error creating aneka_grafik table:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the function
createAnekaGrafikTable(); 