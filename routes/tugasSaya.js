const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const controller = require('../controllers/tugasSayaController')

// GET /api/leader/tugas-saya
router.get('/', authenticateToken, controller.list)

// POST /api/leader/tugas-saya
router.post('/', authenticateToken, controller.create)

// GET /api/leader/tugas-saya/:id
router.get('/:id', authenticateToken, controller.getById)

// PUT /api/leader/tugas-saya/:id
router.put('/:id', authenticateToken, controller.update)

// DELETE /api/leader/tugas-saya/:id
router.delete('/:id', authenticateToken, controller.delete)

module.exports = router
