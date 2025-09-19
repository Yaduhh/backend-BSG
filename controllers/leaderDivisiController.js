const { LeaderDivisi, SdmDivisi } = require('../models')

// GET /api/leader/divisi
// Mengambil daftar divisi yang dipimpin oleh user login
exports.list = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const rows = await LeaderDivisi.findAll({
      where: { id_user: userId },
      include: [
        { model: SdmDivisi, as: 'divisi', attributes: ['id','nama_divisi'] }
      ],
      order: [['id','ASC']]
    })

    const data = rows.map(r => {
      const o = r.toJSON()
      return {
        id: o.id, // id relasi leader_divisi
        id_divisi: o.id_divisi,
        nama_divisi: o.divisi?.nama_divisi || '-'
      }
    })

    return res.json({ success: true, data })
  } catch (error) {
    console.error('Error listing leader divisi:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
