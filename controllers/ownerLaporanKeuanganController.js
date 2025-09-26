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
      return res.status(500).json({ 
        success: false,
        error: result.error 
      });
    }

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in GET /owner/laporan-keuangan:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

// GET /api/owner/laporan-keuangan/statistics
exports.getStatistics = async (req, res) => {
  try {
    // Owner can see all statistics (read-only preview)
    const result = await LaporanKeuangan.getStatistics();

    if (!result.success) {
      return res.status(500).json({ 
        success: false,
        error: result.error 
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /owner/laporan-keuangan/statistics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
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
      return res.status(404).json({ 
        success: false,
        error: result.error 
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /owner/laporan-keuangan/:id:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};
