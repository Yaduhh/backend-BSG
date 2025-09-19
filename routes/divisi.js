const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const controller = require('../controllers/divisiController')

// GET /api/divisi
router.get('/', authenticateToken, controller.list)

module.exports = router
