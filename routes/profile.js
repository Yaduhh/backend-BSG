const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// GET /api/profile - Mendapatkan profil user
router.get('/', authenticateToken, async (req, res) => {
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

    res.json({
      success: true,
      message: 'Profil berhasil diambil',
      data: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil',
      error: error.message
    });
  }
});

// PUT /api/profile - Mengupdate profil user
router.put('/', authenticateToken, async (req, res) => {
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
      message: 'Profil berhasil diperbarui',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui profil',
      error: error.message
    });
  }
});

// PUT /api/change-password - Mengubah password user
router.put('/change-password', authenticateToken, async (req, res) => {
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
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password',
      error: error.message
    });
  }
});

module.exports = router;
