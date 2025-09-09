const { sequelize } = require('../config/database');
const PicKategori = require('../models/PicKategori');

const updatePicStructure = async () => {
  try {
    console.log('🔄 Updating PIC structure from per-item to per-category...');

    // 1. Create pic_kategori table
    console.log('📋 Creating pic_kategori table...');
    await PicKategori.sync({ force: true });
    console.log('✅ pic_kategori table created successfully!');

    // 2. Remove pic_id column from jadwal_pembayaran table
    console.log('🗑️  Removing pic_id column from jadwal_pembayaran table...');
    try {
      await sequelize.query('ALTER TABLE jadwal_pembayaran DROP COLUMN pic_id');
      console.log('✅ pic_id column removed from jadwal_pembayaran table!');
    } catch (error) {
      if (error.original && error.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⏭️  pic_id column does not exist or already removed');
      } else {
        console.error('❌ Error removing pic_id column:', error);
      }
    }

    // 3. Initialize default PIC assignments (optional - bisa dikosongkan dulu)
    console.log('📝 Initializing default PIC assignments...');
    const defaultPicAssignments = [
      { kategori: 'pajak_kendaraan_pribadi', pic_id: null },
      { kategori: 'pajak_kendaraan_operasional', pic_id: null },
      { kategori: 'pajak_kendaraan_distribusi', pic_id: null },
      { kategori: 'asuransi_kendaraan_pribadi', pic_id: null },
      { kategori: 'asuransi_kendaraan_operasional', pic_id: null },
      { kategori: 'asuransi_kendaraan_distribusi', pic_id: null },
      { kategori: 'service_kendaraan_pribadi', pic_id: null },
      { kategori: 'service_kendaraan_operasional', pic_id: null },
      { kategori: 'service_kendaraan_distribusi', pic_id: null },
      { kategori: 'pbb_pribadi', pic_id: null },
      { kategori: 'pbb_outlet', pic_id: null },
      { kategori: 'angsuran_pribadi', pic_id: null },
      { kategori: 'angsuran_usaha', pic_id: null },
      { kategori: 'sewa_pribadi', pic_id: null },
      { kategori: 'sewa_outlet', pic_id: null }
    ];

    for (const assignment of defaultPicAssignments) {
      await PicKategori.create(assignment);
    }
    console.log('✅ Default PIC assignments initialized!');

    console.log('🎉 PIC structure update completed!');
    console.log('📋 Next steps:');
    console.log('   1. Assign PIC to each category via admin panel');
    console.log('   2. Update frontend to show PIC per category');
    console.log('   3. Update controller logic to use new structure');

  } catch (error) {
    console.error('❌ Error updating PIC structure:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  updatePicStructure();
}

module.exports = { updatePicStructure };
