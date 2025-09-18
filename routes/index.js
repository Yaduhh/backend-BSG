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
const adminSdmDivisiRoutes = require('./adminSdmDivisi');
// Training modules
const adminTrainingRoutes = require('./adminTraining');
const ownerTrainingRoutes = require('./ownerTraining');

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
router.use('/sdm-divisi', adminSdmDivisiRoutes);
// Training mounts
router.use('/admin/training', adminTrainingRoutes);
router.use('/owner/training', ownerTrainingRoutes);

module.exports = router;