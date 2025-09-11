const express = require('express');
const router = express.Router();
const { SdmDivisi, SdmJabatan, SdmData, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// ===== OWNER SDM ROUTES (READ-ONLY) =====

// Get hierarchy data for owner (read-only)
router.get('/hierarchy', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner only.'
      });
    }

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
                  attributes: ['id', 'nama', 'username', 'email']
                }
              ]
            }
          ]
        }
      ],
      order: [['nama_divisi', 'ASC']]
    });

    const hierarchyData = divisions.map(divisi => ({
      id: divisi.id,
      name: divisi.nama_divisi,
      type: 'parent',
      expanded: false,
      children: (divisi.jabatans || []).map(jabatan => ({
        id: jabatan.id,
        name: jabatan.nama_jabatan,
        type: 'child',
        parentId: divisi.id,
        expanded: false,
        children: (jabatan.employees || []).map(employee => ({
          id: employee.id,
          name: employee.nama,
          type: 'employee',
          parentId: jabatan.id,
          ...employee.toJSON(),
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
    console.error('Error fetching owner hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
