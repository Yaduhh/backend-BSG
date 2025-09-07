const { sequelize } = require('../config/database');

const updateJadwalPembayaranSchema = async () => {
  try {
    console.log('🔄 Updating jadwal_pembayaran table schema...');

    // Add new columns to existing table
    const alterQueries = [
      "ALTER TABLE jadwal_pembayaran ADD COLUMN outlet VARCHAR(255) NULL",
      "ALTER TABLE jadwal_pembayaran ADD COLUMN sewa DECIMAL(15,2) NULL",
      "ALTER TABLE jadwal_pembayaran ADD COLUMN pemilik_sewa VARCHAR(255) NULL",
      "ALTER TABLE jadwal_pembayaran ADD COLUMN no_kontak_pemilik_sewa VARCHAR(50) NULL",
      "ALTER TABLE jadwal_pembayaran ADD COLUMN no_rekening VARCHAR(50) NULL",
      "ALTER TABLE jadwal_pembayaran ADD COLUMN bulan ENUM('JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER') NULL",
      "ALTER TABLE jadwal_pembayaran ADD COLUMN tahun INT NULL DEFAULT 2025"
    ];

    for (const query of alterQueries) {
      try {
        await sequelize.query(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
          console.log(`⏭️  Column already exists: ${query}`);
        } else {
          console.error(`❌ Error executing: ${query}`, error.message);
        }
      }
    }

    console.log('🎉 Database schema update completed!');
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
  } finally {
    await sequelize.close();
  }
};

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  updateJadwalPembayaranSchema();
}

module.exports = { updateJadwalPembayaranSchema };
