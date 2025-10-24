const express = require('express');
const router = express.Router();
const { User, DaftarTugas, DaftarKomplain, ChatRoom, Message, KeuanganPoskas } = require('../models');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { uploadSingleProfile, handleProfileUploadError } = require('../middleware/uploadProfile');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');



// GET /admin/profile - Mendapatkan profil admin
router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Mendapatkan statistik
    const stats = await getAdminStats(req.user.id);

    res.json({
      success: true,
      message: 'Profil admin berhasil diambil',
      data: {
        ...user.toJSON(),
        stats
      }
    });
  } catch (error) {
    console.error('Error getting admin profile:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil admin',
      error: error.message
    });
  }
});

// PUT /admin/profile - Mengupdate profil admin
router.put('/profile', authenticateAdmin, async (req, res) => {
  try {
    const { nama, email, username } = req.body;

    // Validasi input
    if (!nama || !email || !username) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan username harus diisi'
      });
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    // Validasi username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username hanya boleh berisi huruf, angka, dan underscore'
      });
    }

    // Cek apakah email sudah digunakan oleh user lain
    const existingEmail = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: req.user.id }
      }
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan oleh user lain'
      });
    }

    // Cek apakah username sudah digunakan oleh user lain
    const existingUsername = await User.findOne({
      where: {
        username,
        id: { [Op.ne]: req.user.id }
      }
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan oleh user lain'
      });
    }

    // Update user
    const user = await User.findByPk(req.user.id);
    user.nama = nama;
    user.email = email;
    user.username = username;
    await user.save();

    // Ambil data user yang sudah diupdate (tanpa password)
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Profil admin berhasil diperbarui',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui profil admin',
      error: error.message
    });
  }
});

// PUT /admin/change-password - Mengubah password admin
router.put('/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validasi input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Semua field password harus diisi'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password baru dan konfirmasi password tidak cocok'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter'
      });
    }

    // Ambil user dengan password
    const user = await User.findByPk(req.user.id);
    
    // Verifikasi password lama
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini tidak valid'
      });
    }

    // Cek apakah password baru sama dengan password lama
    const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
    if (isNewPasswordSame) {
      return res.status(400).json({
        success: false,
        message: 'Password baru tidak boleh sama dengan password lama'
      });
    }

    // Update password (akan di-hash otomatis oleh model hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password',
      error: error.message
    });
  }
});

// PUT /admin/profile/photo - Upload foto profile admin
router.put('/profile/photo', authenticateAdmin, uploadSingleProfile, handleProfileUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }

    // Ambil user yang sedang login
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Hapus foto profile lama jika ada
    if (user.profile) {
      const oldProfilePath = path.join(__dirname, '../uploads/profile', path.basename(user.profile));
      if (fs.existsSync(oldProfilePath)) {
        try {
          fs.unlinkSync(oldProfilePath);
        } catch (error) {
          console.warn('Gagal menghapus foto profile lama:', error.message);
        }
      }
    }

    // Update path foto profile di database
    const profilePath = `/uploads/profile/${req.file.filename}`;
    user.profile = profilePath;
    await user.save();

    // Ambil data user yang sudah diupdate (tanpa password)
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Foto profile berhasil diupload',
      data: {
        user: updatedUser,
        profileUrl: profilePath
      }
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengupload foto profile',
      error: error.message
    });
  }
});

// DELETE /admin/profile/photo - Hapus foto profile admin
router.delete('/profile/photo', authenticateAdmin, async (req, res) => {
  try {
    // Ambil user yang sedang login
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (!user.profile) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada foto profile untuk dihapus'
      });
    }

    // Hapus file foto profile dari server
    const profilePath = path.join(__dirname, '../uploads/profile', path.basename(user.profile));
    if (fs.existsSync(profilePath)) {
      try {
        fs.unlinkSync(profilePath);
      } catch (error) {
        console.warn('Gagal menghapus file foto profile:', error.message);
      }
    }

    // Update database - hapus path foto profile
    user.profile = null;
    await user.save();

    // Ambil data user yang sudah diupdate (tanpa password)
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Foto profile berhasil dihapus',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus foto profile',
      error: error.message
    });
  }
});

// GET /admin/stats - Mendapatkan statistik admin
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await getAdminStats(req.user.id);

    res.json({
      success: true,
      message: 'Statistik admin berhasil diambil',
      data: stats
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik admin',
      error: error.message
    });
  }
});

// GET /admin/activity-history - Mendapatkan riwayat aktivitas admin
router.get('/activity-history', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Untuk sementara, kita akan mengembalikan data dummy
    // Di implementasi nyata, Anda bisa membuat tabel ActivityLog
    const activities = [
      {
        id: 1,
        activity: 'Login ke sistem',
        timestamp: new Date().toISOString(),
        type: 'login'
      },
      {
        id: 2,
        activity: 'Mengupdate tugas #123',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'update'
      },
      {
        id: 3,
        activity: 'Membuat chat room baru',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: 'create'
      }
    ];

    const totalActivities = activities.length;
    const totalPages = Math.ceil(totalActivities / limit);
    const paginatedActivities = activities.slice(offset, offset + limit);

    res.json({
      success: true,
      message: 'Riwayat aktivitas berhasil diambil',
      data: {
        activities: paginatedActivities,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalActivities,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin activity history:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil riwayat aktivitas',
      error: error.message
    });
  }
});

// GET /admin/settings - Mendapatkan pengaturan admin
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    // Untuk sementara, kita akan mengembalikan pengaturan default
    const settings = {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        showOnlineStatus: true,
        showLastSeen: true
      },
      theme: {
        mode: 'light',
        primaryColor: '#DC2626'
      }
    };

    res.json({
      success: true,
      message: 'Pengaturan admin berhasil diambil',
      data: settings
    });
  } catch (error) {
    console.error('Error getting admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil pengaturan admin',
      error: error.message
    });
  }
});

// PUT /admin/settings - Mengupdate pengaturan admin
router.put('/settings', authenticateAdmin, async (req, res) => {
  try {
    const settings = req.body;

    // Validasi pengaturan
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Data pengaturan harus diisi'
      });
    }

    // Di implementasi nyata, Anda bisa menyimpan pengaturan ke database
    // Untuk sementara, kita hanya mengembalikan konfirmasi

    res.json({
      success: true,
      message: 'Pengaturan admin berhasil diperbarui',
      data: settings
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui pengaturan admin',
      error: error.message
    });
  }
});

// Helper function untuk mendapatkan statistik admin
async function getAdminStats(adminId) {
  try {
    // Total tugas
    const totalTugas = DaftarTugas ? await DaftarTugas.count() : 0;

    // Total chat rooms aktif
    const activeChats = ChatRoom ? await ChatRoom.count() : 0;

    // Total keuangan - menggunakan getSummary() karena KeuanganPoskas bukan Sequelize model
    let totalKeuangan = 0;
    try {
      if (KeuanganPoskas) {
        const summary = await KeuanganPoskas.getSummary();
        totalKeuangan = summary ? summary.total_entries : 0;
      }
    } catch (error) {
      console.warn('Error getting keuangan stats:', error.message);
      totalKeuangan = 0;
    }

    // Total users (non-admin)
    const totalUsers = User ? await User.count({
      where: {
        role: { [Op.ne]: 'admin' }
      }
    }) : 0;

    // Total komplain
    const totalKomplain = DaftarKomplain ? await DaftarKomplain.count() : 0;

    // Tugas yang belum selesai
    const pendingTugas = DaftarTugas ? await DaftarTugas.count({
      where: {
        status: 'belum'
      }
    }) : 0;

    // Tugas yang sedang berjalan
    const ongoingTugas = DaftarTugas ? await DaftarTugas.count({
      where: {
        status: 'proses'
      }
    }) : 0;

    // Tugas yang selesai
    const completedTugas = DaftarTugas ? await DaftarTugas.count({
      where: {
        status: 'selesai'
      }
    }) : 0;

    return {
      totalTugas: totalTugas || 0,
      activeChats: activeChats || 0,
      totalKeuangan: totalKeuangan || 0,
      totalUsers: totalUsers || 0,
      totalKomplain: totalKomplain || 0,
      pendingTugas: pendingTugas || 0,
      ongoingTugas: ongoingTugas || 0,
      completedTugas: completedTugas || 0
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {
      totalTugas: 0,
      activeChats: 0,
      totalKeuangan: 0,
      totalUsers: 0,
      totalKomplain: 0,
      pendingTugas: 0,
      ongoingTugas: 0,
      completedTugas: 0
    };
  }
}

module.exports = router; 