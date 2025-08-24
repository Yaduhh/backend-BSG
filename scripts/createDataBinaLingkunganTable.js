const { sequelize } = require('../config/database');
const DataBinaLingkungan = require('../models/DataBinaLingkungan');

async function createDataBinaLingkunganTable() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await DataBinaLingkungan.sync({ force: false });
    console.log('Data Bina Lingkungan table created successfully.');

    console.log('Table creation completed.');
  } catch (error) {
    console.error('Error creating Data Bina Lingkungan table:', error);
  } finally {
    await sequelize.close();
  }
}

createDataBinaLingkunganTable();
