const express = require('express');
const router = express.Router();
const { sendNotificationToUser } = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

// POST /api/test/notification - Test kirim notifikasi ke user sendiri
router.post('/notification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, body } = req.body;
    
    console.log(`🧪 Testing notification for user ${userId}`);
    
    const result = await sendNotificationToUser(
      userId,
      title || 'Test Notification',
      body || 'Ini adalah test notifikasi dari backend',
      { test: true, timestamp: new Date() }
    );
    
    if (result) {
      res.json({
        success: true,
        message: 'Test notification sent successfully',
        userId: userId
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send test notification'
      });
    }
    
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/test/devices - Lihat device yang terdaftar untuk user
router.get('/devices', authenticateToken, async (req, res) => {
  try {
    const { UserDevice } = require('../models');
    const userId = req.user.id;
    
    const devices = await UserDevice.findAll({
      where: { 
        user_id: userId,
        is_active: true 
      },
      attributes: ['id', 'device_name', 'expo_token', 'platform', 'created_at', 'last_login']
    });
    
    res.json({
      success: true,
      data: devices,
      count: devices.length
    });
    
  } catch (error) {
    console.error('Error getting devices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
