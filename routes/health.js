const express = require('express');
const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'Server berjalan dengan baik!'
  });
});

// Get server status
router.get('/status', (req, res) => {
  const io = req.app.get('io');
  const connectedClients = io.engine.clientsCount;
  
  res.json({
    http: 'running',
    websocket: 'running',
    connectedClients: connectedClients,
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

module.exports = router; 