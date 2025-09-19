// Script untuk membuat/sinkronisasi tabel Pengajuan beserta relasinya
// Jalankan: node scripts/createPengajuanTables.js

const { sequelize } = require('../config/database');
const { Pengajuan, User } = require('../models');

(async () => {
  try {
    console.log('🔧 Memulai sinkronisasi tabel Pengajuan (single table)...');

    // Pastikan tabel users sudah ada (tanpa FK constraint)
    await User.sync();
    await Pengajuan.sync();

    // Alternatif: sesuaikan skema global
    // await sequelize.sync({ alter: true })

    console.log('✅ Sinkronisasi tabel Pengajuan selesai.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal sinkronisasi tabel Pengajuan:', err);
    process.exit(1);
  }
})();
