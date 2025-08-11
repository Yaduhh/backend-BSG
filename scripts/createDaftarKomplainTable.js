const { sequelize } = require('../config/database');
const DaftarKomplain = require('../models/DaftarKomplain');

async function createDaftarKomplainTable() {
  try {
    // Sync the model with database
    await DaftarKomplain.sync({ force: true });
    console.log('✅ Tabel daftar_komplain berhasil dibuat');
    
    // Close database connection
    await sequelize.close();
    console.log('✅ Koneksi database ditutup');
  } catch (error) {
    console.error('❌ Error membuat tabel daftar_komplain:', error);
    await sequelize.close();
  }
}

createDaftarKomplainTable(); 