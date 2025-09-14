const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { SdmDivisi, SdmJabatan, SdmData, User } = require('../models');

// Get all divisi
router.get('/', authenticateToken, async (req, res) => {
  try {
    const divisi = await SdmDivisi.findAll({
      where: {
        status_deleted: false,
        status_aktif: true
      },
      order: [['nama_divisi', 'ASC']]
    });

    res.json({
      success: true,
      data: divisi
    });
  } catch (error) {
    console.error('Error fetching divisi:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data divisi'
    });
  }
});

// Get divisi by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const divisi = await SdmDivisi.findByPk(id, {
      where: {
        status_deleted: false,
        status_aktif: true
      },
      include: [
        {
          model: SdmJabatan,
          as: 'jabatans',
          where: {
            status_deleted: false,
            status_aktif: true
          },
          required: false
        }
      ]
    });

    if (!divisi) {
      return res.status(404).json({
        success: false,
        message: 'Divisi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: divisi
    });
  } catch (error) {
    console.error('Error fetching divisi by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data divisi'
    });
  }
});

// Get user divisi info
router.get('/user/:userId/divisi-info', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user's SDM data
    const sdmData = await SdmData.findOne({
      where: {
        user_id: userId,
        status_deleted: false
      },
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

    if (!sdmData) {
      return res.json({
        success: true,
        data: {
          divisi: null,
          jabatan: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        divisi: sdmData.jabatan?.divisi || null,
        jabatan: sdmData.jabatan || null
      }
    });
  } catch (error) {
    console.error('Error fetching user divisi info:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data divisi user'
    });
  }
});

module.exports = router;
