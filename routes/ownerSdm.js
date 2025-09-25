const express = require('express');
const router = express.Router();
const { SdmDivisi, SdmJabatan, SdmData, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// Helper: case-insensitive role check
function hasRole(req, allowedRoles = []) {
  const role = String(req.user?.role || '').toLowerCase();
  return allowedRoles.includes(role);
}

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ===== OWNER SDM ROUTES (READ-ONLY) =====

// Get all divisions (read-only for owner)
router.get('/divisi', async (req, res) => {
  try {
    if (!hasRole(req, ['owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const { page = 1, limit = 50, search, status_aktif } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { nama_divisi: { [Op.like]: searchTerm } },
        { keterangan: { [Op.like]: searchTerm } }
      ];
    }

    if (status_aktif !== undefined) {
      whereClause.status_aktif = status_aktif === 'true';
    }

    const divisi = await SdmDivisi.findAndCountAll({
      where: {
        ...whereClause,
        status_deleted: false
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'nama', 'username']
        },
        {
          model: User,
          as: 'deleter',
          attributes: ['id', 'nama', 'username']
        }
      ],
      order: [['nama_divisi', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: divisi.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(divisi.count / limit),
        totalItems: divisi.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching divisions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all positions (read-only for owner)
router.get('/jabatan', async (req, res) => {
  try {
    if (!hasRole(req, ['owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const { page = 1, limit = 50, search, divisi_id, status_aktif } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { nama_jabatan: { [Op.like]: searchTerm } },
        { keterangan: { [Op.like]: searchTerm } }
      ];
    }

    if (divisi_id && divisi_id !== 'all') {
      whereClause.divisi_id = divisi_id;
    }

    if (status_aktif !== undefined) {
      whereClause.status_aktif = status_aktif === 'true';
    }

    const jabatan = await SdmJabatan.findAndCountAll({
      where: {
        ...whereClause,
        status_deleted: false
      },
      include: [
        {
          model: SdmDivisi,
          as: 'divisi',
          attributes: ['id', 'nama_divisi']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'nama', 'username']
        },
        {
          model: User,
          as: 'deleter',
          attributes: ['id', 'nama', 'username']
        }
      ],
      order: [['nama_jabatan', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: jabatan.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(jabatan.count / limit),
        totalItems: jabatan.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all employees (read-only for owner)
router.get('/employees', async (req, res) => {
  try {
    if (!hasRole(req, ['owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const { page = 1, limit = 50, search, divisi_id, jabatan_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { nama: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { no_hp: { [Op.like]: searchTerm } }
      ];
    }

    if (jabatan_id && jabatan_id !== 'all') {
      whereClause.jabatan_id = jabatan_id;
    }

    const employees = await SdmData.findAndCountAll({
      where: {
        ...whereClause,
        status_deleted: false
      },
      include: [
        {
          model: SdmJabatan,
          as: 'jabatan',
          attributes: ['id', 'nama_jabatan'],
          include: [
            {
              model: SdmDivisi,
              as: 'divisi',
              attributes: ['id', 'nama_divisi']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'username', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'nama', 'username']
        },
        {
          model: User,
          as: 'deleter',
          attributes: ['id', 'nama', 'username']
        }
      ],
      order: [['nama', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Filter by divisi_id if provided
    let filteredEmployees = employees.rows;
    if (divisi_id && divisi_id !== 'all') {
      filteredEmployees = employees.rows.filter(emp => 
        emp.jabatan && emp.jabatan.divisi && emp.jabatan.divisi.id == divisi_id
      );
    }

    res.json({
      success: true,
      data: filteredEmployees,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(employees.count / limit),
        totalItems: employees.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get hierarchy data for frontend (read-only for owner)
router.get('/hierarchy', async (req, res) => {
  try {
    if (!hasRole(req, ['owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    // Get all divisions with their positions and employees
    const divisions = await SdmDivisi.findAll({
      where: { status_aktif: true },
      include: [
        {
          model: SdmJabatan,
          as: 'jabatans',
          where: { status_aktif: true },
          required: false,
          include: [
            {
              model: SdmData,
              as: 'employees',
              where: { status_deleted: false },
              required: false,
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'nama', 'username', 'email', 'training_dasar', 'training_leadership', 'training_skill', 'training_lanjutan']
                }
              ]
            }
          ]
        }
      ],
      order: [['nama_divisi', 'ASC']]
    });

    // Transform data to match frontend structure
    const hierarchyData = divisions.map(divisi => ({
      id: divisi.id,
      name: divisi.nama_divisi,
      type: 'parent',
      expanded: false,
      children: divisi.jabatans.map(jabatan => ({
        id: jabatan.id,
        name: jabatan.nama_jabatan,
        type: 'child',
        parentId: divisi.id,
        expanded: false,
        children: jabatan.employees.map(employee => ({
          id: employee.id,
          name: employee.nama,
          type: 'employee',
          parentId: jabatan.id,
          // Include all employee data with relations
          ...employee.toJSON(),
          // Add jabatan and divisi info for easy access
          jabatan: {
            id: jabatan.id,
            nama_jabatan: jabatan.nama_jabatan,
            divisi: {
              id: divisi.id,
              nama_divisi: divisi.nama_divisi
            }
          }
        }))
      }))
    }));

    res.json({
      success: true,
      data: hierarchyData
    });
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get employee by ID (read-only for owner)
router.get('/employees/:id', async (req, res) => {
  try {
    if (!hasRole(req, ['owner'])) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

    const { id } = req.params;

    const employee = await SdmData.findOne({
      where: {
        id: id,
        status_deleted: false
      },
      include: [
        {
          model: SdmJabatan,
          as: 'jabatan',
          attributes: ['id', 'nama_jabatan'],
          include: [
            {
              model: SdmDivisi,
              as: 'divisi',
              attributes: ['id', 'nama_divisi']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'username', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nama', 'username']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'nama', 'username']
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
