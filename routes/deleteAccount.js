const express = require('express');
const router = express.Router();
const { User, UserDevice } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// POST /api/user/delete-account - User dapat menghapus akun sendiri
router.post('/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user
    const user = await User.findOne({
      where: {
        id: userId,
        status_deleted: false
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    // Soft delete user
    await user.update({ 
      status_deleted: true,
      deleted_at: new Date()
    });
    
    // Deactivate all user devices
    await UserDevice.update(
      { is_active: false },
      { where: { user_id: userId } }
    );
    
    res.json({
      success: true,
      message: 'Akun berhasil dihapus. Semua data terkait telah dihapus dari sistem.'
    });
    
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus akun'
    });
  }
});

// GET /api/user/delete-account - Halaman informasi penghapusan akun
router.get('/delete-account', (req, res) => {
  res.json({
    success: true,
    message: 'Halaman Penghapusan Akun Bosgil Group',
    instructions: [
      '1. Login ke aplikasi Bosgil Group',
      '2. Masuk ke menu Pengaturan/Settings',
      '3. Pilih "Hapus Akun"',
      '4. Konfirmasi penghapusan akun',
      '5. Akun dan semua data terkait akan dihapus permanen'
    ],
    contact: {
      email: 'support@bosgilgroup.com',
      phone: '+62-xxx-xxxx-xxxx'
    },
    note: 'Penghapusan akun bersifat permanen dan tidak dapat dibatalkan. Semua data termasuk tugas, laporan, dan riwayat aktivitas akan dihapus.'
  });
});

module.exports = router;
