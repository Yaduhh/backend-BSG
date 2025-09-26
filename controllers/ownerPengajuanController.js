const { Op } = require('sequelize');
const { Pengajuan, User } = require('../models');

// GET /api/owner/pengajuan
// Query: page, limit, q, status, dateFrom, dateTo
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, q, status, dateFrom, dateTo } = req.query;
    const where = { status_deleted: false };

    // Owner dapat melihat semua pengajuan
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      where.pengajuan = { [Op.like]: term };
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
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username'],
          required: false
        }
      ]
    });

    // Parse JSON fields sebelum kirim
    const rows = result.rows.map(r => {
      const obj = r.toJSON();
      try { 
        obj.terkait = Array.isArray(obj.terkait) ? obj.terkait : JSON.parse(obj.terkait || '[]') 
      } catch { 
        obj.terkait = [] 
      }
      try { 
        obj.lampiran = Array.isArray(obj.lampiran) ? obj.lampiran : JSON.parse(obj.lampiran || '[]') 
      } catch { 
        obj.lampiran = [] 
      }
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
    console.error('Error listing owner pengajuan:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/owner/pengajuan/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const pengajuan = await Pengajuan.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username'],
          required: false
        }
      ]
    });

    if (!pengajuan || pengajuan.status_deleted) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    const obj = pengajuan.toJSON();
    obj.terkait = JSON.parse(obj.terkait || '[]');
    obj.lampiran = JSON.parse(obj.lampiran || '[]');

    return res.json({ success: true, data: obj });
  } catch (error) {
    console.error('Error getting owner pengajuan by ID:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /api/owner/pengajuan/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['disetujui', 'tidak_disetujui', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan || pengajuan.status_deleted) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Owner can update any pengajuan status
    await pengajuan.update({ status });

    return res.json({
      success: true,
      message: 'Status pengajuan berhasil diperbarui',
      data: {
        id: pengajuan.id,
        status: pengajuan.status
      }
    });
  } catch (error) {
    console.error('Error updating owner pengajuan status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
