const { sequelize } = require('../config/database');

const createDataAsetTable = async () => {
  try {
    console.log('🔨 Creating data_aset table...');

    // Create table manually
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS data_aset (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_aset VARCHAR(255) NULL COMMENT 'Nama aset untuk kategori PROPERTI',
        merk_kendaraan VARCHAR(255) NULL COMMENT 'Merk kendaraan untuk kategori KENDARAAN',
        nama_barang VARCHAR(255) NULL COMMENT 'Nama barang untuk kategori ELEKTRONIK',
        kategori ENUM('PROPERTI', 'KENDARAAN_PRIBADI', 'KENDARAAN_OPERASIONAL', 'KENDARAAN_DISTRIBUSI', 'ELEKTRONIK') NOT NULL,
        no_sertifikat VARCHAR(100) NULL COMMENT 'Nomor sertifikat untuk properti',
        lokasi TEXT NULL,
        atas_nama VARCHAR(255) NULL,
        data_pembelian VARCHAR(50) NULL COMMENT 'Tahun pembelian atau data pembelian',
        status VARCHAR(255) NULL COMMENT 'Status aset (DIJAMINKAN, DIMILIKI SENDIRI, AKTIF, dll)',
        data_pbb VARCHAR(255) NULL COMMENT 'Data PBB untuk properti',
        plat_nomor VARCHAR(50) NULL COMMENT 'Plat nomor untuk kendaraan',
        nomor_mesin VARCHAR(100) NULL COMMENT 'Nomor mesin untuk kendaraan',
        nomor_rangka VARCHAR(100) NULL COMMENT 'Nomor rangka untuk kendaraan',
        pajak_berlaku VARCHAR(100) NULL COMMENT 'Pajak berlaku untuk kendaraan',
        stnk_berlaku VARCHAR(100) NULL COMMENT 'STNK berlaku untuk kendaraan',
        estimasi_pembayaran_pajak VARCHAR(100) NULL COMMENT 'Estimasi pembayaran pajak untuk kendaraan',
        terakhir_service VARCHAR(100) NULL COMMENT 'Terakhir service untuk kendaraan',
        jadwal_service_berikutnya VARCHAR(100) NULL COMMENT 'Jadwal service berikutnya untuk kendaraan',
        asuransi_pakai VARCHAR(10) NULL COMMENT 'YA/TIDAK untuk asuransi kendaraan',
        jenis_asuransi VARCHAR(50) NULL COMMENT 'TLO/ALL RISK untuk kendaraan',
        asuransi_berlaku VARCHAR(100) NULL COMMENT 'Asuransi berlaku untuk kendaraan',
        penanggung_jawab VARCHAR(255) NULL,
        merk VARCHAR(100) NULL COMMENT 'Merk untuk elektronik',
        model VARCHAR(100) NULL COMMENT 'Model untuk elektronik',
        serial_number VARCHAR(100) NULL COMMENT 'Serial number untuk elektronik',
        tahun_pembelian VARCHAR(10) NULL COMMENT 'Tahun pembelian untuk elektronik',
        lampiran TEXT NULL COMMENT 'FOTO, FILE, VIDEO',
        status_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ data_aset table created successfully!');

    // Check if table exists
    const [results] = await sequelize.query("SHOW TABLES LIKE 'data_aset'");
    if (results.length > 0) {
      console.log('✅ Table data_aset exists in database');
      
      // Show table structure
      const [columns] = await sequelize.query("DESCRIBE data_aset");
      console.log('\n📋 Table structure:');
      columns.forEach(col => {
        console.log(`   ${col.Field} - ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('❌ Table data_aset was not created');
    }

  } catch (error) {
    console.error('❌ Error creating data_aset table:', error);
    throw error;
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createDataAsetTable()
    .then(() => {
      console.log('🎉 Table creation process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Table creation process failed:', error);
      process.exit(1);
    });
}

module.exports = createDataAsetTable;
