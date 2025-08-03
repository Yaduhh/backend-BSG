const express = require('express');
const router = express.Router();
const PicMenu = require('../models/PicMenu');
const User = require('../models/User');

// Get all PIC menus (non-deleted)
router.get('/', async (req, res) => {
  try {
    const picMenus = await PicMenu.findAll({
      where: {
        status_deleted: false
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nama', 'email', 'role']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: picMenus
    });
  } catch (error) {
    console.error('Error fetching PIC menus:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data PIC menu'
    });
  }
});

// Get PIC menu by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const picMenu = await PicMenu.findOne({
      where: {
        id: id,
        status_deleted: false
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nama', 'email', 'role']
      }]
    });

    if (!picMenu) {
      return res.status(404).json({
        success: false,
        message: 'PIC menu tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: picMenu
    });
  } catch (error) {
    console.error('Error fetching PIC menu:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data PIC menu'
    });
  }
});

// Create new PIC menu
router.post('/', async (req, res) => {
  try {
    const { id_user, nama, link } = req.body;

    // Validate required fields
    if (!id_user || !nama) {
      return res.status(400).json({
        success: false,
        message: 'ID user dan nama harus diisi'
      });
    }

    // Check if user exists
    const user = await User.findByPk(id_user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Create PIC menu
    const picMenu = await PicMenu.create({
      id_user,
      nama,
      link: link || null
    });

    // Fetch created PIC menu with user data
    const createdPicMenu = await PicMenu.findByPk(picMenu.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nama', 'email', 'role']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'PIC menu berhasil dibuat',
      data: createdPicMenu
    });
  } catch (error) {
    console.error('Error creating PIC menu:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat PIC menu'
    });
  }
});

// Update PIC menu
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user, nama, link } = req.body;

    // Find PIC menu
    const picMenu = await PicMenu.findOne({
      where: {
        id: id,
        status_deleted: false
      }
    });

    if (!picMenu) {
      return res.status(404).json({
        success: false,
        message: 'PIC menu tidak ditemukan'
      });
    }

    // Check if user exists (if id_user is being updated)
    if (id_user) {
      const user = await User.findByPk(id_user);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }
    }

    // Update PIC menu
    await picMenu.update({
      id_user: id_user || picMenu.id_user,
      nama: nama || picMenu.nama,
      link: link !== undefined ? link : picMenu.link
    });

    // Fetch updated PIC menu with user data
    const updatedPicMenu = await PicMenu.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nama', 'email', 'role']
      }]
    });

    res.json({
      success: true,
      message: 'PIC menu berhasil diperbarui',
      data: updatedPicMenu
    });
  } catch (error) {
    console.error('Error updating PIC menu:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui PIC menu'
    });
  }
});

// Soft delete PIC menu
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const picMenu = await PicMenu.findOne({
      where: {
        id: id,
        status_deleted: false
      }
    });

    if (!picMenu) {
      return res.status(404).json({
        success: false,
        message: 'PIC menu tidak ditemukan'
      });
    }

    // Soft delete by setting status_deleted to true
    await picMenu.update({
      status_deleted: true
    });

    res.json({
      success: true,
      message: 'PIC menu berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting PIC menu:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus PIC menu'
    });
  }
});

// Get PIC menus by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const picMenus = await PicMenu.findAll({
      where: {
        id_user: userId,
        status_deleted: false
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nama', 'email', 'role']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: picMenus
    });
  } catch (error) {
    console.error('Error fetching PIC menus by user:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data PIC menu'
    });
  }
});

module.exports = router; 