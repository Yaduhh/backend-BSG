const { PicKategori, User } = require('../models');

const testPicKategori = async () => {
  try {
    console.log('🧪 Testing PIC Kategori functionality...');

    // Test 1: Check if pic_kategori table exists and has data
    const picKategoriCount = await PicKategori.count();
    console.log(`✅ pic_kategori table has ${picKategoriCount} records`);

    // Test 2: Get all PIC kategori with PIC info
    const picKategoriWithPics = await PicKategori.findAll({
      include: [
        {
          model: User,
          as: 'pic',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    console.log('📋 PIC Kategori assignments:');
    picKategoriWithPics.forEach(pk => {
      const picName = pk.pic ? pk.pic.nama : 'Belum ada PIC';
      console.log(`   ${pk.kategori}: ${picName}`);
    });

    // Test 3: Check available users for PIC
    const availableUsers = await User.findAll({
      where: {
        role: ['admin', 'owner'],
        status_deleted: false
      },
      attributes: ['id', 'nama', 'email', 'role']
    });

    console.log(`\n👥 Available users for PIC (${availableUsers.length} users):`);
    availableUsers.forEach(user => {
      console.log(`   ${user.nama} (${user.role})`);
    });

    console.log('\n🎉 PIC Kategori test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing PIC Kategori:', error);
  } finally {
    await require('../config/database').sequelize.close();
  }
};

// Jalankan test jika dipanggil langsung
if (require.main === module) {
  testPicKategori();
}

module.exports = { testPicKategori };
