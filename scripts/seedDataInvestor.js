const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca file .env secara manual
const envPath = path.join(__dirname, '../.env');
const configPath = path.join(__dirname, '../config.env');
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
} else if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  const cleanContent = configContent
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  cleanContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value !== undefined) {
        const cleanKey = key.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        const cleanValue = value.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        envConfig[cleanKey] = cleanValue;
      }
    }
  });
}

require('dotenv').config();

const dbConfig = {
  host: envConfig.DB_HOST || process.env.DB_HOST,
  port: envConfig.DB_PORT || process.env.DB_PORT,
  user: envConfig.DB_USER || process.env.DB_USER,
  password: envConfig.DB_PASSWORD || process.env.DB_PASSWORD,
  database: envConfig.DB_NAME || process.env.DB_NAME
};

async function seedDataInvestor() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('Seeding data investor...');
    
    const sampleData = [
      {
        outlet: 'OUTLET BENCONGAN',
        nama_investor: 'N.A. RAMADHAN',
        ttl_investor: 'Jakarta, 15 Maret 1985',
        no_hp: '08123456789',
        alamat: 'JL KAV. PERKEBUNAN NO. 1 BENCONGAN',
        tanggal_join: '2020-01-15',
        kontak_darurat: '08123456788',
        nama_pasangan: 'Siti Aisyah',
        nama_anak: 'Ahmad Fadillah, Fatimah Azzahra',
        investasi_di_outlet: 50000000,
        persentase_bagi_hasil: '15%',
        tipe_data: 'outlet'
      },
      {
        outlet: 'OUTLET BENCONGAN',
        nama_investor: 'BUDI SANTOSO',
        ttl_investor: 'Surabaya, 22 Juli 1978',
        no_hp: '08123456790',
        alamat: 'JL KAV. PERKEBUNAN NO. 2 BENCONGAN',
        tanggal_join: '2020-03-20',
        kontak_darurat: '08123456791',
        nama_pasangan: 'Dewi Sartika',
        nama_anak: 'Putri Indah, Rizki Pratama',
        investasi_di_outlet: 75000000,
        persentase_bagi_hasil: '20%',
        tipe_data: 'outlet'
      },
      {
        outlet: 'OUTLET BENCONGAN',
        nama_investor: 'SARAH WIJAYA',
        ttl_investor: 'Bandung, 10 Desember 1990',
        no_hp: '08123456792',
        alamat: 'JL KAV. PERKEBUNAN NO. 3 BENCONGAN',
        tanggal_join: '2021-06-10',
        kontak_darurat: '08123456793',
        nama_pasangan: 'Michael Chen',
        nama_anak: 'Angelina Chen',
        investasi_di_outlet: 30000000,
        persentase_bagi_hasil: '12%',
        tipe_data: 'outlet'
      },
      {
        outlet: 'OUTLET JAKARTA',
        nama_investor: 'HENDRA KUSUMA',
        ttl_investor: 'Jakarta, 05 April 1982',
        no_hp: '08123456794',
        alamat: 'JL MANGGA DUA NO. 45 JAKARTA',
        tanggal_join: '2019-11-05',
        kontak_darurat: '08123456795',
        nama_pasangan: 'Rina Marlina',
        nama_anak: 'Dinda Safitri, Reza Pratama',
        investasi_di_outlet: 100000000,
        persentase_bagi_hasil: '25%',
        tipe_data: 'outlet'
      },
      {
        outlet: 'OUTLET JAKARTA',
        nama_investor: 'DIAN PUSPITA',
        ttl_investor: 'Semarang, 18 September 1988',
        no_hp: '08123456796',
        alamat: 'JL MANGGA DUA NO. 46 JAKARTA',
        tanggal_join: '2021-02-18',
        kontak_darurat: '08123456797',
        nama_pasangan: 'Budi Prasetyo',
        nama_anak: 'Maya Safitri',
        investasi_di_outlet: 45000000,
        persentase_bagi_hasil: '18%',
        tipe_data: 'outlet'
      },
      {
        outlet: 'OUTLET SURABAYA',
        nama_investor: 'AGUS SETIAWAN',
        ttl_investor: 'Surabaya, 30 Januari 1975',
        no_hp: '08123456798',
        alamat: 'JL TUNJUNGAN NO. 123 SURABAYA',
        tanggal_join: '2018-08-30',
        kontak_darurat: '08123456799',
        nama_pasangan: 'Sri Wahyuni',
        nama_anak: 'Bima Arya, Dinda Putri',
        investasi_di_outlet: 80000000,
        persentase_bagi_hasil: '22%',
        tipe_data: 'outlet'
      },
      {
        outlet: 'OUTLET SURABAYA',
        nama_investor: 'LISA ANGGRAENI',
        ttl_investor: 'Malang, 12 Mei 1992',
        no_hp: '08123456800',
        alamat: 'JL TUNJUNGAN NO. 124 SURABAYA',
        tanggal_join: '2022-01-12',
        kontak_darurat: '08123456801',
        nama_pasangan: 'Andi Wijaya',
        nama_anak: 'Kezia Putri',
        investasi_di_outlet: 35000000,
        persentase_bagi_hasil: '16%',
        tipe_data: 'outlet'
      },
      {
        outlet: 'OUTLET BANDUNG',
        nama_investor: 'RUDI HARTONO',
        ttl_investor: 'Bandung, 25 Oktober 1980',
        no_hp: '08123456802',
        alamat: 'JL CIHAMPELAS NO. 67 BANDUNG',
        tanggal_join: '2020-07-25',
        kontak_darurat: '08123456803',
        nama_pasangan: 'Nina Marlina',
        nama_anak: 'Rafi Pratama, Salsa Safitri',
        investasi_di_outlet: 60000000,
        persentase_bagi_hasil: '19%',
        tipe_data: 'outlet'
      },
      {
        outlet: 'OUTLET BANDUNG',
        nama_investor: 'MELATI SARI',
        ttl_investor: 'Cimahi, 08 Maret 1987',
        no_hp: '08123456804',
        alamat: 'JL CIHAMPELAS NO. 68 BANDUNG',
        tanggal_join: '2021-09-08',
        kontak_darurat: '08123456805',
        nama_pasangan: 'Doni Kusuma',
        nama_anak: 'Aisha Putri',
        investasi_di_outlet: 40000000,
        persentase_bagi_hasil: '17%',
        tipe_data: 'outlet'
      },
      {
        outlet: 'OUTLET MEDAN',
        nama_investor: 'TOMMY SIHOMBING',
        ttl_investor: 'Medan, 14 Juni 1983',
        no_hp: '08123456806',
        alamat: 'JL SUDIRMAN NO. 89 MEDAN',
        tanggal_join: '2019-12-14',
        kontak_darurat: '08123456807',
        nama_pasangan: 'Maya Sari',
        nama_anak: 'Kevin Pratama, Putri Indah',
        investasi_di_outlet: 90000000,
        persentase_bagi_hasil: '28%',
        tipe_data: 'outlet'
      }
    ];

    for (const data of sampleData) {
      await connection.execute(`
        INSERT INTO data_investor (
          outlet, nama_investor, ttl_investor, no_hp, alamat, 
          tanggal_join, kontak_darurat, nama_pasangan, nama_anak, 
          investasi_di_outlet, persentase_bagi_hasil, tipe_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.outlet,
        data.nama_investor,
        data.ttl_investor,
        data.no_hp,
        data.alamat,
        data.tanggal_join,
        data.kontak_darurat,
        data.nama_pasangan,
        data.nama_anak,
        data.investasi_di_outlet,
        data.persentase_bagi_hasil,
        data.tipe_data
      ]);
    }
    
    console.log('Data investor berhasil di-seed!');
    console.log(`Total ${sampleData.length} data investor telah ditambahkan.`);
    
  } catch (error) {
    console.error('Error seeding data investor:', error);
  } finally {
    await connection.end();
  }
}

seedDataInvestor();
