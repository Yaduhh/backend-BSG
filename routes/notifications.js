const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// POST /api/notifications/send-to-all
router.post('/send-to-all', authenticateToken, notificationController.sendToAllUsers);

// POST /api/notifications/send-to-users
router.post('/send-to-users', authenticateToken, notificationController.sendToUsers);

// POST /api/notifications/send-to-role
router.post('/send-to-role', authenticateToken, notificationController.sendToRole);

// GET /api/notifications/history
router.get('/history', authenticateToken, notificationController.getNotificationHistory);

// GET /api/notifications/user/:userId
router.get('/user/:userId', authenticateToken, notificationController.getUserNotifications);

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

// PUT /api/notifications/user/:userId/read-all
router.put('/user/:userId/read-all', authenticateToken, notificationController.markAllAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

// GET /api/notifications/stats
router.get('/stats', authenticateToken, notificationController.getNotificationStats);

module.exports = router;
