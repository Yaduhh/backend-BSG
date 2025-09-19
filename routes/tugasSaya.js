const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const controller = require('../controllers/tugasSayaController')

// GET /api/leader/tugas-saya
router.get('/', authenticateToken, controller.list)

// POST /api/leader/tugas-saya
router.post('/', authenticateToken, controller.create)

module.exports = router
