const { Op } = require('sequelize');
const { Pengajuan, User } = require('../models');

// GET /api/pengajuan
// Query: page, limit, q, status, dateFrom, dateTo
exports.list = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { page = 1, limit = 10, q, status, dateFrom, dateTo } = req.query;
    const where = { status_deleted: false };

    // Dapatkan username user login untuk filter 'terkait'
    let currentUsername = null;
    if (userId) {
      try {
        const u = await User.findByPk(userId, { attributes: ['id','username'] });
        currentUsername = u?.username || null;
      } catch {}
    }

    // Owner: lihat semua. Selain owner: lihat yang dibuat sendiri atau yang mencantumkan username di 'terkait'
    if (role !== 'owner' && userId) {
      if (currentUsername) {
        where[Op.or] = [
          { created_by: userId },
          { terkait: { [Op.like]: `"${currentUsername}"` } },
        ]
      } else {
        where.created_by = userId
      }
    }

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      // Gabungkan kondisi pencarian dengan where yang ada
      const searchCond = { pengajuan: { [Op.like]: term } }
      if (where[Op.or]) {
        where[Op.and] = where[Op.and] || []
        where[Op.and].push({ [Op.or]: where[Op.or] })
        delete where[Op.or]
      }
      where[Op.and] = where[Op.and] || []
      where[Op.and].push(searchCond)
    }
    if (status && ['disetujui','tidak_disetujui','pending'].includes(status)) {
      where.status = status;
    }
    if (dateFrom) {
      where.tanggal = where.tanggal || {};
      where.tanggal[Op.gte] = dateFrom;
    }
    if (dateTo) {
      where.tanggal = where.tanggal || {};
      where.tanggal[Op.lte] = dateTo;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await Pengajuan.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    // Parse JSON fields sebelum kirim
    const rows = result.rows.map(r => {
      const obj = r.toJSON();
      try { obj.terkait = Array.isArray(obj.terkait) ? obj.terkait : JSON.parse(obj.terkait || '[]') } catch { obj.terkait = [] }
      try { obj.lampiran = Array.isArray(obj.lampiran) ? obj.lampiran : JSON.parse(obj.lampiran || '[]') } catch { obj.lampiran = [] }
      return obj;
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.count / parseInt(limit)),
        totalItems: result.count,
        itemsPerPage: parseInt(limit),
      }
    });
  } catch (error) {
    console.error('Error listing pengajuan:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/pengajuan
// Body: { tanggal, pengajuan, nilai, status, terkait: JSON string, lampiran: JSON string }
exports.create = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { tanggal, pengajuan, nilai = 0, status = 'pending', terkait = '[]', lampiran = '[]' } = req.body || {};

    if (!pengajuan) {
      return res.status(400).json({ success: false, message: 'Field pengajuan wajib diisi' });
    }

    const tanggalFinal = tanggal || new Date().toISOString().slice(0,10);
    const safeStatus = ['disetujui','tidak_disetujui','pending'].includes(status) ? status : 'pending';
    
    // Parse JSON strings jika sudah berupa string, atau stringify jika array
    let terkaitJson, lampiranJson;
    try {
      // Handle terkait - save IDs directly
      terkaitJson = typeof terkait === 'string' ? terkait : JSON.stringify(terkait || []);
    } catch {
      terkaitJson = '[]';
    }
    
    try {
      lampiranJson = typeof lampiran === 'string' ? lampiran : JSON.stringify(lampiran || []);
    } catch {
      lampiranJson = '[]';
    }

    const created = await Pengajuan.create({
      tanggal: tanggalFinal,
      pengajuan,
      nilai: Number(nilai) || 0,
      status: safeStatus,
      terkait: terkaitJson,
      lampiran: lampiranJson,
      created_by: userId,
    });

    const obj = created.toJSON();
    obj.terkait = JSON.parse(obj.terkait || '[]');
    obj.lampiran = JSON.parse(obj.lampiran || '[]');

    return res.status(201).json({ success: true, message: 'Pengajuan berhasil dibuat', data: obj });
  } catch (error) {
    console.error('Error creating pengajuan:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/pengajuan/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan || pengajuan.status_deleted) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Owner: lihat semua. Selain owner: hanya yang dibuat sendiri atau yang mencantumkan username di 'terkait'
    if (role !== 'owner') {
      let currentUsername = null;
      if (userId) {
        try {
          const u = await User.findByPk(userId, { attributes: ['id','username'] });
          currentUsername = u?.username || null;
        } catch {}
      }

      if (currentUsername) {
        const terkaitArray = JSON.parse(pengajuan.terkait || '[]');
        if (pengajuan.created_by !== userId && !terkaitArray.includes(currentUsername)) {
          return res.status(403).json({ success: false, message: 'Tidak diizinkan mengakses pengajuan ini' });
        }
      } else {
        if (pengajuan.created_by !== userId) {
          return res.status(403).json({ success: false, message: 'Tidak diizinkan mengakses pengajuan ini' });
        }
      }
    }

    const obj = pengajuan.toJSON();
    obj.terkait = JSON.parse(obj.terkait || '[]');
    obj.lampiran = JSON.parse(obj.lampiran || '[]');

    return res.json({ success: true, data: obj });
  } catch (error) {
    console.error('Error getting pengajuan by ID:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /api/pengajuan/:id
// Body: { tanggal, pengajuan, nilai, status, terkait, lampiran }
exports.update = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;
    const { tanggal, pengajuan, nilai, status, terkait, lampiran } = req.body || {};

    const found = await Pengajuan.findByPk(id);
    if (!found) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Owner boleh update; selain owner: hanya pembuatnya yang boleh
    if (role !== 'owner' && found.created_by !== userId) {
      return res.status(403).json({ success: false, message: 'Tidak ada akses untuk mengubah pengajuan ini' });
    }

    // Prepare update data
    const updateData = {};
    
    if (tanggal !== undefined) updateData.tanggal = tanggal;
    if (pengajuan !== undefined) updateData.pengajuan = pengajuan;
    if (nilai !== undefined) updateData.nilai = Number(nilai) || 0;
    if (status !== undefined) updateData.status = status;
    
    // Handle terkait - save IDs directly
    if (terkait !== undefined) {
      updateData.terkait = typeof terkait === 'string' ? terkait : JSON.stringify(terkait || []);
    }
    
    // Handle lampiran
    if (lampiran !== undefined) {
      updateData.lampiran = typeof lampiran === 'string' ? lampiran : JSON.stringify(lampiran || []);
    }

    await found.update(updateData);

    const obj = found.toJSON();
    obj.terkait = JSON.parse(obj.terkait || '[]');
    obj.lampiran = JSON.parse(obj.lampiran || '[]');

    return res.json({ success: true, message: 'Pengajuan berhasil diperbarui', data: obj });
  } catch (error) {
    console.error('Error updating pengajuan:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /api/pengajuan/:id/status
// Body: { status }
// DELETE /api/pengajuan/:id (soft delete)
exports.delete = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    const found = await Pengajuan.findByPk(id);
    if (!found) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Owner boleh delete; selain owner: hanya pembuatnya yang boleh
    if (role !== 'owner' && found.created_by !== userId) {
      return res.status(403).json({ success: false, message: 'Tidak ada akses untuk menghapus pengajuan ini' });
    }

    // Soft delete - update status_deleted ke true
    await found.update({ 
      status_deleted: true,
      deleted_at: new Date(),
      deleted_by: userId
    });

    return res.json({ success: true, message: 'Pengajuan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting pengajuan:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body || {}
    const allowed = ['disetujui','tidak_disetujui','pending']
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' })
    }
    const found = await Pengajuan.findByPk(id)
    if (!found) return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' })

    // Owner boleh update; selain owner: hanya pembuatnya yang boleh
    if (req.user?.role !== 'owner' && found.created_by !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Tidak diizinkan mengubah status' })
    }

    await found.update({ status })
    const obj = found.toJSON()
    try { obj.terkait = JSON.parse(obj.terkait || '[]') } catch { obj.terkait = [] }
    try { obj.lampiran = JSON.parse(obj.lampiran || '[]') } catch { obj.lampiran = [] }
    return res.json({ success: true, message: 'Status berhasil diperbarui', data: obj })
  } catch (error) {
    console.error('Error updating status pengajuan:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
