/*
  Script: createVideoManageTable.js
  Tujuan: Membuat tabel `video_manage` secara terpisah (tanpa Sequelize CLI)
  Cara jalan: npm run db:create-video-manage
*/

const { sequelize } = require('../config/database')
const VideoManage = require('../models/VideoManage')

async function main() {
  try {
    console.log('🔧 Memeriksa koneksi database...')
    await sequelize.authenticate()
    console.log('✅ Koneksi database OK')

    console.log('🧱 Membuat tabel `video_manage` jika belum ada...')
    // Hanya sync untuk model VideoManage agar aman
    await VideoManage.sync({ alter: false })
    console.log('✅ Tabel `video_manage` siap')
  } catch (err) {
    console.error('❌ Gagal membuat tabel video_manage:', err?.message || err)
    process.exit(1)
  } finally {
    await sequelize.close()
    console.log('🔌 Koneksi database ditutup')
  }
}

main()
