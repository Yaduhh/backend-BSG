const { Op } = require('sequelize')
const { TugasSaya, User, SdmDivisi } = require('../models')

// GET /api/leader/tugas-saya
// Query: page, limit, q, id_divisi
exports.list = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { page = 1, limit = 10, q, id_divisi } = req.query
    const where = { status_deleted: false, created_by: userId }

    if (q && String(q).trim()) {
      where.tugas_saya = { [Op.like]: `%${String(q).trim()}%` }
    }
    if (id_divisi) {
      where.id_divisi = id_divisi
    }

    const offset = (parseInt(page) - 1) * parseInt(limit)

    const result = await TugasSaya.findAndCountAll({
      where,
      include: [
        // Hanya ambil kolom yang benar-benar ada di tabel users
        { model: User, as: 'creator', attributes: ['id', 'username', 'nama'] },
        { model: SdmDivisi, as: 'divisi', attributes: ['id', 'nama_divisi'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    })

    const rows = result.rows.map(r => {
      const o = r.toJSON()
      const creator = o.creator || {}
      const creatorName = creator.name || creator.nama || creator.full_name || creator.username || '-'
      return {
        id: o.id,
        tugas_saya: o.tugas_saya,
        created_by: o.created_by,
        created_by_name: creatorName,
        id_divisi: o.id_divisi,
        divisi_nama: o.divisi?.nama_divisi || '-',
        created_at: o.created_at,
        updated_at: o.updated_at,
      }
    })

    return res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.count / parseInt(limit)),
        totalItems: result.count,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error listing TugasSaya:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// POST /api/leader/tugas-saya
// Body: { tugas_saya: string, id_divisi?: number }
exports.create = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const { tugas_saya, id_divisi } = req.body || {}
    if (!tugas_saya || String(tugas_saya).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Field tugas_saya wajib diisi' })
    }

    const payload = {
      tugas_saya: String(tugas_saya).trim(),
      created_by: userId,
      status_deleted: false,
    }
    if (id_divisi !== undefined && id_divisi !== null && String(id_divisi).trim() !== '') {
      payload.id_divisi = Number(id_divisi)
    }

    const created = await TugasSaya.create(payload)
    const obj = created.toJSON()

    return res.status(201).json({ success: true, message: 'Tugas berhasil dibuat', data: obj })
  } catch (error) {
    console.error('Error creating TugasSaya:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// GET /api/leader/tugas-saya/:id
exports.getById = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id } = req.params
    const tugas = await TugasSaya.findOne({
      where: {
        id: id,
        created_by: userId, // Pastikan hanya bisa akses tugas sendiri
        status_deleted: false
      },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'nama'] },
        { model: SdmDivisi, as: 'divisi', attributes: ['id', 'nama_divisi'] }
      ]
    })

    if (!tugas) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' })
    }

    const obj = tugas.toJSON()
    const creator = obj.creator || {}
    const creatorName = creator.name || creator.nama || creator.full_name || creator.username || '-'

    return res.json({
      success: true,
      data: {
        id: obj.id,
        tugas_saya: obj.tugas_saya,
        created_by: obj.created_by,
        created_by_name: creatorName,
        id_divisi: obj.id_divisi,
        divisi_nama: obj.divisi?.nama_divisi || '-',
        created_at: obj.created_at,
        updated_at: obj.updated_at,
      }
    })
  } catch (error) {
    console.error('Error getting TugasSaya by ID:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// PUT /api/leader/tugas-saya/:id
exports.update = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id } = req.params
    const { tugas_saya, id_divisi } = req.body || {}

    // Validasi input
    if (tugas_saya !== undefined && (!tugas_saya || String(tugas_saya).trim().length === 0)) {
      return res.status(400).json({ success: false, message: 'Field tugas_saya tidak boleh kosong' })
    }

    // Cari tugas yang dimiliki user
    const tugas = await TugasSaya.findOne({
      where: {
        id: id,
        created_by: userId,
        status_deleted: false
      }
    })

    if (!tugas) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' })
    }

    // Update data
    const updateData = {}
    if (tugas_saya !== undefined) {
      updateData.tugas_saya = String(tugas_saya).trim()
    }
    if (id_divisi !== undefined) {
      updateData.id_divisi = id_divisi !== null && String(id_divisi).trim() !== '' ? Number(id_divisi) : null
    }

    await tugas.update(updateData)

    // Fetch updated data with relations
    const updatedTugas = await TugasSaya.findByPk(tugas.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'nama'] },
        { model: SdmDivisi, as: 'divisi', attributes: ['id', 'nama_divisi'] }
      ]
    })

    const obj = updatedTugas.toJSON()
    const creator = obj.creator || {}
    const creatorName = creator.name || creator.nama || creator.full_name || creator.username || '-'

    return res.json({
      success: true,
      message: 'Tugas berhasil diperbarui',
      data: {
        id: obj.id,
        tugas_saya: obj.tugas_saya,
        created_by: obj.created_by,
        created_by_name: creatorName,
        id_divisi: obj.id_divisi,
        divisi_nama: obj.divisi?.nama_divisi || '-',
        created_at: obj.created_at,
        updated_at: obj.updated_at,
      }
    })
  } catch (error) {
    console.error('Error updating TugasSaya:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// DELETE /api/leader/tugas-saya/:id
exports.delete = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { id } = req.params

    // Cari tugas yang dimiliki user
    const tugas = await TugasSaya.findOne({
      where: {
        id: id,
        created_by: userId,
        status_deleted: false
      }
    })

    if (!tugas) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' })
    }

    // Soft delete
    await tugas.update({ status_deleted: true })

    return res.json({
      success: true,
      message: 'Tugas berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting TugasSaya:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}