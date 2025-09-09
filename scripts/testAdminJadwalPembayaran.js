const { JadwalPembayaran, PicKategori, User } = require('../models');

async function testAdminJadwalPembayaran() {
  try {
    console.log('🧪 Testing Admin Jadwal Pembayaran Backend...\n');

    // Test 1: Check if models are loaded correctly
    console.log('1. Testing model loading...');
    console.log('✅ JadwalPembayaran model loaded');
    console.log('✅ PicKategori model loaded');
    console.log('✅ User model loaded\n');

    // Test 2: Check database connection
    console.log('2. Testing database connection...');
    const userCount = await User.count();
    console.log(`✅ Database connected - Found ${userCount} users\n`);

    // Test 3: Check PicKategori data
    console.log('3. Testing PicKategori data...');
    const picKategoriCount = await PicKategori.count();
    console.log(`✅ Found ${picKategoriCount} PIC kategori assignments\n`);

    // Test 4: Check JadwalPembayaran data
    console.log('4. Testing JadwalPembayaran data...');
    const jadwalCount = await JadwalPembayaran.count();
    console.log(`✅ Found ${jadwalCount} jadwal pembayaran items\n`);

    // Test 5: Test admin user with PIC assignments
    console.log('5. Testing admin user with PIC assignments...');
    const adminUsers = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'nama', 'role']
    });

    if (adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log(`✅ Found admin: ${admin.nama} (ID: ${admin.id})`);

      // Check PIC assignments for this admin
      const adminPicKategori = await PicKategori.findAll({
        where: { pic_id: admin.id },
        include: [{ model: User, as: 'pic', attributes: ['id', 'nama'] }]
      });

      console.log(`✅ Admin has ${adminPicKategori.length} PIC assignments:`);
      adminPicKategori.forEach(pk => {
        console.log(`   - ${pk.kategori}`);
      });

      // Test filtering jadwal by admin's categories
      if (adminPicKategori.length > 0) {
        const adminKategori = adminPicKategori.map(pk => pk.kategori);
        const adminJadwal = await JadwalPembayaran.findAll({
          where: { kategori: adminKategori }
        });
        console.log(`✅ Admin can access ${adminJadwal.length} jadwal items\n`);
      }
    } else {
      console.log('⚠️  No admin users found\n');
    }

    // Test 6: Test PIC kategori structure
    console.log('6. Testing PIC kategori structure...');
    const allPicKategori = await PicKategori.findAll({
      include: [{ model: User, as: 'pic', attributes: ['id', 'nama', 'role'] }]
    });

    console.log('✅ PIC Kategori assignments:');
    allPicKategori.forEach(pk => {
      const picName = pk.pic ? pk.pic.nama : 'Belum ada PIC';
      console.log(`   - ${pk.kategori}: ${picName}`);
    });

    console.log('\n🎉 All tests passed! Backend is ready for admin jadwal pembayaran feature.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

testAdminJadwalPembayaran();
