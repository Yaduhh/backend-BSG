const { sequelize } = require('../config/database');
const PicMenu = require('../models/PicMenu');
const User = require('../models/User');

const seedPicMenuForOwner = async () => {
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

    // Data PIC menu yang sesuai dengan mapping navigation owner
    const picMenuData = [
      // KEUANGAN
      {
        id_user: adminUser.id,
        nama: 'OMSET HARIAN',
        link: '/omset-harian'
      },
      {
        id_user: adminUser.id,
        nama: 'POSKAS',
        link: '/poskas'
      },
      {
        id_user: adminUser.id,
        nama: 'LAPORAN KEUANGAN',
        link: '/laporan-keuangan'
      },
      {
        id_user: adminUser.id,
        nama: 'ANEKA GRAFIK',
        link: '/aneka-grafik'
      },
      {
        id_user: adminUser.id,
        nama: 'ANEKA SURAT',
        link: '/aneka-surat'
      },
      
      // SDM
      {
        id_user: adminUser.id,
        nama: 'KPI',
        link: '/kpi'
      },
      {
        id_user: adminUser.id,
        nama: 'TIM MERAH BIRU',
        link: '/tim-merah-biru'
      },
      {
        id_user: adminUser.id,
        nama: 'TRAINING',
        link: '/training'
      },
      
      // OPERASIONAL
      {
        id_user: adminUser.id,
        nama: 'DATA ASET',
        link: '/data-aset'
      },
      {
        id_user: adminUser.id,
        nama: 'DATA SUPPLIER',
        link: '/data-supplier'
      },
      {
        id_user: adminUser.id,
        nama: 'DATA INVESTOR',
        link: '/data-investor'
      },
      {
        id_user: adminUser.id,
        nama: 'DATA BINA LINGKUNGAN',
        link: '/data-bina-lingkungan'
      },
      
      // MARKETING
      {
        id_user: adminUser.id,
        nama: 'DATA TARGET',
        link: '/data-target'
      },
      {
        id_user: adminUser.id,
        nama: 'MEDSOS',
        link: '/medsos'
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

    console.log(`✅ Berhasil membuat ${createdMenus.length} menu PIC untuk owner dashboard:`);
    createdMenus.forEach(menu => {
      console.log(`   - ${menu.nama} (ID: ${menu.id})`);
    });

    console.log('🎉 Seed PIC menu untuk owner dashboard berhasil!');
    console.log('\n📱 Sekarang owner bisa melihat menu dengan info PIC di dashboard');
    console.log('🔗 Admin bisa mengelola menu ini melalui screen PIC');
  } catch (error) {
    console.error('❌ Error seeding PIC menu untuk owner:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  seedPicMenuForOwner();
}

module.exports = seedPicMenuForOwner;
