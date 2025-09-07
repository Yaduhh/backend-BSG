const { sequelize } = require('../config/database');
const PicMenu = require('../models/PicMenu');
const User = require('../models/User');

const seedJadwalPembayaranMenu = async () => {
  try {
    // Sync database
    await sequelize.sync();

    // Cari user admin untuk testing
    const adminUser = await User.findOne({
      where: {
        role: 'admin'
      }
    });

    if (!adminUser) {
      console.log('❌ Tidak ada user admin ditemukan. Buat user admin terlebih dahulu.');
      return;
    }

    console.log(`✅ User admin ditemukan: ${adminUser.nama} (ID: ${adminUser.id})`);

    // Data PIC menu untuk jadwal pembayaran
    const picMenuData = [
      {
        id_user: adminUser.id,
        nama: 'JADWAL PEMBAYARAN/PERAWATAN',
        link: 'jadwal_pembayaran'
      }
    ];

    // Cek apakah menu sudah ada
    const existingMenu = await PicMenu.findOne({
      where: {
        id_user: adminUser.id,
        nama: 'JADWAL PEMBAYARAN/PERAWATAN',
        status_deleted: false
      }
    });

    if (existingMenu) {
      console.log('✅ Menu JADWAL PEMBAYARAN/PERAWATAN sudah ada untuk admin');
      return;
    }

    // Insert data baru
    const createdMenus = await PicMenu.bulkCreate(picMenuData);

    console.log(`✅ Berhasil membuat ${createdMenus.length} menu PIC untuk admin:`);
    createdMenus.forEach(menu => {
      console.log(`   - ${menu.nama} (ID: ${menu.id})`);
    });

    console.log('🎉 Seed jadwal pembayaran menu berhasil!');
  } catch (error) {
    console.error('❌ Error seeding jadwal pembayaran menu:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  seedJadwalPembayaranMenu();
}

module.exports = { seedJadwalPembayaranMenu };
