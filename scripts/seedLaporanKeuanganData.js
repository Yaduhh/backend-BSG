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

async function seedLaporanKeuanganData() {
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

        // Data sample untuk laporan keuangan
        const sampleData = [
            {
                id_user: 1,
                tanggal_laporan: '2024-01-15',
                isi_laporan: '[IMG:1755025137909]\n\n#LAPORAN PEMASUKAN BULANAN JANUARI 2024\n\nRingkasan Pemasukan Bulanan\nPemasukan dari penjualan produk utama mencapai Rp 15.000.000 dengan rincian:\n\n• Penjualan Produk A: Rp 8.000.000\n• Penjualan Produk B: Rp 5.000.000\n• Penjualan Produk C: Rp 2.000.000\n\nPemasukan tambahan dari jasa konsultasi sebesar Rp 3.500.000.\n\nTotal pemasukan bulan ini menunjukkan peningkatan 15% dibanding bulan sebelumnya.\n\n[IMG:1755066465076]\n\n#RINCIAN PENDAPATAN\n\n1. Pendapatan Penjualan\n2. Pendapatan Jasa\n3. Pendapatan Lainnya\n4. Total Pemasukan\n\n[IMG:1755024788108]'
            },
            {
                id_user: 1,
                tanggal_laporan: '2024-01-20',
                isi_laporan: '[IMG:1755025137909]\n\n#LAPORAN PENGELUARAN OPERASIONAL JANUARI 2024\n\nPengeluaran Operasional Bulanan\nBerikut adalah rincian pengeluaran operasional untuk bulan Januari 2024:\n\n1. Gaji Karyawan:\n• Gaji Pokok: Rp 12.000.000\n• Tunjangan: Rp 3.000.000\n• Bonus: Rp 2.000.000\n\n2. Biaya Kantor:\n• Sewa Kantor: Rp 5.000.000\n• Listrik & Air: Rp 1.500.000\n• Internet: Rp 800.000\n\n3. Biaya Marketing:\n• Iklan Digital: Rp 2.500.000\n• Event Marketing: Rp 1.200.000\n\nTotal pengeluaran operasional bulan ini sebesar Rp 28.000.000.\n\n[IMG:1755066465076]\n\n#RINCIAN PENGELUARAN\n\n1. Gaji Karyawan\n2. Biaya Kantor\n3. Biaya Marketing\n4. Total Pengeluaran\n\n[IMG:1755024788108]'
            },
            {
                id_user: 2,
                tanggal_laporan: '2024-01-25',
                isi_laporan: '[IMG:1755025137909]\n\n#LAPORAN LABA RUGI Q1 2024\n\nLaporan Laba Rugi Triwulan I 2024\n\nPENDAPATAN:\n• Pendapatan Penjualan: Rp 45.000.000\n• Pendapatan Jasa: Rp 10.500.000\n• Total Pendapatan: Rp 55.500.000\n\nBEBAN:\n• Harga Pokok Penjualan: Rp 25.000.000\n• Biaya Operasional: Rp 18.000.000\n• Biaya Marketing: Rp 5.000.000\n• Biaya Administrasi: Rp 3.500.000\n• Total Beban: Rp 51.500.000\n\nLABA BERSIH:\nLaba Bersih = Pendapatan - Beban\nLaba Bersih = Rp 55.500.000 - Rp 51.500.000\nLaba Bersih = Rp 4.000.000\n\nPerusahaan mengalami laba bersih sebesar Rp 4.000.000 pada triwulan I 2024.\n\n[IMG:1755066465076]\n\n#RINGKASAN LABA RUGI\n\n1. Total Pendapatan\n2. Total Beban\n3. Laba Bersih\n4. Margin Laba\n\n[IMG:1755024788108]'
            },
            {
                id_user: 1,
                tanggal_laporan: '2024-01-30',
                isi_laporan: '[IMG:1755025137909]\n\n#LAPORAN ARUS KAS JANUARI 2024\n\nLaporan Arus Kas Bulanan\n\nARUS KAS DARI AKTIVITAS OPERASI:\n• Penerimaan dari Pelanggan: Rp 18.500.000\n• Pembayaran kepada Pemasok: (Rp 12.000.000)\n• Pembayaran Gaji: (Rp 17.000.000)\n• Pembayaran Biaya Operasional: (Rp 8.500.000)\n• Kas Neto dari Operasi: (Rp 19.000.000)\n\nARUS KAS DARI AKTIVITAS INVESTASI:\n• Pembelian Peralatan: (Rp 5.000.000)\n• Kas Neto dari Investasi: (Rp 5.000.000)\n\nARUS KAS DARI AKTIVITAS PENDANAAN:\n• Pinjaman Bank: Rp 25.000.000\n• Kas Neto dari Pendanaan: Rp 25.000.000\n\nKENAIKAN KAS BERSIH:\nRp 1.000.000\n\nSALDO KAS AWAL:\nRp 5.000.000\n\nSALDO KAS AKHIR:\nRp 6.000.000\n\n[IMG:1755066465076]\n\n#RINGKASAN ARUS KAS\n\n1. Kas dari Operasi\n2. Kas dari Investasi\n3. Kas dari Pendanaan\n4. Saldo Kas Akhir\n\n[IMG:1755024788108]'
            },
            {
                id_user: 2,
                tanggal_laporan: '2024-02-05',
                isi_laporan: '[IMG:1755025137909]\n\n#LAPORAN PEMASUKAN FEBRUARI 2024\n\nLaporan Pemasukan Bulanan Februari 2024\nPemasukan bulan Februari menunjukkan pertumbuhan yang signifikan:\n\n1. Penjualan Produk:\n• Produk A: Rp 10.000.000 (naik 25%)\n• Produk B: Rp 6.500.000 (naik 30%)\n• Produk C: Rp 3.000.000 (naik 50%)\n\n2. Pendapatan Jasa:\n• Konsultasi: Rp 4.500.000\n• Training: Rp 2.000.000\n\n3. Pendapatan Lainnya:\n• Komisi: Rp 1.500.000\n• Royalti: Rp 800.000\n\nTotal pemasukan bulan Februari mencapai Rp 28.300.000, meningkat 53% dari bulan Januari.\n\n[IMG:1755066465076]\n\n#RINCIAN PERTUMBUHAN\n\n1. Penjualan Produk\n2. Pendapatan Jasa\n3. Pendapatan Lainnya\n4. Total Pemasukan\n\n[IMG:1755024788108]'
            }
        ];

        // Insert data sample
        for (const data of sampleData) {
            const insertSQL = `
                INSERT INTO laporan_keuangan (
                    id_user, tanggal_laporan, isi_laporan
                ) VALUES (?, ?, ?)
            `;

            const values = [
                data.id_user,
                data.tanggal_laporan,
                data.isi_laporan
            ];

            try {
                await connection.execute(insertSQL, values);
                console.log(`✅ Inserted: Laporan Keuangan ${data.tanggal_laporan}`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`ℹ️ Data already exists: Laporan Keuangan ${data.tanggal_laporan}`);
                } else {
                    console.log(`⚠️ Error inserting: Laporan Keuangan ${data.tanggal_laporan} - ${error.message}`);
                }
            }
        }

        console.log('🎉 All sample data inserted successfully!');
        console.log('📊 Database now contains sample laporan keuangan data');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Jalankan fungsi
seedLaporanKeuanganData()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }); 