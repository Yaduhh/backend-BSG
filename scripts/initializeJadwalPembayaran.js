const { sequelize } = require('../config/database');
const JadwalPembayaran = require('../models/JadwalPembayaran');

const initializeJadwalPembayaran = async () => {
  try {
    // Sync database
    await sequelize.sync();

    console.log('🔄 Menginisialisasi data default jadwal pembayaran...');

    const defaultItems = [
      { nama_item: 'PAJAK/STNK KENDARAAN PRIBADI', kategori: 'pajak_kendaraan_pribadi', bulan: 'JANUARI' },
      { nama_item: 'PAJAK/STNK KENDARAAN OPERASIONAL', kategori: 'pajak_kendaraan_operasional', bulan: 'JANUARI' },
      { nama_item: 'PAJAK/STNK KENDARAAN DISTRIBUSI', kategori: 'pajak_kendaraan_distribusi', bulan: 'JANUARI' },
      { nama_item: 'ASURANSI KENDARAAN PRIBADI', kategori: 'asuransi_kendaraan_pribadi', bulan: 'JANUARI' },
      { nama_item: 'ASURANSI KENDARAAN OPERASIONAL', kategori: 'asuransi_kendaraan_operasional', bulan: 'JANUARI' },
      { nama_item: 'ASURANSI KENDARAAN DISTRIBUSI', kategori: 'asuransi_kendaraan_distribusi', bulan: 'JANUARI' },
      { nama_item: 'SERVICE KENDARAAN PRIBADI', kategori: 'service_kendaraan_pribadi', bulan: 'JANUARI' },
      { nama_item: 'SERVICE KENDARAAN OPERASIONAL', kategori: 'service_kendaraan_operasional', bulan: 'JANUARI' },
      { nama_item: 'SERVICE KENDARAAN DISTRIBUSI', kategori: 'service_kendaraan_distribusi', bulan: 'JANUARI' },
      { nama_item: 'PBB PRIBADI', kategori: 'pbb_pribadi', bulan: 'JANUARI' },
      { nama_item: 'PBB OUTLET', kategori: 'pbb_outlet', bulan: 'JANUARI' },
      { nama_item: 'ANGSURAN PRIBADI', kategori: 'angsuran_pribadi', bulan: 'JANUARI' },
      { nama_item: 'ANGSURAN USAHA', kategori: 'angsuran_usaha', bulan: 'JANUARI' },
      { nama_item: 'SEWA PRIBADI', kategori: 'sewa_pribadi', bulan: 'JANUARI' },
      { 
        nama_item: 'SEWA OUTLET', 
        kategori: 'sewa_outlet', 
        bulan: 'JANUARI',
        outlet: 'Outlet 1',
        sewa: 5000000,
        pemilik_sewa: 'John Doe',
        no_kontak_pemilik_sewa: '081234567890',
        no_rekening: '1234567890'
      }
    ];

    const createdItems = [];
    
    for (const item of defaultItems) {
      // Cek apakah item sudah ada
      const existingItem = await JadwalPembayaran.findOne({
        where: { 
          nama_item: item.nama_item,
          status_deleted: false 
        }
      });

      if (!existingItem) {
        const newItem = await JadwalPembayaran.create({
          ...item
        });
        createdItems.push(newItem);
        console.log(`✅ Created: ${newItem.nama_item}`);
      } else {
        console.log(`⏭️  Already exists: ${item.nama_item}`);
      }
    }

    console.log(`🎉 Berhasil menginisialisasi ${createdItems.length} item default jadwal pembayaran!`);
    
    if (createdItems.length === 0) {
      console.log('ℹ️  Semua item sudah ada di database');
    }
  } catch (error) {
    console.error('❌ Error initializing jadwal pembayaran:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  initializeJadwalPembayaran();
}

module.exports = { initializeJadwalPembayaran };
