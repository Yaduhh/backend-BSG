const mysql = require('mysql2/promise');
require('dotenv').config();

const insertSampleData = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bosgil_group'
    });

    console.log('✅ Connected to database successfully');

    // Insert sample platform data
    const platformData = [
      {
        platform: 'TIKTOK',
        bulan_tahun: '2024-08',
        follower_saat_ini: 1500,
        follower_bulan_lalu: 1200,
        konten_terupload: 45,
        story_terupload: 12,
        konten_terbaik_link: 'https://tiktok.com/@bosgilgroup/video/123456',
        created_by: 1
      },
      {
        platform: 'INSTAGRAM',
        bulan_tahun: '2024-08',
        follower_saat_ini: 3200,
        follower_bulan_lalu: 2800,
        konten_terupload: 38,
        story_terupload: 89,
        konten_terbaik_link: 'https://instagram.com/p/ABC123/',
        created_by: 1
      },
      {
        platform: 'YOUTUBE',
        bulan_tahun: '2024-08',
        follower_saat_ini: 850,
        follower_bulan_lalu: 720,
        konten_terupload: 15,
        story_terupload: 0,
        konten_terbaik_link: 'https://youtube.com/watch?v=xyz789',
        created_by: 1
      }
    ];

    for (const data of platformData) {
      await connection.execute(
        'INSERT INTO medsos (platform, bulan_tahun, follower_saat_ini, follower_bulan_lalu, konten_terupload, story_terupload, konten_terbaik_link, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [data.platform, data.bulan_tahun, data.follower_saat_ini, data.follower_bulan_lalu, data.konten_terupload, data.story_terupload, data.konten_terbaik_link, data.created_by]
      );
    }
    console.log('✅ Sample platform data inserted successfully');

    // Insert sample KOL data
    const kolData = [
      {
        nama_akun: '@bosgil_official',
        follower_ig: 2500,
        follower_tiktok: 1800,
        ratecard: 2500000,
        created_by: 1
      },
      {
        nama_akun: '@marketing_bosgil',
        follower_ig: 1200,
        follower_tiktok: 950,
        ratecard: 1500000,
        created_by: 1
      },
      {
        nama_akun: '@bosgil_creative',
        follower_ig: 800,
        follower_tiktok: 650,
        ratecard: 1000000,
        created_by: 1
      }
    ];

    for (const data of kolData) {
      await connection.execute(
        'INSERT INTO medsos_kol (nama_akun, follower_ig, follower_tiktok, ratecard, created_by) VALUES (?, ?, ?, ?, ?)',
        [data.nama_akun, data.follower_ig, data.follower_tiktok, data.ratecard, data.created_by]
      );
    }
    console.log('✅ Sample KOL data inserted successfully');

    // Insert sample anggaran data
    const anggaranData = [
      {
        platform: 'TIKTOK',
        bulan_tahun: '2024-08',
        anggaran: 5000000,
        keterangan: 'Anggaran untuk konten TikTok bulan Agustus',
        created_by: 1
      },
      {
        platform: 'INSTAGRAM',
        bulan_tahun: '2024-08',
        anggaran: 3500000,
        keterangan: 'Anggaran untuk konten Instagram bulan Agustus',
        created_by: 1
      },
      {
        platform: 'YOUTUBE',
        bulan_tahun: '2024-08',
        anggaran: 2000000,
        keterangan: 'Anggaran untuk konten YouTube bulan Agustus',
        created_by: 1
      }
    ];

    for (const data of anggaranData) {
      await connection.execute(
        'INSERT INTO medsos_anggaran (platform, bulan_tahun, anggaran, keterangan, created_by) VALUES (?, ?, ?, ?, ?)',
        [data.platform, data.bulan_tahun, data.anggaran, data.keterangan, data.created_by]
      );
    }
    console.log('✅ Sample anggaran data inserted successfully');

    // Insert sample platform costs data
    const platformCostsData = [
      {
        platform: 'TIKTOK',
        biaya: 2000000,
        created_by: 1
      },
      {
        platform: 'INSTAGRAM',
        biaya: 1500000,
        created_by: 1
      },
      {
        platform: 'YOUTUBE',
        biaya: 1000000,
        created_by: 1
      }
    ];

    for (const data of platformCostsData) {
      await connection.execute(
        'INSERT INTO medsos_platform_costs (platform, biaya, created_by) VALUES (?, ?, ?)',
        [data.platform, data.biaya, data.created_by]
      );
    }
    console.log('✅ Sample platform costs data inserted successfully');

    console.log('\n🎉 All sample data inserted successfully!');
    console.log('\n📊 Data summary:');
    console.log('- Platform data: 3 records');
    console.log('- KOL data: 3 records');
    console.log('- Anggaran data: 3 records');
    console.log('- Platform costs: 3 records');

  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

insertSampleData();
