const { KPI } = require('../models/KPI');
const { User, SdmData, SdmJabatan, SdmDivisi, LeaderDivisi } = require('../models');
const { Op } = require('sequelize');

// KPI Controller
const kpiController = {
  // Get all KPIs
  getAllKPIs: async (req, res) => {
    try {
      const kpis = await KPI.findAll({
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: kpis,
        message: 'KPIs retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get KPIs by category
  getKPIsByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      
      if (!['divisi', 'leader', 'individu'].includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category. Must be divisi, leader, or individu'
        });
      }

      const kpis = await KPI.findAll({
        where: { category },
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: kpis,
        message: `KPI ${category} retrieved successfully`
      });
    } catch (error) {
      console.error('Error getting KPIs by category:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get KPI by ID
  getKPIById: async (req, res) => {
    try {
      const { id } = req.params;
      const kpi = await KPI.findByPk(id);

      if (!kpi) {
        return res.status(404).json({
          success: false,
          message: 'KPI not found'
        });
      }

      res.json({
        success: true,
        data: kpi,
        message: 'KPI retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting KPI by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Create new KPI
  createKPI: async (req, res) => {
    try {
      const kpiData = req.body;
      const newKPI = await KPI.create(kpiData);

      res.status(201).json({
        success: true,
        data: newKPI,
        message: 'KPI created successfully'
      });
    } catch (error) {
      console.error('Error creating KPI:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update KPI
  updateKPI: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const kpi = await KPI.findByPk(id);
      if (!kpi) {
        return res.status(404).json({
          success: false,
          message: 'KPI not found'
        });
      }

      await kpi.update(updateData);

      res.json({
        success: true,
        data: kpi,
        message: 'KPI updated successfully'
      });
    } catch (error) {
      console.error('Error updating KPI:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Delete KPI
  deleteKPI: async (req, res) => {
    try {
      const { id } = req.params;
      const kpi = await KPI.findByPk(id);

      if (!kpi) {
        return res.status(404).json({
          success: false,
          message: 'KPI not found'
        });
      }

      await kpi.destroy();

      res.json({
        success: true,
        message: 'KPI deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting KPI:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get KPIs by leader's division
  getKPIsByLeaderDivision: async (req, res) => {
    try {
      const { userId } = req.params;

      // Cari divisi leader menggunakan tabel leader_divisi
      const leaderDivisiData = await LeaderDivisi.findAll({
        where: {
          id_user: userId
        },
        include: [
          {
            model: SdmDivisi,
            as: 'divisi',
            attributes: ['id', 'nama_divisi', 'deskripsi']
          }
        ]
      });

      if (!leaderDivisiData || leaderDivisiData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data divisi leader tidak ditemukan'
        });
      }

      // Ambil semua divisi ID yang terkait dengan leader
      const leaderDivisiIds = leaderDivisiData.map(item => item.id_divisi);
      const leaderDivisi = leaderDivisiData[0].divisi; // Ambil divisi pertama untuk response

      // Ambil semua KPI yang relevan untuk leader:
      // 1. KPI divisi (divisi_id IN leaderDivisiIds)
      // 2. KPI leader (id_user = userId)
      // 3. KPI individu (id_user = userId atau divisi_id IN leaderDivisiIds)
      const kpis = await KPI.findAll({
        where: {
          [Op.or]: [
            // KPI divisi untuk divisi leader
            {
              category: 'divisi',
              divisi_id: {
                [Op.in]: leaderDivisiIds
              }
            },
            // KPI leader untuk leader ini
            {
              category: 'leader',
              id_user: userId
            },
            // KPI individu untuk leader ini atau divisi leader
            {
              category: 'individu',
              [Op.or]: [
                { id_user: userId },
                { 
                  divisi_id: {
                    [Op.in]: leaderDivisiIds
                  }
                }
              ]
            }
          ]
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nama', 'username', 'email']
          },
          {
            model: SdmDivisi,
            as: 'divisi',
            attributes: ['id', 'nama_divisi']
          }
        ],
        order: [
          ['category', 'ASC'],
          ['name', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: {
          kpis: kpis,
          leaderDivisi: leaderDivisi
        },
        message: 'KPIs retrieved successfully for leader division'
      });
    } catch (error) {
      console.error('Error getting KPIs by leader division:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = {
  kpiController
};
