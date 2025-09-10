const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Load .env like the other scripts do (robust to BOM/CRLF)
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
        envConfig[key.trim()] = value.trim();
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

async function seedDataSewa() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: parseInt(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });
    console.log('🔧 Connected to database:', DB_NAME);

    const rows = [
      {
        nama_aset: 'OUTLET SIDOARJO',
        jenis_aset: 'RUKO 2 LANTAI',
        jangka_waktu_sewa: '10 TAHUN',
        harga_sewa: '200 JT/TAHUN',
        nama_pemilik: 'VEGA ANGARA',
        no_hp_pemilik: '08990656696',
        alamat_pemilik: 'JL. GRAHA RAYA BINTARO',
        mulai_sewa: '2025-09-10',
        berakhir_sewa: '2035-09-09',
        penanggung_jawab_pajak: 'BOSGIL',
        foto_aset: null,
        kategori_sewa: 'SEWA TAHUNAN',
        keterangan: 'OUTLET',
        created_by: 1
      },
      {
        nama_aset: 'GUDANG DISTRIBUSI',
        jenis_aset: 'GUDANG',
        jangka_waktu_sewa: '24 BULAN',
        harga_sewa: '25 JT/BULAN',
        nama_pemilik: 'JOHN DOE',
        no_hp_pemilik: '081234567890',
        alamat_pemilik: 'JL. RAYA SERPONG',
        mulai_sewa: '2025-01-01',
        berakhir_sewa: '2026-12-31',
        penanggung_jawab_pajak: 'BOSGIL',
        foto_aset: null,
        kategori_sewa: 'SEWA BULANAN',
        keterangan: 'OPERASIONAL',
        created_by: 1
      },
      {
        nama_aset: 'MOBIL OPERASIONAL',
        jenis_aset: 'KENDARAAN',
        jangka_waktu_sewa: '36 BULAN',
        harga_sewa: '7 JT/BULAN',
        nama_pemilik: 'JANE DOE',
        no_hp_pemilik: '081234567891',
        alamat_pemilik: 'JL. SUDIRMAN',
        mulai_sewa: '2024-07-01',
        berakhir_sewa: '2027-06-30',
        penanggung_jawab_pajak: 'BOSGIL',
        foto_aset: null,
        kategori_sewa: 'SEWA JANGKA PANJANG',
        keterangan: 'KENDARAAN DINAS',
        created_by: 1
      }
    ];

    const insertSQL = `
      INSERT INTO data_sewa (
        nama_aset, jenis_aset, jangka_waktu_sewa, harga_sewa,
        nama_pemilik, no_hp_pemilik, alamat_pemilik, mulai_sewa, berakhir_sewa,
        penanggung_jawab_pajak, foto_aset, kategori_sewa, keterangan, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let inserted = 0;
    for (const r of rows) {
      const [result] = await connection.execute(insertSQL, [
        r.nama_aset,
        r.jenis_aset,
        r.jangka_waktu_sewa,
        r.harga_sewa,
        r.nama_pemilik,
        r.no_hp_pemilik,
        r.alamat_pemilik,
        r.mulai_sewa,
        r.berakhir_sewa,
        r.penanggung_jawab_pajak,
        r.foto_aset,
        r.kategori_sewa,
        r.keterangan,
        r.created_by
      ]);
      inserted += result.affectedRows;
    }

    console.log(`✅ Seed selesai. Baris ditambahkan: ${inserted}`);
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

seedDataSewa();
