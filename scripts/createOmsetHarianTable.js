const mysql = require('mysql2/promise');
require('dotenv').config();

async function createOmsetHarianTable() {
    let connection;

    try {
        console.log('🚀 Starting omset_harian table creation...');

        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '192.168.1.6',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistem_bosgil_group'
        });

        console.log('✅ Database connected successfully');

        // Drop table if exists and recreate
        await connection.execute('DROP TABLE IF EXISTS omset_harian');
        console.log('🗑️ Dropped existing table');

        // Create table
        const createTableQuery = `
      CREATE TABLE omset_harian (
        id int(11) NOT NULL AUTO_INCREMENT,
        id_user int(11) NOT NULL,
        tanggal_omset date NOT NULL,
        isi_omset text COLLATE utf8mb4_unicode_ci NOT NULL,
        images longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
        status_deleted tinyint(1) DEFAULT '0',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_omset_harian_user (id_user),
        KEY idx_omset_harian_tanggal (tanggal_omset),
        KEY idx_omset_harian_status (status_deleted),
        KEY idx_omset_harian_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1
    `;

        await connection.execute(createTableQuery);
        console.log('✅ Table omset_harian created successfully');

        // Clear existing data and insert fresh sample data
        try {
            await connection.execute('TRUNCATE TABLE omset_harian');
            console.log('🗑️ Cleared existing data with TRUNCATE');
        } catch (error) {
            console.log('⚠️ Could not TRUNCATE, trying DELETE instead...');
            await connection.execute('DELETE FROM omset_harian');
            await connection.execute('ALTER TABLE omset_harian AUTO_INCREMENT = 1');
            console.log('🗑️ Cleared existing data with DELETE');
        }

        // Insert fresh sample data
        const sampleData = [
            {
                id_user: 1,
                tanggal_omset: '2024-01-15',
                isi_omset: 'OMSET HARIAN OUTLET\nHari : Senin\nTgl : 15/01/2024\n\n#PENJUALAN\nSaldo Awal\nPenjualan Produk A\nPenjualan Produk B\nPenjualan Produk C\n\nJumlah Omset Hari Ini   Rp 5.000.000\n\n#JASA\nPendapatan Jasa\nKonsultasi\nMaintenance\n\nTotal Jasa   Rp 3.500.000'
            },
            {
                id_user: 1,
                tanggal_omset: '2024-01-16',
                isi_omset: 'OMSET HARIAN OUTLET\nHari : Selasa\nTgl : 16/01/2024\n\n#PENJUALAN\nSaldo Awal\nPenjualan Produk D\nPenjualan Produk E\n\nJumlah Omset Hari Ini   Rp 7.500.000\n\n#JASA\nPendapatan Jasa\nKonsultasi\nTraining\n\nTotal Jasa   Rp 2.800.000'
            },
            {
                id_user: 1,
                tanggal_omset: '2024-01-17',
                isi_omset: 'OMSET HARIAN OUTLET\nHari : Rabu\nTgl : 17/01/2024\n\n#PENJUALAN\nSaldo Awal\nPenjualan Produk F\nPenjualan Produk G\nPenjualan Produk H\n\nJumlah Omset Hari Ini   Rp 4.200.000\n\n#LAINNYA\nPendapatan Sewa\nPendapatan Training\n\nTotal Lainnya   Rp 1.200.000'
            },
            {
                id_user: 1,
                tanggal_omset: '2024-01-18',
                isi_omset: 'OMSET HARIAN OUTLET\nHari : Kamis\nTgl : 18/01/2024\n\n#PENJUALAN\nSaldo Awal\nPenjualan Produk I\nPenjualan Produk J\n\nJumlah Omset Hari Ini   Rp 6.800.000\n\n#JASA\nPendapatan Jasa\nKonsultasi\n\nTotal Jasa   Rp 1.500.000'
            },
            {
                id_user: 1,
                tanggal_omset: '2024-01-19',
                isi_omset: 'OMSET HARIAN OUTLET\nHari : Jumat\nTgl : 19/01/2024\n\n#PENJUALAN\nSaldo Awal\nPenjualan Produk K\nPenjualan Produk L\nPenjualan Produk M\n\nJumlah Omset Hari Ini   Rp 9.200.000\n\n#JASA\nPendapatan Jasa\nTraining\nMaintenance\n\nTotal Jasa   Rp 4.100.000'
            }
        ];

        for (const data of sampleData) {
            const insertQuery = `
          INSERT INTO omset_harian (id_user, tanggal_omset, isi_omset, status_deleted, created_at, updated_at)
          VALUES (?, ?, ?, 0, NOW(), NOW())
        `;

            await connection.execute(insertQuery, [data.id_user, data.tanggal_omset, data.isi_omset]);
        }

        console.log('✅ Fresh sample data inserted successfully');

        // Verify table structure
        const [columns] = await connection.execute('DESCRIBE omset_harian');
        console.log('📋 Table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });

        // Verify data
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM omset_harian WHERE status_deleted = 0');
        console.log(`📊 Total records: ${rows[0].count}`);

        // Show sample data
        const [sampleRows] = await connection.execute('SELECT id, tanggal_omset, LEFT(isi_omset, 50) as preview FROM omset_harian WHERE status_deleted = 0 ORDER BY tanggal_omset');
        console.log('📝 Sample data preview:');
        sampleRows.forEach(row => {
            console.log(`  - ID ${row.id}: ${row.tanggal_omset} - ${row.preview}...`);
        });

        console.log('🎉 omset_harian table setup completed successfully!');

    } catch (error) {
        console.error('❌ Error creating omset_harian table:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
        process.exit(0);
    }
}

createOmsetHarianTable(); 