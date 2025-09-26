const express = require('express');
const http = require('http');
const path = require('path');
require('dotenv').config();

// Import middleware dan routes
const setupMiddleware = require('./middleware');
const routes = require('./routes');

// Import specific routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const picMenuRoutes = require('./routes/picMenu');
const chatRoutes = require('./routes/chat');
const chatGroupRoutes = require('./routes/chatGroup');
const adminChatRoutes = require('./routes/adminChat');
const leaderChatRoutes = require('./routes/leaderChat');
const leaderTugasRoutes = require('./routes/leaderTugas');
const deviceRoutes = require('./routes/devices');
const daftarTugasRoutes = require('./routes/daftarTugas');
const adminTugasRoutes = require('./routes/adminTugas');
const uploadRoutes = require('./routes/upload');
const keuanganPoskasRoutes = require('./routes/keuanganPoskas');
const laporanKeuanganRoutes = require('./routes/laporanKeuangan');
const omsetHarianRoutes = require('./routes/omsetHarian');
const anekaGrafikRoutes = require('./routes/anekaGrafik');
const adminProfileRoutes = require('./routes/adminProfile');
const adminKomplainRoutes = require('./routes/adminKomplain');
const daftarKomplainRoutes = require('./routes/daftarKomplain');
const pengumumanRoutes = require('./routes/pengumuman');
const adminPengumumanRoutes = require('./routes/adminPengumuman');
const ownerKeuanganPoskasRoutes = require('./routes/ownerKeuanganPoskas');
const timMerahBiruRoutes = require('./routes/timMerahBiru');
const ownerTimMerahBiruRoutes = require('./routes/ownerTimMerahBiru');
const ownerTrainingRoutes = require('./routes/ownerTraining');
const leaderTimMerahBiruRoutes = require('./routes/leaderTimMerahBiru');
const adminTrainingRoutes = require('./routes/adminTraining');
const leaderTrainingRoutes = require('./routes/leaderTraining');
const leaderSopRoutes = require('./routes/leaderSop');
const leaderAturanRoutes = require('./routes/leaderAturan');
const adminDataAsetRoutes = require('./routes/adminDataAset');
const ownerDataAsetRoutes = require('./routes/ownerDataAset');
const adminDataSupplierRoutes = require('./routes/adminDataSupplier');
const adminMedsosRoutes = require('./routes/adminMedsos');
const kpiRoutes = require('./routes/kpiRoutes');
const adminAnekaGrafikRoutes = require('./routes/adminAnekaGrafik');
const ownerMedsosRoutes = require('./routes/ownerMedsos');
const adminDataTargetRoutes = require('./routes/adminDataTarget');
const ownerDataTargetRoutes = require('./routes/ownerDataTarget');
const adminDataBinaLingkunganRoutes = require('./routes/adminDataBinaLingkungan');
const ownerDataBinaLingkunganRoutes = require('./routes/ownerDataBinaLingkungan');
const adminDataInvestorRoutes = require('./routes/adminDataInvestor');
const ownerDataInvestorRoutes = require('./routes/ownerDataInvestor');
const ownerAnekaGrafikRoutes = require('./routes/ownerAnekaGrafik');
const anekaSuratRoutes = require('./routes/anekaSurat');
const saranRoutes = require('./routes/saranRoutes');
const adminDataSewaRoutes = require('./routes/adminDataSewa');
const ownerDataSewaRoutes = require('./routes/ownerDataSewa');
const mediaSosialRoutes = require('./routes/mediaSosial');
const ownerMediaSosialRoutes = require('./routes/ownerMediaSosial');
const ownerGajiRoutes = require('./routes/ownerGaji');
const ownerStrukturSopRoutes = require('./routes/ownerStrukturSop');
const ownerAturanSopRoutes = require('./routes/ownerAturanSop');
const jadwalPembayaranRoutes = require('./routes/jadwalPembayaran');
const picKategoriRoutes = require('./routes/picKategori');
const adminSdmRoutes = require('./routes/adminSdm');
const ownerSdmRoutes = require('./routes/ownerSdm');
const adminSdmDivisiRoutes = require('./routes/adminSdmDivisi');
const jobdeskRoutes = require('./routes/jobdeskRoutes');
const sopRoutes = require('./routes/sopRoutes');
const strukturOrganisasiRoutes = require('./routes/strukturOrganisasi');
const targetHarianRoutes = require('./routes/targetHarian');
const aturanRoutes = require('./routes/aturan');
const leaderAccessRoutes = require('./routes/leaderAccessRoutes');
const pengajuanRoutes = require('./routes/pengajuan');
const ownerPengajuanRoutes = require('./routes/ownerPengajuan');
const ownerAccountsRoutes = require('./routes/ownerAccounts');
const ownerLaporanKeuanganRoutes = require('./routes/ownerLaporanKeuangan');
const tugasSayaRoutes = require('./routes/tugasSaya');
const leaderUsersRoutes = require('./routes/leaderUsers');
const divisiRoutes = require('./routes/divisi');
const leaderDivisiRoutes = require('./routes/leaderDivisi');

// Import database config and models
const { sequelize, testConnection } = require('./config/database');
const models = require('./models'); // Initialize models and associations

const app = express();
const server = http.createServer(app);

// WebSocket service setup
const webSocketService = require('./services/webSocketService');
const wsService = webSocketService(server);

// Make wsService available to all routes
app.set('wsService', wsService);

// Setup middleware
setupMiddleware(app);

// Owner read-only middleware: batasi aksi tulis untuk role owner kecuali allowlist
const ownerReadOnly = require('./middleware/ownerReadOnly');
app.use(ownerReadOnly);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pic-menu', picMenuRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-group', chatGroupRoutes);
app.use('/api/admin-chat', adminChatRoutes);
app.use('/api/leader-chat', leaderChatRoutes);
app.use('/api/leader-tugas', leaderTugasRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/daftar-tugas', daftarTugasRoutes);
app.use('/api/daftar-komplain', daftarKomplainRoutes);
app.use('/api/admin-tugas', adminTugasRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/keuangan-poskas', keuanganPoskasRoutes);
app.use('/api/laporan-keuangan', laporanKeuanganRoutes);
app.use('/api/omset-harian', omsetHarianRoutes);
app.use('/api/aneka-grafik', anekaGrafikRoutes);
app.use('/api/owner/keuangan-poskas', ownerKeuanganPoskasRoutes);
app.use('/api/owner/tim-merah-biru', ownerTimMerahBiruRoutes);
app.use('/api/leader/tim-merah-biru', leaderTimMerahBiruRoutes);
app.use('/api/owner/training', ownerTrainingRoutes);
app.use('/api/pengumuman', pengumumanRoutes);
app.use('/api/admin', adminProfileRoutes);
app.use('/api/admin/pengumuman', adminPengumumanRoutes);
app.use('/api/admin/komplain', adminKomplainRoutes);
app.use('/api/admin/training', adminTrainingRoutes);
app.use('/api/leader/training', leaderTrainingRoutes);
app.use('/api/leader/sop', leaderSopRoutes);
app.use('/api/leader/aturan', leaderAturanRoutes);
app.use('/api/admin/sdm', adminSdmRoutes);
app.use('/api/admin/sdm/divisi', adminSdmDivisiRoutes);
app.use('/api/leader/sdm', adminSdmRoutes);
app.use('/api/owner/sdm', ownerSdmRoutes);
app.use('/api/sdm/slip-gaji', require('./routes/slipGajiRoutes'));
app.use('/api/admin/slip-gaji', require('./routes/slipGajiRoutes'));
app.use('/api/leader/slip-gaji', require('./routes/slipGajiRoutes'));
app.use('/api/admin/data-aset', adminDataAsetRoutes);
app.use('/api/owner/data-aset', ownerDataAsetRoutes);
app.use('/api/admin/data-supplier', adminDataSupplierRoutes);
app.use('/api/admin/medsos', adminMedsosRoutes);
app.use('/api/owner/medsos', ownerMedsosRoutes);
app.use('/api/admin/data-target', adminDataTargetRoutes);
app.use('/api/owner/data-target', ownerDataTargetRoutes);
app.use('/api/admin/data-bina-lingkungan', adminDataBinaLingkunganRoutes);
app.use('/api/owner/data-bina-lingkungan', ownerDataBinaLingkunganRoutes);
app.use('/api/admin/data-investor', adminDataInvestorRoutes);
app.use('/api/owner/data-investor', ownerDataInvestorRoutes);
app.use('/api/owner/aneka-grafik', ownerAnekaGrafikRoutes);
app.use('/api/admin/aneka-grafik', adminAnekaGrafikRoutes);
app.use('/api/admin/aneka-surat', anekaSuratRoutes);
app.use('/api/admin/aneka-grafik', adminAnekaGrafikRoutes);
app.use('/api/saran', saranRoutes);
app.use('/api/admin/data-sewa', adminDataSewaRoutes);
app.use('/api/owner/data-sewa', ownerDataSewaRoutes);
app.use('/api/jadwal-pembayaran', jadwalPembayaranRoutes);
app.use('/api/pic-kategori', picKategoriRoutes);
app.use('/api/media-sosial', mediaSosialRoutes);
app.use('/api/owner/media-sosial', ownerMediaSosialRoutes);
app.use('/api/owner/sdm', ownerGajiRoutes);
app.use('/api/owner', ownerStrukturSopRoutes);
app.use('/api/owner', ownerAturanSopRoutes);
app.use('/api/tim-merah-biru', timMerahBiruRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/jobdesk', jobdeskRoutes);
app.use('/api/sop', sopRoutes);
app.use('/api/struktur-organisasi', strukturOrganisasiRoutes);
app.use('/api/health', require('./routes/health'));
app.use('/api/target', targetHarianRoutes);
// Alias baru agar konsisten dengan penamaan 'data target' di frontend tanpa bentrok dengan entity DataTarget
app.use('/api/data-target-harian', targetHarianRoutes);

// Aturan (umum + alias per role, saat ini gunakan handler yang sama)
app.use('/api/aturan', aturanRoutes);
app.use('/api/admin/aturan', aturanRoutes);
app.use('/api/owner/aturan', aturanRoutes);
app.use('/api/divisi/aturan', aturanRoutes);
app.use('/api/tim/aturan', aturanRoutes);

// Leader Access routes
app.use('/api/leader-access', leaderAccessRoutes);
app.use('/api/pengajuan', pengajuanRoutes);
app.use('/api/owner/pengajuan', ownerPengajuanRoutes);
app.use('/api/owner/accounts', ownerAccountsRoutes);
app.use('/api/owner/laporan-keuangan', ownerLaporanKeuanganRoutes);
app.use('/api/leader/tugas-saya', tugasSayaRoutes);
app.use('/api/leader/users', leaderUsersRoutes);
app.use('/api/divisi', divisiRoutes);
app.use('/api/leader/divisi', leaderDivisiRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// WebSocket service sudah di-setup di atas

module.exports = { app, server, sequelize, testConnection };