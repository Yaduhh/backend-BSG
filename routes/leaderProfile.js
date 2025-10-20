const express = require('express');
const router = express.Router();
const { User, DaftarTugas, ChatRoom, Message, KeuanganPoskas } = require('../models');
const { authenticateToken, authenticateLeader } = require('../middleware/auth');
const { Op } = require('sequelize');



// GET /leader/profile - Mendapatkan profil leader
router.get('/profile', authenticateLeader, async (req, res) => {
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
    const stats = await getLeaderStats(req.user.id);

    res.json({
      success: true,
      message: 'Profil leader berhasil diambil',
      data: {
        ...user.toJSON(),
        stats
      }
    });
  } catch (error) {
    console.error('Error getting leader profile:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil leader',
      error: error.message
    });
  }
});

// PUT /leader/profile - Mengupdate profil leader
router.put('/profile', authenticateLeader, async (req, res) => {
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
      message: 'Profil leader berhasil diperbarui',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating leader profile:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui profil leader',
      error: error.message
    });
  }
});

// PUT /leader/change-password - Mengubah password leader
router.put('/change-password', authenticateLeader, async (req, res) => {
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
    console.error('Error changing leader password:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password',
      error: error.message
    });
  }
});

// GET /leader/stats - Mendapatkan statistik leader
router.get('/stats', authenticateLeader, async (req, res) => {
  try {
    const stats = await getLeaderStats(req.user.id);

    res.json({
      success: true,
      message: 'Statistik leader berhasil diambil',
      data: stats
    });
  } catch (error) {
    console.error('Error getting leader stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik leader',
      error: error.message
    });
  }
});

// GET /leader/activity-history - Mendapatkan riwayat aktivitas leader
router.get('/activity-history', authenticateLeader, async (req, res) => {
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
    console.error('Error getting leader activity history:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil riwayat aktivitas',
      error: error.message
    });
  }
});

// GET /leader/settings - Mendapatkan pengaturan leader
router.get('/settings', authenticateLeader, async (req, res) => {
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
      message: 'Pengaturan leader berhasil diambil',
      data: settings
    });
  } catch (error) {
    console.error('Error getting leader settings:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil pengaturan leader',
      error: error.message
    });
  }
});

// PUT /leader/settings - Mengupdate pengaturan leader
router.put('/settings', authenticateLeader, async (req, res) => {
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
      message: 'Pengaturan leader berhasil diperbarui',
      data: settings
    });
  } catch (error) {
    console.error('Error updating leader settings:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui pengaturan leader',
      error: error.message
    });
  }
});

// Helper function untuk mendapatkan statistik leader
async function getLeaderStats(leaderId) {
  try {
    // Total tugas yang terkait dengan leader (bisa disesuaikan dengan logic bisnis)
    const totalTugas = DaftarTugas ? await DaftarTugas.count({
      where: {
        // Jika ada field leader_id atau created_by, bisa difilter
        // Untuk sementara kita ambil semua tugas
      }
    }) : 0;

    // Total chat rooms aktif yang melibatkan leader
    const activeChats = ChatRoom ? await ChatRoom.count() : 0;

    // Total keuangan
    const totalKeuangan = KeuanganPoskas ? await KeuanganPoskas.count() : 0;

    // Total users di bawah leader (jika ada struktur hierarki)
    const totalUsers = User ? await User.count({
      where: {
        role: { [Op.ne]: 'admin' }
      }
    }) : 0;

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
      pendingTugas: pendingTugas || 0,
      ongoingTugas: ongoingTugas || 0,
      completedTugas: completedTugas || 0
    };
  } catch (error) {
    console.error('Error getting leader stats:', error);
    return {
      totalTugas: 0,
      activeChats: 0,
      totalKeuangan: 0,
      totalUsers: 0,
      pendingTugas: 0,
      ongoingTugas: 0,
      completedTugas: 0
    };
  }
}

module.exports = router;
