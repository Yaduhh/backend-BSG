const { DataAset, User } = require('../models');
const { sequelize } = require('../config/database');

const seedDataAset = async () => {
  try {
    console.log('🌱 Starting DataAset seeding...');

    // Get admin user for created_by
    const adminUser = await User.findOne({
      where: {
        role: 'admin',
        status_deleted: false
      }
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    // Check if data already exists
    const existingData = await DataAset.count();
    if (existingData > 0) {
      console.log('⚠️  DataAset data already exists. Skipping seeding.');
      return;
    }

    const dataAsetData = [
      // PROPERTI
      {
        nama_aset: "TANAH KAVLING",
        kategori: "PROPERTI",
        no_sertifikat: "0205",
        lokasi: "JL KAV. PERKEBUNAN NO. 1 BENCONGAN KELAPA DUA KAB. TANGERANG",
        atas_nama: "N.A. RAMADHAN",
        data_pembelian: "2010",
        status: "DIJAMINKAN DI PANIN BANK CAB. TANGERANG",
        data_pbb: "TERBAYAR, 2025",
        lampiran: "FOTO, FILE, VIDEO",
        created_by: adminUser.id
      },
      {
        nama_aset: "GEDUNG KANTOR",
        kategori: "PROPERTI",
        no_sertifikat: "0206",
        lokasi: "JL. RAYA SERPONG KM. 7, TANGERANG SELATAN",
        atas_nama: "PT. BOSGIL GROUP",
        data_pembelian: "2015",
        status: "DIMILIKI SENDIRI",
        data_pbb: "TERBAYAR, 2025",
        lampiran: "FOTO, FILE, VIDEO",
        created_by: adminUser.id
      },

      // KENDARAAN PRIBADI
      {
        merk_kendaraan: "TOYOTA AVANZA",
        kategori: "KENDARAAN_PRIBADI",
        atas_nama: "N.A. RAMADHAN",
        plat_nomor: "B 1234 ABC",
        nomor_mesin: "2NR-VE123456",
        nomor_rangka: "MHFGW8EM123456",
        pajak_berlaku: "31 DESEMBER 2024",
        stnk_berlaku: "31 DESEMBER 2024",
        estimasi_pembayaran_pajak: "Rp 2.500.000",
        terakhir_service: "15 JANUARI 2024",
        jadwal_service_berikutnya: "15 APRIL 2024",
        asuransi_pakai: "YA",
        jenis_asuransi: "ALL RISK",
        asuransi_berlaku: "31 DESEMBER 2024",
        penanggung_jawab: "N.A. RAMADHAN",
        lampiran: "FOTO, FILE, VIDEO",
        created_by: adminUser.id
      },
      {
        merk_kendaraan: "HONDA BRIO",
        kategori: "KENDARAAN_PRIBADI",
        atas_nama: "PT. BOSGIL GROUP",
        plat_nomor: "B 5678 DEF",
        nomor_mesin: "L12B123456",
        nomor_rangka: "MHFGW8EM789012",
        pajak_berlaku: "30 JUNI 2024",
        stnk_berlaku: "30 JUNI 2024",
        estimasi_pembayaran_pajak: "Rp 1.800.000",
        terakhir_service: "20 FEBRUARI 2024",
        jadwal_service_berikutnya: "20 MEI 2024",
        asuransi_pakai: "YA",
        jenis_asuransi: "TLO",
        asuransi_berlaku: "30 JUNI 2024",
        penanggung_jawab: "MANAJER OPERASIONAL",
        lampiran: "FOTO, FILE, VIDEO",
        created_by: adminUser.id
      },

      // KENDARAAN OPERASIONAL
      {
        merk_kendaraan: "MITSUBISHI L300",
        kategori: "KENDARAAN_OPERASIONAL",
        atas_nama: "PT. BOSGIL GROUP",
        plat_nomor: "B 9012 GHI",
        nomor_mesin: "4G15-123456",
        nomor_rangka: "MHFGW8EM345678",
        pajak_berlaku: "31 MARET 2024",
        stnk_berlaku: "31 MARET 2024",
        estimasi_pembayaran_pajak: "Rp 3.200.000",
        terakhir_service: "10 MARET 2024",
        jadwal_service_berikutnya: "10 JUNI 2024",
        asuransi_pakai: "YA",
        jenis_asuransi: "ALL RISK",
        asuransi_berlaku: "31 MARET 2024",
        penanggung_jawab: "SUPERVISOR LOGISTIK",
        lampiran: "FOTO, FILE, VIDEO",
        created_by: adminUser.id
      },

      // KENDARAAN DISTRIBUSI
      {
        merk_kendaraan: "SUZUKI CARRY",
        kategori: "KENDARAAN_DISTRIBUSI",
        atas_nama: "PT. BOSGIL GROUP",
        plat_nomor: "B 3456 JKL",
        nomor_mesin: "K6A-123456",
        nomor_rangka: "MHFGW8EM901234",
        pajak_berlaku: "30 APRIL 2024",
        stnk_berlaku: "30 APRIL 2024",
        estimasi_pembayaran_pajak: "Rp 2.800.000",
        terakhir_service: "25 MARET 2024",
        jadwal_service_berikutnya: "25 JUNI 2024",
        asuransi_pakai: "YA",
        jenis_asuransi: "ALL RISK",
        asuransi_berlaku: "30 APRIL 2024",
        penanggung_jawab: "MANAJER DISTRIBUSI",
        lampiran: "FOTO, FILE, VIDEO",
        created_by: adminUser.id
      },

      // ELEKTRONIK
      {
        nama_barang: "LAPTOP DELL LATITUDE",
        kategori: "ELEKTRONIK",
        merk: "DELL",
        model: "Latitude 5520",
        serial_number: "DL123456789",
        tahun_pembelian: "2022",
        status: "AKTIF",
        penanggung_jawab: "IT STAFF",
        lokasi: "KANTOR PUSAT",
        lampiran: "FOTO, FILE, VIDEO",
        created_by: adminUser.id
      },
      {
        nama_barang: "PRINTER HP LASERJET",
        kategori: "ELEKTRONIK",
        merk: "HP",
        model: "LaserJet Pro M404n",
        serial_number: "HP987654321",
        tahun_pembelian: "2021",
        status: "AKTIF",
        penanggung_jawab: "ADMIN",
        lokasi: "KANTOR PUSAT",
        lampiran: "FOTO, FILE, VIDEO",
        created_by: adminUser.id
      }
    ];

    // Insert data
    await DataAset.bulkCreate(dataAsetData);

    console.log('✅ DataAset seeding completed successfully!');
    console.log(`📊 Created ${dataAsetData.length} data aset records`);

    // Show statistics
    const totalAset = await DataAset.count({ where: { status_deleted: false } });
    const totalProperti = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: 'PROPERTI'
      } 
    });
    const totalKendaraan = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: {
          [require('sequelize').Op.in]: ['KENDARAAN_PRIBADI', 'KENDARAAN_OPERASIONAL', 'KENDARAAN_DISTRIBUSI']
        }
      } 
    });
    const totalElektronik = await DataAset.count({ 
      where: { 
        status_deleted: false,
        kategori: 'ELEKTRONIK'
      } 
    });

    console.log('\n📈 DataAset Statistics:');
    console.log(`   Total Aset: ${totalAset}`);
    console.log(`   Properti: ${totalProperti}`);
    console.log(`   Kendaraan: ${totalKendaraan}`);
    console.log(`   Elektronik: ${totalElektronik}`);

  } catch (error) {
    console.error('❌ Error seeding DataAset:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDataAset()
    .then(() => {
      console.log('🎉 Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = seedDataAset;
