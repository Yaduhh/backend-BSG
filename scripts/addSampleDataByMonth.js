const { sequelize } = require('../config/database');
const JadwalPembayaran = require('../models/JadwalPembayaran');

const addSampleDataByMonth = async () => {
  try {
    console.log('🔄 Adding sample data for different months...');

    // Sample data untuk bulan yang berbeda
    const sampleData = [
      // SEWA OUTLET - JANUARI
      {
        nama_item: 'SEWA OUTLET',
        kategori: 'sewa_outlet',
        bulan: 'JANUARI',
        tahun: 2025,
        outlet: 'Outlet 1',
        sewa: 5000000,
        pemilik_sewa: 'John Doe',
        no_kontak_pemilik_sewa: '081234567890',
        no_rekening: '1234567890'
      },
      // SEWA OUTLET - FEBRUARI
      {
        nama_item: 'SEWA OUTLET',
        kategori: 'sewa_outlet',
        bulan: 'FEBRUARI',
        tahun: 2025,
        outlet: 'Outlet 2',
        sewa: 6000000,
        pemilik_sewa: 'Jane Smith',
        no_kontak_pemilik_sewa: '081234567891',
        no_rekening: '1234567891'
      },
      // PAJAK KENDARAAN PRIBADI - JANUARI
      {
        nama_item: 'PAJAK/STNK KENDARAAN PRIBADI',
        kategori: 'pajak_kendaraan_pribadi',
        bulan: 'JANUARI',
        tahun: 2025
      },
      // PAJAK KENDARAAN PRIBADI - FEBRUARI
      {
        nama_item: 'PAJAK/STNK KENDARAAN PRIBADI',
        kategori: 'pajak_kendaraan_pribadi',
        bulan: 'FEBRUARI',
        tahun: 2025
      },
      // PBB OUTLET - JANUARI
      {
        nama_item: 'PBB OUTLET',
        kategori: 'pbb_outlet',
        bulan: 'JANUARI',
        tahun: 2025
      },
      // PBB OUTLET - MARET
      {
        nama_item: 'PBB OUTLET',
        kategori: 'pbb_outlet',
        bulan: 'MARET',
        tahun: 2025
      }
    ];

    const createdItems = [];
    
    for (const item of sampleData) {
      // Cek apakah item sudah ada
      const existingItem = await JadwalPembayaran.findOne({
        where: { 
          nama_item: item.nama_item,
          kategori: item.kategori,
          bulan: item.bulan,
          tahun: item.tahun,
          status_deleted: false 
        }
      });

      if (!existingItem) {
        const newItem = await JadwalPembayaran.create(item);
        createdItems.push(newItem);
        console.log(`✅ Created: ${newItem.nama_item} - ${newItem.bulan}`);
      } else {
        console.log(`⏭️  Already exists: ${item.nama_item} - ${item.bulan}`);
      }
    }

    console.log(`🎉 Added ${createdItems.length} sample items for different months!`);
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  addSampleDataByMonth();
}

module.exports = { addSampleDataByMonth };
