const Saran = require('../models/Saran');
const User = require('../models/User');
const { sendSaranNotification } = require('../services/notificationService');

// Get all saran (non-deleted) - only for logged in admin
const getAllSaran = async (req, res) => {
  try {
    const saran = await Saran.findAll({
      where: { 
        status_deleted: false,
        created_by: req.user.id // Only get saran created by logged in admin
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: saran,
      message: 'Data saran berhasil diambil'
    });
  } catch (error) {
    console.error('Error getting saran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data saran',
      error: error.message
    });
  }
};

// Get all saran for owner (all admin saran)
const getAllSaranForOwner = async (req, res) => {
  try {
    const saran = await Saran.findAll({
      where: { 
        status_deleted: false
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: saran,
      message: 'Data saran berhasil diambil untuk owner'
    });
  } catch (error) {
    console.error('Error getting saran for owner:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data saran',
      error: error.message
    });
  }
};

// Get saran by ID
const getSaranById = async (req, res) => {
  try {
    const { id } = req.params;
    const saran = await Saran.findOne({
      where: { id, status_deleted: false },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    if (!saran) {
      return res.status(404).json({
        success: false,
        message: 'Saran tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: saran,
      message: 'Data saran berhasil diambil'
    });
  } catch (error) {
    console.error('Error getting saran by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data saran',
      error: error.message
    });
  }
};

// Create new saran
const createSaran = async (req, res) => {
  try {
    const { saran, deskripsi_saran } = req.body;
    const created_by = req.user.id; // From auth middleware

    if (!saran) {
      return res.status(400).json({
        success: false,
        message: 'Saran harus diisi'
      });
    }

    // Get user nama from auth
    const user = await User.findByPk(created_by);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const newSaran = await Saran.create({
      nama: user.nama, // Automatically set nama from logged in user
      saran,
      deskripsi_saran,
      created_by
    });

    // Get the created saran with user info
    const createdSaran = await Saran.findOne({
      where: { id: newSaran.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    // Send notification to owner asynchronously (don't wait for it)
    try {
      // Get wsService instance from app
      const wsService = req.app.get('wsService');

      // Send notification to owner
      sendSaranNotification(createdSaran, user, wsService)
        .then(success => {
          if (success) {
            console.log(`✅ Saran notification sent successfully to owner`);
          } else {
            console.log(`❌ Failed to send saran notification to owner`);
          }
        })
        .catch(error => {
          console.error('Error sending saran notification:', error);
        });
    } catch (notificationError) {
      console.error('Error setting up saran notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: createdSaran,
      message: 'Saran berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating saran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat saran',
      error: error.message
    });
  }
};

// Update saran
const updateSaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { saran, deskripsi_saran } = req.body;

    const existingSaran = await Saran.findOne({
      where: { id, status_deleted: false }
    });

    if (!existingSaran) {
      return res.status(404).json({
        success: false,
        message: 'Saran tidak ditemukan'
      });
    }

    // Update fields (nama tidak bisa diubah)
    if (saran) existingSaran.saran = saran;
    if (deskripsi_saran !== undefined) existingSaran.deskripsi_saran = deskripsi_saran;

    await existingSaran.save();

    // Get updated saran with user info
    const updatedSaran = await Saran.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedSaran,
      message: 'Saran berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating saran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate saran',
      error: error.message
    });
  }
};

// Soft delete saran
const deleteSaran = async (req, res) => {
  try {
    const { id } = req.params;

    const saran = await Saran.findOne({
      where: { id, status_deleted: false }
    });

    if (!saran) {
      return res.status(404).json({
        success: false,
        message: 'Saran tidak ditemukan'
      });
    }

    saran.status_deleted = true;
    await saran.save();

    res.json({
      success: true,
      message: 'Saran berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting saran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus saran',
      error: error.message
    });
  }
};

module.exports = {
  getAllSaran,
  getAllSaranForOwner,
  getSaranById,
  createSaran,
  updateSaran,
  deleteSaran
};
