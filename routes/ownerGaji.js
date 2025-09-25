const express = require('express');
const router = express.Router();
const SdmData = require('../models/SdmData');
const SdmDivisi = require('../models/SdmDivisi');
const SdmJabatan = require('../models/SdmJabatan');
const { authenticateToken } = require('../middleware/auth');

const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Owner only.'
    });
  }
  next();
};

// Get hierarchy data for owner (read-only)
router.get('/hierarchy', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const hierarchy = await SdmData.getHierarchy();
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    console.error('Error fetching owner hierarchy data:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data hierarki' });
  }
});

// Get all employees for owner (read-only)
router.get('/employees', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const employees = await SdmData.findAndCountAll({
      where: search ? {
        [Op.or]: [
          { nama: { [Op.like]: `%${search}%` } },
          { username: { [Op.like]: `%${search}%` } }
        ]
      } : {},
      include: [
        {
          model: SdmJabatan,
          as: 'jabatan',
          include: [
            {
              model: SdmDivisi,
              as: 'divisi'
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.json({ 
      success: true, 
      data: employees.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(employees.count / parseInt(limit)),
        totalItems: employees.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching owner employees:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data karyawan' });
  }
});

// Get employee by ID for owner (read-only)
router.get('/employees/:id', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await SdmData.findByPk(id, {
      include: [
        {
          model: SdmJabatan,
          as: 'jabatan',
          include: [
            {
              model: SdmDivisi,
              as: 'divisi'
            }
          ]
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });
    }
    
    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Error fetching owner employee by ID:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data karyawan' });
  }
});

// Get all divisions for owner (read-only)
router.get('/divisi', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const divisions = await SdmDivisi.findAll({
      order: [['nama_divisi', 'ASC']]
    });
    
    res.json({ success: true, data: divisions });
  } catch (error) {
    console.error('Error fetching owner divisions:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data divisi' });
  }
});

// Get all positions for owner (read-only)
router.get('/jabatan', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const positions = await SdmJabatan.findAll({
      include: [
        {
          model: SdmDivisi,
          as: 'divisi'
        }
      ],
      order: [['nama_jabatan', 'ASC']]
    });
    
    res.json({ success: true, data: positions });
  } catch (error) {
    console.error('Error fetching owner positions:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data jabatan' });
  }
});

module.exports = router;
