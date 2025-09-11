const { SopDivisi, SopCategory, SopStep } = require('../models');

// Get all divisions
const getAllDivisions = async (req, res) => {
  try {
    const divisions = await SopDivisi.findAll({
      where: { status_aktif: true },
      order: [['nama_divisi', 'ASC']]
    });

    res.json({
      success: true,
      data: divisions
    });
  } catch (error) {
    console.error('Error getting divisions:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data divisi',
      error: error.message
    });
  }
};

// Get categories by division
const getCategoriesByDivision = async (req, res) => {
  try {
    const { divisiId } = req.params;

    const categories = await SopCategory.findAll({
      where: { 
        divisi_id: divisiId,
        status_aktif: true 
      },
      order: [['nama_category', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kategori',
      error: error.message
    });
  }
};

// Get complete SOP structure
const getCompleteSopStructure = async (req, res) => {
  try {
    console.log('🔍 ===== BACKEND SOP API CALLED =====');
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);
    
    const divisions = await SopDivisi.findAll({
      where: { status_aktif: true },
      include: [
        {
          model: SopCategory,
          as: 'categories',
          where: { status_aktif: true },
          required: false,
          include: [
            {
              model: SopStep,
              as: 'steps',
              required: false
            }
          ]
        }
      ],
      order: [
        ['nama_divisi', 'ASC'],
        [{ model: SopCategory, as: 'categories' }, 'nama_category', 'ASC'],
        [{ model: SopCategory, as: 'categories' }, { model: SopStep, as: 'steps' }, 'judul_procedure', 'ASC']
      ]
    });

    console.log('📦 Found divisions:', divisions.length);
    console.log('📦 Divisions data:', JSON.stringify(divisions, null, 2));

    res.json({
      success: true,
      data: divisions
    });
  } catch (error) {
    console.error('❌ Error getting complete SOP structure:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil struktur SOP lengkap',
      error: error.message
    });
  }
};

// Create division
const createDivision = async (req, res) => {
  try {
    const { nama_divisi, keterangan } = req.body;
    const created_by = req.user.id;

    const division = await SopDivisi.create({
      nama_divisi,
      keterangan,
      created_by
    });

    res.status(201).json({
      success: true,
      message: 'Divisi berhasil dibuat',
      data: division
    });
  } catch (error) {
    console.error('Error creating division:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat divisi',
      error: error.message
    });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const { divisi_id, nama_category, keterangan } = req.body;
    const created_by = req.user.id;

    const category = await SopCategory.create({
      divisi_id,
      nama_category,
      keterangan,
      created_by
    });

    res.status(201).json({
      success: true,
      message: 'Kategori berhasil dibuat',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat kategori',
      error: error.message
    });
  }
};

// Create step
const createStep = async (req, res) => {
  try {
    const { category_id, judul_procedure } = req.body;
    const created_by = req.user.id;

    const step = await SopStep.create({
      category_id,
      judul_procedure,
      created_by
    });

    res.status(201).json({
      success: true,
      message: 'Step berhasil dibuat',
      data: step
    });
  } catch (error) {
    console.error('Error creating step:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat step',
      error: error.message
    });
  }
};


// Update division
const updateDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_divisi, keterangan } = req.body;
    const updated_by = req.user.id;

    const division = await SopDivisi.findByPk(id);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Divisi tidak ditemukan'
      });
    }

    await division.update({
      nama_divisi,
      keterangan,
      updated_by
    });

    res.json({
      success: true,
      message: 'Divisi berhasil diupdate',
      data: division
    });
  } catch (error) {
    console.error('Error updating division:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate divisi',
      error: error.message
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_category, keterangan } = req.body;
    const updated_by = req.user.id;

    const category = await SopCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan'
      });
    }

    await category.update({
      nama_category,
      keterangan,
      updated_by
    });

    res.json({
      success: true,
      message: 'Kategori berhasil diupdate',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate kategori',
      error: error.message
    });
  }
};


// Update step
const updateStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, judul_procedure } = req.body;
    const updated_by = req.user.id;

    const step = await SopStep.findByPk(id);
    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Step tidak ditemukan'
      });
    }

    await step.update({
      category_id,
      judul_procedure,
      updated_by
    });

    res.json({
      success: true,
      message: 'Step berhasil diupdate',
      data: step
    });
  } catch (error) {
    console.error('Error updating step:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate step',
      error: error.message
    });
  }
};

// Soft delete division
const deleteDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user.id;

    const division = await SopDivisi.findByPk(id);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Divisi tidak ditemukan'
      });
    }

    await division.update({
      status_aktif: false,
      updated_by
    });

    res.json({
      success: true,
      message: 'Divisi berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting division:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus divisi',
      error: error.message
    });
  }
};

// Soft delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user.id;

    const category = await SopCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan'
      });
    }

    await category.update({
      status_aktif: false,
      updated_by
    });

    res.json({
      success: true,
      message: 'Kategori berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus kategori',
      error: error.message
    });
  }
};


// Soft delete step
const deleteStep = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user.id;

    const step = await SopStep.findByPk(id);
    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Step tidak ditemukan'
      });
    }

    await step.update({
      status_aktif: false,
      updated_by
    });

    res.json({
      success: true,
      message: 'Step berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting step:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus step',
      error: error.message
    });
  }
};

module.exports = {
  getAllDivisions,
  getCategoriesByDivision,
  getCompleteSopStructure,
  createDivision,
  createCategory,
  createStep,
  updateDivision,
  updateCategory,
  updateStep,
  deleteDivision,
  deleteCategory,
  deleteStep
};
