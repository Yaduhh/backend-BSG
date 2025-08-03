const { sequelize } = require('../config/database');
const PicMenu = require('../models/PicMenu');
const User = require('../models/User');

const seedPicMenu = async () => {
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

    // Data PIC menu untuk testing
    const picMenuData = [
      {
        id_user: adminUser.id,
        nama: 'Keuangan',
        link: '/keuangan'
      },
      {
        id_user: adminUser.id,
        nama: 'Marketing',
        link: '/marketing'
      },
      {
        id_user: adminUser.id,
        nama: 'Operasional',
        link: '/operasional'
      },
      {
        id_user: adminUser.id,
        nama: 'SDM',
        link: '/sdm'
      }
    ];

    // Hapus data lama jika ada
    await PicMenu.destroy({
      where: {
        id_user: adminUser.id
      }
    });

    // Insert data baru
    const createdMenus = await PicMenu.bulkCreate(picMenuData);

    console.log(`✅ Berhasil membuat ${createdMenus.length} menu PIC untuk admin:`);
    createdMenus.forEach(menu => {
      console.log(`   - ${menu.nama} (ID: ${menu.id})`);
    });

    console.log('🎉 Seed PIC menu berhasil!');
  } catch (error) {
    console.error('❌ Error seeding PIC menu:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  seedPicMenu();
}

module.exports = seedPicMenu; 