const express = require('express');
const router = express.Router();

// Import route modules
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const picMenuRoutes = require('./picMenu');
const picLeaderRoutes = require('./picLeaderRoutes');
const leaderAccessRoutes = require('./leaderAccessRoutes');
const adminProfileRoutes = require('./adminProfile');
const adminKomplainRoutes = require('./adminKomplain');
const pengumumanRoutes = require('./pengumuman');
const jobdeskRoutes = require('./jobdeskRoutes');
const sopRoutes = require('./sopRoutes');
const strukturOrganisasiRoutes = require('./strukturOrganisasi');
const ownerSdmRoutes = require('./ownerSdm');
const adminSdmRoutes = require('./adminSdm');
const adminSdmDivisiRoutes = require('./adminSdmDivisi');
// Training modules
const adminTrainingRoutes = require('./adminTraining');
const ownerTrainingRoutes = require('./ownerTraining');
const leaderTrainingRoutes = require('./leaderTraining');
// KPI modules
const kpiRoutes = require('./kpiRoutes');
// Data Investor modules
const adminDataInvestorRoutes = require('./adminDataInvestor');
const ownerDataInvestorRoutes = require('./ownerDataInvestor');
// Data Aset modules
const adminDataAsetRoutes = require('./adminDataAset');
const ownerDataAsetRoutes = require('./ownerDataAset');

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/pic-menu', picMenuRoutes);
router.use('/pic-leader', picLeaderRoutes);
router.use('/leader-access', leaderAccessRoutes);
router.use('/admin', adminProfileRoutes);
router.use('/admin/komplain', adminKomplainRoutes);
router.use('/pengumuman', pengumumanRoutes);
router.use('/jobdesk', jobdeskRoutes);
router.use('/sop', sopRoutes);
router.use('/struktur-organisasi', strukturOrganisasiRoutes);
router.use('/owner/sdm', ownerSdmRoutes);
router.use('/admin/sdm', adminSdmRoutes);
router.use('/sdm-divisi', adminSdmDivisiRoutes);
// Training mounts
router.use('/admin/training', adminTrainingRoutes);
router.use('/owner/training', ownerTrainingRoutes);
router.use('/leader/training', leaderTrainingRoutes);
// KPI mounts
router.use('/kpis', kpiRoutes);
// Data Investor mounts
router.use('/admin/data-investor', adminDataInvestorRoutes);
router.use('/owner/data-investor', ownerDataInvestorRoutes);
// Data Aset mounts
router.use('/admin/data-aset', adminDataAsetRoutes);
router.use('/owner/data-aset', ownerDataAsetRoutes);

module.exports = router;