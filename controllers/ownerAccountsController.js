const { Op } = require('sequelize');
const { User } = require('../models');

// GET /api/owner/accounts
// Query: role (admin, owner, leader)
exports.list = async (req, res) => {
  try {
    const { role } = req.query;
    const where = { status_deleted: false };

    // Filter by role if specified
    if (role && ['admin', 'owner', 'leader'].includes(role)) {
      where.role = role;
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'nama', 'email', 'username', 'role', 'status', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error listing owner accounts:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /api/owner/accounts/:id/status
// Body: { status: 'active' | 'inactive' }
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const user = await User.findByPk(id);
    if (!user || user.status_deleted) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    await user.update({ status });

    return res.json({
      success: true,
      message: 'Status berhasil diperbarui',
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error updating account status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /api/owner/accounts/:id
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user || user.status_deleted) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Soft delete
    await user.update({ status_deleted: true });

    return res.json({
      success: true,
      message: 'Akun berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
