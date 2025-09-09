const { PicKategori, User } = require('../models');
const { Op } = require('sequelize');

// Get all PIC kategori assignments
const getAllPicKategori = async (req, res) => {
  try {
    const picKategori = await PicKategori.findAll({
      where: { status_deleted: false },
      include: [
        {
          model: User,
          as: 'pic',
          attributes: ['id', 'nama', 'email']
        }
      ],
      order: [['kategori', 'ASC']]
    });

    res.json({
      success: true,
      data: picKategori
    });
  } catch (error) {
    console.error('Error fetching PIC kategori:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data PIC kategori'
    });
  }
};

// Update PIC for a category
const updatePicKategori = async (req, res) => {
  try {
    const { kategori } = req.params;
    const { pic_id } = req.body;
    const { user } = req;

    // Check if user is owner or admin
    if (user.role !== 'owner' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya owner/admin yang diizinkan.'
      });
    }

    // Find or create PIC kategori record
    let picKategori = await PicKategori.findOne({
      where: { 
        kategori: kategori,
        status_deleted: false 
      }
    });

    if (!picKategori) {
      picKategori = await PicKategori.create({
        kategori: kategori,
        pic_id: pic_id || null
      });
    } else {
      await picKategori.update({
        pic_id: pic_id || null
      });
    }

    // Get updated data with PIC info
    const updatedPicKategori = await PicKategori.findByPk(picKategori.id, {
      include: [
        {
          model: User,
          as: 'pic',
          attributes: ['id', 'nama', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'PIC kategori berhasil diperbarui',
      data: updatedPicKategori
    });
  } catch (error) {
    console.error('Error updating PIC kategori:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui PIC kategori'
    });
  }
};

// Get available users for PIC assignment
const getAvailablePics = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: { [Op.in]: ['admin', 'owner'] },
        status_deleted: false
      },
      attributes: ['id', 'nama', 'email', 'role'],
      order: [['nama', 'ASC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching available PICs:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data PIC yang tersedia'
    });
  }
};

module.exports = {
  getAllPicKategori,
  updatePicKategori,
  getAvailablePics
};
