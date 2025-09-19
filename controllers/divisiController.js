const { Op } = require('sequelize')
const { SdmDivisi } = require('../models')

// GET /api/divisi
// Query: q (search by nama_divisi), onlyActive (default true)
exports.list = async (req, res) => {
  try {
    const { q, onlyActive = 'true' } = req.query || {}
    const where = { status_deleted: false }
    if (String(onlyActive) === 'true') where.status_aktif = true
    if (q && String(q).trim()) {
      where.nama_divisi = { [Op.like]: `%${String(q).trim()}%` }
    }
    const rows = await SdmDivisi.findAll({
      where,
      attributes: ['id','nama_divisi'],
      order: [['nama_divisi','ASC']]
    })
    return res.json({ success: true, data: rows })
  } catch (error) {
    console.error('Error listing divisi:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
