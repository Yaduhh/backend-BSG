const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const controller = require('../controllers/leaderDivisiController')

// GET /api/leader/divisi - daftar divisi milik leader login
router.get('/', authenticateToken, controller.list)

module.exports = router
