/*
  Script: scripts/createTugasSayaTable.js
  Tujuan: Sinkronisasi tabel `tugas_saya` saja tanpa mengganggu tabel lain.
  Cara menjalankan: node scripts/createTugasSayaTable.js
*/

const { sequelize } = require('../config/database')
const models = require('../models')

async function main() {
  try {
    console.log('🔌 Testing DB connection...')
    await sequelize.authenticate()
    console.log('✅ Database connected.')

    if (!models.TugasSaya) {
      throw new Error('Model TugasSaya tidak ditemukan. Pastikan sudah ditambahkan di models/index.js')
    }

    console.log('🛠️  Syncing table tugas_saya ...')
    await models.TugasSaya.sync({ alter: true })
    console.log('✅ Table tugas_saya synchronized.')
  } catch (err) {
    console.error('❌ Error:', err)
    process.exitCode = 1
  } finally {
    await sequelize.close()
    console.log('🔒 DB connection closed.')
  }
}

main()
