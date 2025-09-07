const { sequelize } = require('../config/database');
const JadwalPembayaran = require('../models/JadwalPembayaran');

const updateExistingJadwalPembayaran = async () => {
  try {
    console.log('🔄 Updating existing jadwal pembayaran data...');

    // Update all existing records to have bulan = JANUARI and tahun = 2025
    const [updatedRows] = await sequelize.query(`
      UPDATE jadwal_pembayaran 
      SET bulan = 'JANUARI', tahun = 2025 
      WHERE bulan IS NULL OR tahun IS NULL
    `);

    console.log(`✅ Updated ${updatedRows} existing records`);

    // Update SEWA OUTLET with sample data
    const sewaOutletItem = await JadwalPembayaran.findOne({
      where: {
        nama_item: 'SEWA OUTLET',
        status_deleted: false
      }
    });

    if (sewaOutletItem) {
      await sewaOutletItem.update({
        outlet: 'Outlet 1',
        sewa: 5000000,
        pemilik_sewa: 'John Doe',
        no_kontak_pemilik_sewa: '081234567890',
        no_rekening: '1234567890'
      });
      console.log('✅ Updated SEWA OUTLET with sample data');
    }

    console.log('🎉 Existing data update completed!');
  } catch (error) {
    console.error('❌ Error updating existing data:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  updateExistingJadwalPembayaran();
}

module.exports = { updateExistingJadwalPembayaran };
