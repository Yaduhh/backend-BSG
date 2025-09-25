const { Op } = require('sequelize')
const { TugasSaya, User } = require('../models')

// GET /api/leader/tugas-saya
// Query: page, limit, q, id_user
exports.list = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { page = 1, limit = 10, q, id_user } = req.query
    const where = { status_deleted: false, created_by: userId }

    if (q && String(q).trim()) {
      where.tugas_saya = { [Op.like]: `%${String(q).trim()}%` }
    }
    if (id_user) {
      where.id_user = id_user
    }

    const offset = (parseInt(page) - 1) * parseInt(limit)

    // First get the count without includes to avoid alias conflicts
    const count = await TugasSaya.count({ where })
    
    // Then get the data with only creator include
    const rows = await TugasSaya.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'nama'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    })
    
    const result = { rows, count }

    // Get assigned user data separately
    const assignedUserIds = result.rows.filter(r => r.id_user).map(r => r.id_user)
    const assignedUsers = assignedUserIds.length > 0 
      ? await User.findAll({ 
          where: { id: assignedUserIds }, 
          attributes: ['id', 'username', 'nama'] 
        })
      : []
    
    const assignedUsersMap = {}
    assignedUsers.forEach(user => {
      assignedUsersMap[user.id] = user
    })

    const mappedRows = result.rows.map(r => {
      const o = r.toJSON()
      const creator = o.creator || {}
      const assignedUser = assignedUsersMap[o.id_user] || {}
      const creatorName = creator.name || creator.nama || creator.full_name || creator.username || '-'
      const assignedUserName = assignedUser.name || assignedUser.nama || assignedUser.full_name || assignedUser.username || '-'
      return {
        id: o.id,
        tugas_saya: o.tugas_saya,
        created_by: o.created_by,
        created_by_name: creatorName,
        id_user: o.id_user,
        assigned_user_name: assignedUserName,
        created_at: o.created_at,
        updated_at: o.updated_at,
      }
    })

    return res.json({
      success: true,
      data: mappedRows,
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
// Body: { tugas_saya: string, id_user?: number }
exports.create = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const { tugas_saya, id_user } = req.body || {}
    if (!tugas_saya || String(tugas_saya).trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Field tugas_saya wajib diisi' })
    }

    const payload = {
      tugas_saya: String(tugas_saya).trim(),
      created_by: userId,
      status_deleted: false,
    }
    if (id_user !== undefined && id_user !== null && String(id_user).trim() !== '') {
      payload.id_user = Number(id_user)
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
        { model: User, as: 'creator', attributes: ['id', 'username', 'nama'] }
      ]
    })

    if (!tugas) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' })
    }

    const obj = tugas.toJSON()
    const creator = obj.creator || {}
    const creatorName = creator.name || creator.nama || creator.full_name || creator.username || '-'
    
    // Get assigned user data separately if exists
    let assignedUserName = '-'
    if (obj.id_user) {
      const assignedUser = await User.findByPk(obj.id_user, { 
        attributes: ['id', 'username', 'nama'] 
      })
      if (assignedUser) {
        assignedUserName = assignedUser.name || assignedUser.nama || assignedUser.full_name || assignedUser.username || '-'
      }
    }

    return res.json({
      success: true,
      data: {
        id: obj.id,
        tugas_saya: obj.tugas_saya,
        created_by: obj.created_by,
        created_by_name: creatorName,
        id_user: obj.id_user,
        assigned_user_name: assignedUserName,
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
    const { tugas_saya, id_user } = req.body || {}

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
    if (id_user !== undefined) {
      updateData.id_user = id_user !== null && String(id_user).trim() !== '' ? Number(id_user) : null
    }

    await tugas.update(updateData)

    // Fetch updated data with relations
    const updatedTugas = await TugasSaya.findByPk(tugas.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'nama'] }
      ]
    })

    const obj = updatedTugas.toJSON()
    const creator = obj.creator || {}
    const creatorName = creator.name || creator.nama || creator.full_name || creator.username || '-'
    
    // Get assigned user data separately if exists
    let assignedUserName = '-'
    if (obj.id_user) {
      const assignedUser = await User.findByPk(obj.id_user, { 
        attributes: ['id', 'username', 'nama'] 
      })
      if (assignedUser) {
        assignedUserName = assignedUser.name || assignedUser.nama || assignedUser.full_name || assignedUser.username || '-'
      }
    }

    return res.json({
      success: true,
      message: 'Tugas berhasil diperbarui',
      data: {
        id: obj.id,
        tugas_saya: obj.tugas_saya,
        created_by: obj.created_by,
        created_by_name: creatorName,
        id_user: obj.id_user,
        assigned_user_name: assignedUserName,
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