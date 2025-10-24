const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingleProfile, compressProfileImage, handleProfileUploadError } = require('../middleware/uploadProfile');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// PUT /profile/photo - Upload foto profile user (semua role)
router.put('/profile/photo', authenticateToken, uploadSingleProfile, compressProfileImage, handleProfileUploadError, async (req, res) => {
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

// DELETE /profile/photo - Hapus foto profile user (semua role)
router.delete('/profile/photo', authenticateToken, async (req, res) => {
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

// PUT /profile/photo/:userId - Admin upload foto profile untuk user lain
router.put('/profile/photo/:userId', authenticateToken, uploadSingleProfile, compressProfileImage, handleProfileUploadError, async (req, res) => {
  try {
    // Cek apakah user yang request adalah admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengubah foto profile user lain'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }

    const { userId } = req.params;
    
    // Ambil user target
    const targetUser = await User.findByPk(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Hapus foto profile lama jika ada
    if (targetUser.profile) {
      const oldProfilePath = path.join(__dirname, '../uploads/profile', path.basename(targetUser.profile));
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
    targetUser.profile = profilePath;
    await targetUser.save();

    // Ambil data user yang sudah diupdate (tanpa password)
    const updatedUser = await User.findByPk(userId, {
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

// DELETE /profile/photo/:userId - Admin hapus foto profile untuk user lain
router.delete('/profile/photo/:userId', authenticateToken, async (req, res) => {
  try {
    // Cek apakah user yang request adalah admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk menghapus foto profile user lain'
      });
    }

    const { userId } = req.params;
    
    // Ambil user target
    const targetUser = await User.findByPk(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (!targetUser.profile) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada foto profile untuk dihapus'
      });
    }

    // Hapus file foto profile dari server
    const profilePath = path.join(__dirname, '../uploads/profile', path.basename(targetUser.profile));
    if (fs.existsSync(profilePath)) {
      try {
        fs.unlinkSync(profilePath);
      } catch (error) {
        console.warn('Gagal menghapus file foto profile:', error.message);
      }
    }

    // Update database - hapus path foto profile
    targetUser.profile = null;
    await targetUser.save();

    // Ambil data user yang sudah diupdate (tanpa password)
    const updatedUser = await User.findByPk(userId, {
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

// GET /profile/photo/:userId - Get foto profile user by ID (untuk admin/leader)
router.get('/profile/photo/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Cek apakah user yang request adalah admin atau leader
    if (req.user.role !== 'admin' && req.user.role !== 'leader') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengakses foto profile user lain'
      });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'nama', 'username', 'email', 'profile', 'role']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Data profile user berhasil diambil',
      data: user
    });
  } catch (error) {
    console.error('Error getting user profile photo:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil foto profile user',
      error: error.message
    });
  }
});

module.exports = router;
