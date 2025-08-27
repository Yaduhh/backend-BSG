const { sequelize } = require('../config/database');
const DataBinaLingkungan = require('../models/DataBinaLingkungan');

async function seedDataBinaLingkungan() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const sampleData = [
      {
        lokasi: 'BSG PUSAT',
        jabatan: 'KETUA RT',
        nama: 'MASRUKIN',
        no_hp: '0811111',
        alamat: 'PALEM WIDELIA',
        nominal: '300RIBU/BULAN'
      },
      {
        lokasi: 'BSG PUSAT',
        jabatan: 'BABINSA',
        nama: 'JOKO',
        no_hp: '0811111',
        alamat: 'PALEM WIDELIA',
        nominal: '300RIBU/BULAN'
      }
    ];

    for (const data of sampleData) {
      const existingData = await DataBinaLingkungan.findOne({
        where: {
          lokasi: data.lokasi,
          nama: data.nama,
          jabatan: data.jabatan,
          status_deleted: false
        }
      });

      if (!existingData) {
        await DataBinaLingkungan.create(data);
        console.log(`Added data: ${data.nama} - ${data.jabatan} at ${data.lokasi}`);
      } else {
        console.log(`Data already exists: ${data.nama} - ${data.jabatan} at ${data.lokasi}`);
      }
    }

    console.log('Data Bina Lingkungan seeding completed.');
  } catch (error) {
    console.error('Error seeding Data Bina Lingkungan:', error);
  } finally {
    await sequelize.close();
  }
}

seedDataBinaLingkungan();
