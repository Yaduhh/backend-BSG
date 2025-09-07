const { sequelize } = require('../config/database');
const PicMenu = require('../models/PicMenu');
const User = require('../models/User');

const seedJadwalPembayaranMenuOwner = async () => {
  try {
    // Sync database
    await sequelize.sync();

    // Cari user owner
    const ownerUser = await User.findOne({
      where: {
        role: 'owner'
      }
    });

    if (!ownerUser) {
      console.log('❌ Tidak ada user owner ditemukan. Buat user owner terlebih dahulu.');
      return;
    }

    console.log(`✅ User owner ditemukan: ${ownerUser.nama} (ID: ${ownerUser.id})`);

    // Data PIC menu untuk jadwal pembayaran
    const picMenuData = [
      {
        id_user: ownerUser.id,
        nama: 'JADWAL PEMBAYARAN/PERAWATAN',
        link: 'JADWAL_PEMBAYARAN_PERAWATAN'
      }
    ];

    // Cek apakah menu sudah ada
    const existingMenu = await PicMenu.findOne({
      where: {
        id_user: ownerUser.id,
        nama: 'JADWAL PEMBAYARAN/PERAWATAN',
        status_deleted: false
      }
    });

    if (existingMenu) {
      console.log('✅ Menu JADWAL PEMBAYARAN/PERAWATAN sudah ada untuk owner');
      return;
    }

    // Insert data baru
    const createdMenus = await PicMenu.bulkCreate(picMenuData);

    console.log(`✅ Berhasil membuat ${createdMenus.length} menu PIC untuk owner:`);
    createdMenus.forEach(menu => {
      console.log(`   - ${menu.nama} (ID: ${menu.id})`);
    });

    console.log('🎉 Seed jadwal pembayaran menu untuk owner berhasil!');
  } catch (error) {
    console.error('❌ Error seeding jadwal pembayaran menu untuk owner:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  seedJadwalPembayaranMenuOwner();
}

module.exports = { seedJadwalPembayaranMenuOwner };
