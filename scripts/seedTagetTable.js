const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedTagetTable() {
  let connection;
  try {
    console.log('🚀 Seeding table: taget ...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '202.10.45.115',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sistem_bosgil_group',
      multipleStatements: true,
    });

    console.log('✅ Database connected');

    // Ensure table exists
    const [exists] = await connection.execute("SHOW TABLES LIKE 'taget'");
    if (exists.length === 0) {
      throw new Error("Table 'taget' tidak ditemukan. Jalankan scripts/createTargetHarianTable.js terlebih dahulu.");
    }

    // Optional: bersihkan data lama (comment-in kalau ingin truncate)
    // await connection.execute('TRUNCATE TABLE taget');
    // console.log('🗑️ Table cleared');

    // Sample images (using generic placeholders)
    const sampleImages = (ids) => JSON.stringify(ids.map((id) => ({
      id,
      name: `target_${id}.jpg`,
      url: `/uploads/target/target-${id}.jpg`,
      serverPath: `/uploads/target/target-${id}.jpg`,
    })));

    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);

    const samples = [
      {
        id_user: 1,
        tanggal_target: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 9)),
        isi_target: 'TARGET HARIAN\nHari : Senin\n#PENJUALAN\nProduk A\nProduk B\n\nTotal Target Hari Ini   Rp 5.000.000',
        images: sampleImages([1001, 1002]),
      },
      {
        id_user: 1,
        tanggal_target: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8)),
        isi_target: 'TARGET HARIAN\nHari : Selasa\n#PENJUALAN\nProduk C\n\nTotal Target Hari Ini   Rp 3.250.000',
        images: sampleImages([1003]),
      },
      {
        id_user: 2,
        tanggal_target: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)),
        isi_target: 'TARGET HARIAN\nHari : Rabu\n#JASA\nKonsultasi\n\nTotal Target Hari Ini   Rp 2.000.000',
        images: null,
      },
      {
        id_user: 2,
        tanggal_target: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)),
        isi_target: 'TARGET HARIAN\nHari : Kamis\n#PENJUALAN\nProduk D, Produk E\n\nTotal Target Hari Ini   Rp 6.400.000',
        images: sampleImages([1004, 1005, 1006]),
      },
      {
        id_user: 3,
        tanggal_target: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5)),
        isi_target: 'TARGET HARIAN\nHari : Jumat\n#LAINNYA\nPromosi\n\nTotal Target Hari Ini   Rp 1.200.000',
        images: null,
      },
      {
        id_user: 3,
        tanggal_target: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4)),
        isi_target: 'TARGET HARIAN\nHari : Sabtu\n#PENJUALAN\nProduk F\n\nTotal Target Hari Ini   Rp 4.500.000',
        images: sampleImages([1007]),
      },
      {
        id_user: 1,
        tanggal_target: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3)),
        isi_target: 'TARGET HARIAN\nHari : Minggu\n#PENJUALAN\nOutlet Karang\n\nTotal Target Hari Ini   Rp 2.750.000',
        images: null,
      },
      {
        id_user: 4,
        tanggal_target: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
        isi_target: 'TARGET HARIAN\nHari : Senin\n#JASA\nMaintenance\n\nTotal Target Hari Ini   Rp 3.900.000',
        images: sampleImages([1008, 1009]),
      },
      {
        id_user: 4,
        tanggal_target: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)),
        isi_target: 'TARGET HARIAN\nHari : Selasa\n#PENJUALAN\nProduk X, Y, Z\n\nTotal Target Hari Ini   Rp 7.100.000',
        images: null,
      },
      {
        id_user: 5,
        tanggal_target: fmt(today),
        isi_target: 'TARGET HARIAN\nHari : Hari Ini\n#SUMMARY\nTarget kombinasi penjualan dan jasa\n\nTotal Target Hari Ini   Rp 8.000.000',
        images: sampleImages([1010]),
      },
    ];

    const insertSql = `
      INSERT INTO taget (id_user, tanggal_target, isi_target, images, status_deleted, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, NOW(), NOW())
    `;

    let inserted = 0;
    for (const row of samples) {
      await connection.execute(insertSql, [
        row.id_user,
        row.tanggal_target,
        row.isi_target,
        row.images,
      ]);
      inserted += 1;
    }

    console.log(`✅ Seed selesai. Rows inserted: ${inserted}`);

    // Preview a few rows
    const [preview] = await connection.execute(
      "SELECT id, tanggal_target, LEFT(isi_target, 40) AS preview FROM taget WHERE status_deleted = 0 ORDER BY tanggal_target DESC LIMIT 5"
    );
    console.log('📝 Preview:');
    preview.forEach((r) => console.log(` - #${r.id} ${r.tanggal_target} :: ${r.preview}...`));
  } catch (err) {
    console.error('❌ Error seeding taget:', err.message);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

seedTagetTable();
