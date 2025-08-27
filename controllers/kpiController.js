const { KPI } = require('../models/KPI');
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
  }
};

module.exports = {
  kpiController
};
