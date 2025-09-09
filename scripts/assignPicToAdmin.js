const { PicKategori, User } = require('../models');

async function assignPicToAdmin() {
  try {
    console.log('🔧 Assigning PIC to admin users...\n');

    // Get admin users
    const adminUsers = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'nama', 'role']
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
      return;
    }

    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(admin => {
      console.log(`- ${admin.nama} (ID: ${admin.id})`);
    });

    // Get all categories
    const allCategories = [
      'pajak_kendaraan_pribadi',
      'pajak_kendaraan_operasional', 
      'pajak_kendaraan_distribusi',
      'asuransi_kendaraan_pribadi',
      'asuransi_kendaraan_operasional',
      'asuransi_kendaraan_distribusi',
      'service_kendaraan_pribadi',
      'service_kendaraan_operasional',
      'service_kendaraan_distribusi',
      'pbb_pribadi',
      'pbb_outlet',
      'angsuran_pribadi',
      'angsuran_usaha',
      'sewa_pribadi',
      'sewa_outlet'
    ];

    // Assign categories to admin users (distribute evenly)
    const categoriesPerAdmin = Math.ceil(allCategories.length / adminUsers.length);
    
    for (let i = 0; i < adminUsers.length; i++) {
      const admin = adminUsers[i];
      const startIndex = i * categoriesPerAdmin;
      const endIndex = Math.min(startIndex + categoriesPerAdmin, allCategories.length);
      const assignedCategories = allCategories.slice(startIndex, endIndex);

      console.log(`\n📋 Assigning categories to ${admin.nama}:`);
      
      for (const kategori of assignedCategories) {
        // Check if PIC kategori already exists
        let picKategori = await PicKategori.findOne({
          where: { kategori: kategori }
        });

        if (picKategori) {
          // Update existing PIC
          await picKategori.update({ pic_id: admin.id });
          console.log(`   ✅ Updated ${kategori} -> ${admin.nama}`);
        } else {
          // Create new PIC kategori
          await PicKategori.create({
            kategori: kategori,
            pic_id: admin.id
          });
          console.log(`   ✅ Created ${kategori} -> ${admin.nama}`);
        }
      }
    }

    // Verify assignments
    console.log('\n🔍 Verifying assignments...');
    const allPicKategori = await PicKategori.findAll({
      include: [{ model: User, as: 'pic', attributes: ['id', 'nama', 'role'] }]
    });

    console.log('\n📊 Final PIC assignments:');
    allPicKategori.forEach(pk => {
      const picName = pk.pic ? pk.pic.nama : 'Belum ada PIC';
      console.log(`   - ${pk.kategori}: ${picName}`);
    });

    console.log('\n🎉 PIC assignments completed successfully!');
    
  } catch (error) {
    console.error('❌ Error assigning PIC:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

assignPicToAdmin();
