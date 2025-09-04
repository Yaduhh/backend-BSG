const { AnekaGrafik } = require('../models/AnekaGrafik');

// Get all aneka grafik with hierarchical structure
const getAllAnekaGrafik = async (req, res) => {
  try {
    // Get parent categories first
    const parentCategories = await AnekaGrafik.findAll({
      where: { 
        status_deleted: false,
        parent_id: null 
      },
      order: [['name', 'ASC']]
    });

    // Get child items for each parent
    const hierarchicalData = [];
    for (const parent of parentCategories) {
      const children = await AnekaGrafik.findAll({
        where: { 
          status_deleted: false,
          parent_id: parent.id 
        },
        order: [['name', 'ASC']]
      });

      hierarchicalData.push({
        ...parent.toJSON(),
        children: children
      });
    }

    res.json({
      success: true,
      data: hierarchicalData
    });
  } catch (error) {
    console.error('Error getting all aneka grafik:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data aneka grafik'
    });
  }
};

// Get aneka grafik by category
const getAnekaGrafikByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const anekaGrafik = await AnekaGrafik.findAll({
      where: { 
        category: category,
        status_deleted: false 
      },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: anekaGrafik
    });
  } catch (error) {
    console.error('Error getting aneka grafik by category:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data aneka grafik'
    });
  }
};

// Get aneka grafik by ID
const getAnekaGrafikById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const anekaGrafik = await AnekaGrafik.findOne({
      where: { 
        id: id,
        status_deleted: false 
      }
    });

    if (!anekaGrafik) {
      return res.status(404).json({
        success: false,
        message: 'Aneka grafik tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: anekaGrafik
    });
  } catch (error) {
    console.error('Error getting aneka grafik by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data aneka grafik'
    });
  }
};

// Create new aneka grafik
const createAnekaGrafik = async (req, res) => {
  try {
    const { name, category, photo_url, parent_id } = req.body;

    // Validation
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan kategori harus diisi'
      });
    }

    const anekaGrafik = await AnekaGrafik.create({
      name,
      category,
      photo_url: photo_url || null,
      parent_id: parent_id || null,
      status_deleted: false
    });

    res.status(201).json({
      success: true,
      data: anekaGrafik,
      message: 'Aneka grafik berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating aneka grafik:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat aneka grafik'
    });
  }
};

// Update aneka grafik
const updateAnekaGrafik = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, photo_url } = req.body;

    const anekaGrafik = await AnekaGrafik.findOne({
      where: { 
        id: id,
        status_deleted: false 
      }
    });

    if (!anekaGrafik) {
      return res.status(404).json({
        success: false,
        message: 'Aneka grafik tidak ditemukan'
      });
    }

    // Update fields
    if (name) anekaGrafik.name = name;
    if (category) anekaGrafik.category = category;
    if (photo_url !== undefined) anekaGrafik.photo_url = photo_url;

    await anekaGrafik.save();

    res.json({
      success: true,
      data: anekaGrafik,
      message: 'Aneka grafik berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating aneka grafik:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate aneka grafik'
    });
  }
};

// Delete aneka grafik (soft delete)
const deleteAnekaGrafik = async (req, res) => {
  try {
    const { id } = req.params;

    const anekaGrafik = await AnekaGrafik.findOne({
      where: { 
        id: id,
        status_deleted: false 
      }
    });

    if (!anekaGrafik) {
      return res.status(404).json({
        success: false,
        message: 'Aneka grafik tidak ditemukan'
      });
    }

    // Soft delete
    anekaGrafik.status_deleted = true;
    await anekaGrafik.save();

    res.json({
      success: true,
      message: 'Aneka grafik berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting aneka grafik:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus aneka grafik'
    });
  }
};

// Get statistics
const getStats = async (req, res) => {
  try {
    const result = await AnekaGrafik.getStats();

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error in getStats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllAnekaGrafik,
  getAnekaGrafikByCategory,
  getAnekaGrafikById,
  createAnekaGrafik,
  updateAnekaGrafik,
  deleteAnekaGrafik,
  getStats
};
