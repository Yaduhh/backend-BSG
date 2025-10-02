const LaporanKeuangan = require('../models/LaporanKeuangan');

// GET /api/owner/laporan-keuangan
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date = '', month = '' } = req.query;

    // Owner can see all laporan keuangan (read-only preview)
    const result = await LaporanKeuangan.getAll(
      parseInt(page),
      parseInt(limit),
      search,
      date,
      month
    );

    if (!result.success) {
      console.error('Error fetching laporan keuangan for owner:', result.error);
      // Return empty data instead of error
      return res.json({ 
        success: true,
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        }
      });
    }

    res.json({
      success: true,
      data: result.data || [],
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in GET /owner/laporan-keuangan:', error);
    // Return empty data instead of 500 error
    res.json({ 
      success: true,
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: parseInt(req.query.limit) || 10
      }
    });
  }
};

// GET /api/owner/laporan-keuangan/statistics
exports.getStatistics = async (req, res) => {
  try {
    // Owner can see all statistics (read-only preview)
    const result = await LaporanKeuangan.getStatistics();

    if (!result.success) {
      console.error('Error fetching statistics for owner:', result.error);
      // Return empty statistics instead of error
      return res.json({ 
        success: true,
        data: {
          total: 0,
          thisMonth: 0,
          thisYear: 0
        }
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /owner/laporan-keuangan/statistics:', error);
    // Return empty statistics instead of 500 error
    res.json({ 
      success: true,
      data: {
        total: 0,
        thisMonth: 0,
        thisYear: 0
      }
    });
  }
};

// GET /api/owner/laporan-keuangan/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Owner can see any laporan keuangan by ID (read-only preview)
    const result = await LaporanKeuangan.getById(id);

    if (!result.success) {
      console.error('Error fetching laporan keuangan by ID for owner:', result.error);
      return res.status(404).json({ 
        success: false,
        error: 'Data tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /owner/laporan-keuangan/:id:', error);
    res.status(404).json({ 
      success: false,
      error: 'Data tidak ditemukan'
    });
  }
};
