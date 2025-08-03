const express = require('express');
const router = express.Router();
const { UserDevice, User } = require('../models');
const { Op } = require('sequelize');

// Register device
router.post('/register', async (req, res) => {
  try {
    const { user_id, device_id, expo_token, device_name, platform } = req.body;

    if (!user_id || !device_id || !expo_token || !platform) {
      return res.status(400).json({
        success: false,
        message: 'user_id, device_id, expo_token, dan platform diperlukan'
      });
    }

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Check if device already exists for this user
    let device = await UserDevice.findOne({
      where: { user_id, device_id }
    });

    if (device) {
      // Update existing device
      await device.update({
        expo_token,
        device_name,
        platform,
        is_active: true,
        last_login: new Date()
      });
    } else {
      // Create new device
      device = await UserDevice.create({
        user_id,
        device_id,
        expo_token,
        device_name,
        platform,
        is_active: true,
        last_login: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Device berhasil didaftarkan',
      data: device
    });

  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mendaftarkan device'
    });
  }
});

// Logout device (deactivate)
router.post('/logout', async (req, res) => {
  try {
    const { user_id, device_id } = req.body;

    if (!user_id || !device_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id dan device_id diperlukan'
      });
    }

    const device = await UserDevice.findOne({
      where: { user_id, device_id }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device tidak ditemukan'
      });
    }

    await device.update({
      is_active: false
    });

    res.json({
      success: true,
      message: 'Device berhasil logout'
    });

  } catch (error) {
    console.error('Error logging out device:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat logout device'
    });
  }
});

// Get user devices
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const devices = await UserDevice.findAll({
      where: { 
        user_id: userId,
        is_active: true 
      },
      order: [['last_login', 'DESC']]
    });

    res.json({
      success: true,
      data: devices
    });

  } catch (error) {
    console.error('Error fetching user devices:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data device'
    });
  }
});

// Get all active devices for notification
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const devices = await UserDevice.findAll({
      where: { 
        user_id: userId,
        is_active: true 
      },
      attributes: ['expo_token', 'device_name', 'platform']
    });

    res.json({
      success: true,
      data: devices
    });

  } catch (error) {
    console.error('Error fetching active devices:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil device aktif'
    });
  }
});

module.exports = router; 