const { User, SdmDivisi, SdmJabatan, SdmData, SopCategory, SopStep } = require('../models');

// Simple in-memory cache
const cache = {
  divisions: null,
  sopStructure: null,
  lastUpdate: null,
  ttl: 5 * 60 * 1000 // 5 minutes
};

// Helper function to check if cache is valid
const isCacheValid = () => {
  return cache.lastUpdate && (Date.now() - cache.lastUpdate) < cache.ttl;
};

// Helper function to clear cache
const clearCache = () => {
  cache.divisions = null;
  cache.sopStructure = null;
  cache.lastUpdate = null;
};

// Get all divisions - Updated to use SdmDivisi with caching
const getAllDivisions = async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid() && cache.divisions) {
      return res.json({
        success: true,
        data: cache.divisions,
        cached: true
      });
    }

    const divisions = await SdmDivisi.findAll({
      where: { status_aktif: true },
      attributes: ['id', 'nama_divisi', 'keterangan'],
      order: [['nama_divisi', 'ASC']]
    });

    // Update cache
    cache.divisions = divisions;
    cache.lastUpdate = Date.now();

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

// Get complete SOP structure with caching
const getCompleteSopStructure = async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid() && cache.sopStructure) {
      return res.json({
        success: true,
        data: cache.sopStructure,
        cached: true
      });
    }

    const divisions = await SdmDivisi.findAll({
      where: { status_aktif: true },
      attributes: ['id', 'nama_divisi', 'keterangan'],
      include: [
        {
          model: SopCategory,
          as: 'sopCategories',
          where: { status_aktif: true },
          required: false,
          attributes: ['id', 'nama_category', 'keterangan', 'sdm_divisi_id'],
          include: [
            {
              model: SopStep,
              as: 'steps',
              required: false,
              attributes: ['id', 'judul_procedure', 'category_id']
            }
          ]
        }
      ],
      order: [
        ['nama_divisi', 'ASC'],
        [{ model: SopCategory, as: 'sopCategories' }, 'nama_category', 'ASC'],
        [{ model: SopCategory, as: 'sopCategories' }, { model: SopStep, as: 'steps' }, 'judul_procedure', 'ASC']
      ]
    });

    // Update cache
    cache.sopStructure = divisions;
    cache.lastUpdate = Date.now();

    res.json({
      success: true,
      data: divisions
    });
  } catch (error) {
    console.error('Error getting complete SOP structure:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil struktur SOP lengkap',
      error: error.message
    });
  }
};


// Create category
const createCategory = async (req, res) => {
  try {
    const { sdm_divisi_id, nama_category, keterangan } = req.body;
    const created_by = req.user.id;

    const category = await SopCategory.create({
      sdm_divisi_id,
      nama_category,
      keterangan,
      created_by
    });

    // Clear cache after creating
    clearCache();

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

    // Clear cache after creating
    clearCache();

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



// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_category, keterangan, sdm_divisi_id } = req.body;
    const updated_by = req.user.id;

    const category = await SopCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan'
      });
    }

    // Validate sdm_divisi_id if provided
    if (sdm_divisi_id) {
      const division = await SdmDivisi.findByPk(sdm_divisi_id);
      if (!division) {
        return res.status(400).json({
          success: false,
          message: 'Divisi tidak ditemukan'
        });
      }
    }

    await category.update({
      nama_category,
      keterangan,
      sdm_divisi_id: sdm_divisi_id || category.sdm_divisi_id,
      updated_by
    });

    // Clear cache after updating
    clearCache();

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

    // Clear cache after updating
    clearCache();

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

    // Clear cache after deleting
    clearCache();

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


// Delete step
const deleteStep = async (req, res) => {
  try {
    const { id } = req.params;

    const step = await SopStep.findByPk(id);
    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Step tidak ditemukan'
      });
    }

    await step.destroy();

    // Clear cache after deleting
    clearCache();

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

// Get SOP berdasarkan divisi user yang login
const getSopByUserDivisi = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user divisi info melalui SdmData -> SdmJabatan -> SdmDivisi
    const user = await User.findByPk(userId, {
      include: [{
        model: SdmData,
        as: 'sdmDataUser',
        attributes: ['id', 'user_id', 'jabatan_id'],
        include: [{
          model: SdmJabatan,
          as: 'jabatan',
          attributes: ['id', 'nama_jabatan', 'divisi_id'],
          include: [{
            model: SdmDivisi,
            as: 'divisi',
            attributes: ['id', 'nama_divisi', 'keterangan']
          }]
        }]
      }]
    });

    // Check if user has divisi data
    if (!user || !user.sdmDataUser || user.sdmDataUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak memiliki data divisi. Silakan hubungi admin untuk mengatur divisi Anda.'
      });
    }

    // Get the first sdm_data record (assuming one user has one divisi)
    const sdmData = user.sdmDataUser[0];
    if (!sdmData.jabatan || !sdmData.jabatan.divisi) {
      return res.status(404).json({
        success: false,
        message: 'User tidak memiliki jabatan atau divisi yang valid'
      });
    }

    const divisiId = sdmData.jabatan.divisi.id;
    const divisiInfo = sdmData.jabatan.divisi;
    
    // Get SOP categories for this divisi
    const sopCategories = await SopCategory.findAll({
      where: { sdm_divisi_id: divisiId },
      attributes: ['id', 'nama_category', 'keterangan', 'sdm_divisi_id'],
      include: [{
        model: SopStep,
        as: 'steps',
        attributes: ['id', 'judul_procedure', 'category_id'],
        order: [['id', 'ASC']]
      }],
      order: [['nama_category', 'ASC']]
    });

    // Format response
    const formattedData = sopCategories.map(category => ({
      id: category.id,
      nama_category: category.nama_category,
      keterangan: category.keterangan,
      divisi_nama: divisiInfo.nama_divisi,
      steps: category.steps || []
    }));

    res.json({
      success: true,
      data: formattedData,
      divisi_info: {
        id: divisiInfo.id,
        nama_divisi: divisiInfo.nama_divisi,
        keterangan: divisiInfo.keterangan
      },
      message: formattedData.length === 0 ? 
        `Belum ada SOP untuk divisi ${divisiInfo.nama_divisi}. Silakan hubungi admin untuk menambahkan SOP divisi Anda.` : 
        null
    });
  } catch (error) {
    console.error('Error fetching SOP by user divisi:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data SOP',
      error: error.message
    });
  }
};

// Get SOP berdasarkan divisi tertentu
const getSopByDivisi = async (req, res) => {
  try {
    const { divisiId } = req.params;
    
    // Get divisi info
    const divisi = await SdmDivisi.findByPk(divisiId, {
      attributes: ['id', 'nama_divisi', 'keterangan']
    });

    if (!divisi) {
      return res.status(404).json({
        success: false,
        message: 'Divisi tidak ditemukan'
      });
    }

    // Get SOP categories for this divisi
    const sopCategories = await SopCategory.findAll({
      where: { sdm_divisi_id: divisiId },
      attributes: ['id', 'nama_category', 'keterangan', 'sdm_divisi_id'],
      include: [{
        model: SopStep,
        as: 'steps',
        attributes: ['id', 'judul_procedure', 'category_id'],
        order: [['id', 'ASC']]
      }],
      order: [['nama_category', 'ASC']]
    });

    // Format response
    const formattedData = sopCategories.map(category => ({
      id: category.id,
      nama_category: category.nama_category,
      keterangan: category.keterangan,
      divisi_nama: divisi.nama_divisi,
      steps: category.steps || []
    }));

    res.json({
      success: true,
      data: formattedData,
      divisi_info: {
        id: divisi.id,
        nama_divisi: divisi.nama_divisi,
        keterangan: divisi.keterangan
      }
    });
  } catch (error) {
    console.error('Error fetching SOP by divisi:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data SOP',
      error: error.message
    });
  }
};

module.exports = {
  getAllDivisions,
  getCategoriesByDivision,
  getCompleteSopStructure,
  createCategory,
  createStep,
  updateCategory,
  updateStep,
  deleteCategory,
  deleteStep,
  getSopByUserDivisi,
  getSopByDivisi
};
