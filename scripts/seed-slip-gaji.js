const { sequelize } = require('../config/database');
const { User } = require('../models');

(async () => {
  try {
    console.log('🔄 Seeding slip_gaji data...');

    // Check slip_gaji table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'slip_gaji'");
    if (!tables || tables.length === 0) {
      throw new Error("Table 'slip_gaji' tidak ditemukan. Jalankan scripts/create-slip-gaji-table.js terlebih dahulu.");
    }

    // Ambil beberapa user aktif sebagai sample
    const users = await User.findAll({ attributes: ['id', 'nama'], limit: 5 });
    if (users.length === 0) {
      throw new Error('Tidak ada user untuk di-seed');
    }

    // Insert sample rows
    const now = new Date();
    const creatorId = users[0].id
    const values = users.map((u, idx) => [
      `/uploads/slip-gaji/slip-gaji-sample-${idx + 1}.jpg`,
      `Slip gaji sample untuk ${u.nama} (${u.id})`,
      u.id,
      0,
      now,
      creatorId,
      now
    ]);

    const [result] = await sequelize.query(
      `INSERT INTO slip_gaji (lampiran_foto, keterangan, id_user, status_deleted, created_at, created_by, updated_at)
       VALUES ${values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
      { replacements: values.flat() }
    );

    console.log(`✅ Berhasil insert ${values.length} baris slip_gaji.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal seeding slip_gaji:', err.message);
    process.exit(1);
  }
})();
