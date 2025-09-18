const { PicLeader, User } = require('../models');

// Get all PIC leader menus (non-deleted and active)
const getAllPicLeaders = async (req, res) => {
  try {
    const picLeaders = await PicLeader.findAll({
      where: {
        status_deleted: false,
        status_aktif: true
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nama', 'email', 'role']
      }],
      order: [['nama', 'ASC']]
    });

    res.json({
      success: true,
      data: picLeaders
    });
  } catch (error) {
    console.error('Error fetching PIC leader menus:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data PIC leader menu'
    });
  }
};

// Get PIC leader menu by ID
const getPicLeaderById = async (req, res) => {
  try {
    const { id } = req.params;

    const picLeader = await PicLeader.findOne({
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

    if (!picLeader) {
      return res.status(404).json({
        success: false,
        message: 'PIC leader menu tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: picLeader
    });
  } catch (error) {
    console.error('Error fetching PIC leader menu:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data PIC leader menu'
    });
  }
};

// Get PIC leader menus by user ID
const getPicLeadersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const picLeaders = await PicLeader.findAll({
      where: {
        id_user: userId,
        status_deleted: false,
        status_aktif: true
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nama', 'email', 'role']
      }],
      order: [['nama', 'ASC']]
    });

    res.json({
      success: true,
      data: picLeaders
    });
  } catch (error) {
    console.error('Error fetching PIC leader menus by user:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data PIC leader menu'
    });
  }
};

// Create new PIC leader menu
const createPicLeader = async (req, res) => {
  try {
    const { id_user, nama, link } = req.body;

    // Validate required fields
    if (!id_user || !nama) {
      return res.status(400).json({
        success: false,
        message: 'ID user dan nama harus diisi'
      });
    }

    // Check if user exists and is a leader
    const user = await User.findByPk(id_user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (user.role !== 'leader') {
      return res.status(400).json({
        success: false,
        message: 'User harus memiliki role leader'
      });
    }

    // Create PIC leader menu
    const picLeader = await PicLeader.create({
      id_user,
      nama,
      link: link || null
    });

    // Fetch created PIC leader menu with user data
    const createdPicLeader = await PicLeader.findByPk(picLeader.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nama', 'email', 'role']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'PIC leader menu berhasil dibuat',
      data: createdPicLeader
    });
  } catch (error) {
    console.error('Error creating PIC leader menu:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat PIC leader menu'
    });
  }
};

// Update PIC leader menu
const updatePicLeader = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user, nama, link, status_aktif } = req.body;

    // Find PIC leader menu
    const picLeader = await PicLeader.findOne({
      where: {
        id: id,
        status_deleted: false
      }
    });

    if (!picLeader) {
      return res.status(404).json({
        success: false,
        message: 'PIC leader menu tidak ditemukan'
      });
    }

    // Check if user exists and is a leader (if id_user is being updated)
    if (id_user) {
      const user = await User.findByPk(id_user);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      if (user.role !== 'leader') {
        return res.status(400).json({
          success: false,
          message: 'User harus memiliki role leader'
        });
      }
    }

    // Update PIC leader menu
    await picLeader.update({
      id_user: id_user || picLeader.id_user,
      nama: nama || picLeader.nama,
      link: link !== undefined ? link : picLeader.link,
      status_aktif: status_aktif !== undefined ? status_aktif : picLeader.status_aktif
    });

    // Fetch updated PIC leader menu with user data
    const updatedPicLeader = await PicLeader.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nama', 'email', 'role']
      }]
    });

    res.json({
      success: true,
      message: 'PIC leader menu berhasil diperbarui',
      data: updatedPicLeader
    });
  } catch (error) {
    console.error('Error updating PIC leader menu:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui PIC leader menu'
    });
  }
};

// Soft delete PIC leader menu
const deletePicLeader = async (req, res) => {
  try {
    const { id } = req.params;

    // Find PIC leader menu
    const picLeader = await PicLeader.findOne({
      where: {
        id: id,
        status_deleted: false
      }
    });

    if (!picLeader) {
      return res.status(404).json({
        success: false,
        message: 'PIC leader menu tidak ditemukan'
      });
    }

    // Soft delete
    await picLeader.update({
      status_deleted: true
    });

    res.json({
      success: true,
      message: 'PIC leader menu berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting PIC leader menu:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus PIC leader menu'
    });
  }
};

// Toggle status aktif PIC leader menu
const toggleStatusAktif = async (req, res) => {
  try {
    const { id } = req.params;

    // Find PIC leader menu
    const picLeader = await PicLeader.findOne({
      where: {
        id: id,
        status_deleted: false
      }
    });

    if (!picLeader) {
      return res.status(404).json({
        success: false,
        message: 'PIC leader menu tidak ditemukan'
      });
    }

    // Toggle status aktif
    await picLeader.update({
      status_aktif: !picLeader.status_aktif
    });

    res.json({
      success: true,
      message: `PIC leader menu berhasil ${!picLeader.status_aktif ? 'diaktifkan' : 'dinonaktifkan'}`,
      data: {
        id: picLeader.id,
        status_aktif: !picLeader.status_aktif
      }
    });
  } catch (error) {
    console.error('Error toggling PIC leader menu status:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah status PIC leader menu'
    });
  }
};

module.exports = {
  getAllPicLeaders,
  getPicLeaderById,
  getPicLeadersByUserId,
  createPicLeader,
  updatePicLeader,
  deletePicLeader,
  toggleStatusAktif
};
