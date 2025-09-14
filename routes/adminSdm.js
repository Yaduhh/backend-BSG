const express = require('express');
const router = express.Router();
const { SdmDivisi, SdmJabatan, SdmData, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// ===== SDM DIVISI ROUTES =====

// Get all divisions
router.get('/divisi', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
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

// Create new division
router.post('/divisi', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { nama_divisi, keterangan, status_aktif = true } = req.body;

    if (!nama_divisi || nama_divisi.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nama divisi is required'
      });
    }

    // Check if division name already exists
    const existingDivisi = await SdmDivisi.findOne({
      where: { nama_divisi: nama_divisi.trim() }
    });

    if (existingDivisi) {
      return res.status(400).json({
        success: false,
        message: 'Nama divisi sudah ada'
      });
    }

    const newDivisi = await SdmDivisi.create({
      nama_divisi: nama_divisi.trim(),
      keterangan: keterangan || null,
      status_aktif,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Divisi berhasil dibuat',
      data: newDivisi
    });
  } catch (error) {
    console.error('Error creating division:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update division
router.put('/divisi/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const { nama_divisi, keterangan, status_aktif } = req.body;

    const divisi = await SdmDivisi.findByPk(id);
    if (!divisi) {
      return res.status(404).json({
        success: false,
        message: 'Divisi tidak ditemukan'
      });
    }

    // Check if new name conflicts with existing division
    if (nama_divisi && nama_divisi.trim() !== divisi.nama_divisi) {
      const existingDivisi = await SdmDivisi.findOne({
        where: { 
          nama_divisi: nama_divisi.trim(),
          id: { [Op.ne]: id }
        }
      });

      if (existingDivisi) {
        return res.status(400).json({
          success: false,
          message: 'Nama divisi sudah ada'
        });
      }
    }

    await divisi.update({
      nama_divisi: nama_divisi || divisi.nama_divisi,
      keterangan: keterangan !== undefined ? keterangan : divisi.keterangan,
      status_aktif: status_aktif !== undefined ? status_aktif : divisi.status_aktif,
      updated_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Divisi berhasil diupdate',
      data: divisi
    });
  } catch (error) {
    console.error('Error updating division:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete division (soft delete)
router.delete('/divisi/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;

    // Cek apakah divisi ada dan belum dihapus
    const divisi = await SdmDivisi.findOne({
      where: {
        id: id,
        status_deleted: false
      }
    });

    if (!divisi) {
      return res.status(404).json({
        success: false,
        message: 'Divisi tidak ditemukan'
      });
    }

    // Check if division has active jabatan (not soft deleted)
    const jabatanCount = await SdmJabatan.count({
      where: { 
        divisi_id: id,
        status_deleted: false
      }
    });

    if (jabatanCount > 0) {
      return res.json({
        success: false,
        message: `Divisi masih memiliki ${jabatanCount} jabatan aktif. Silakan hapus atau pindahkan jabatan terlebih dahulu.`
      });
    }

    // Check if any jabatan in this division has active sdm_data (not soft deleted)
    const jabatanList = await SdmJabatan.findAll({
      where: { 
        divisi_id: id,
        status_deleted: false
      },
      attributes: ['id']
    });

    if (jabatanList.length > 0) {
      const jabatanIds = jabatanList.map(j => j.id);
      const sdmDataCount = await SdmData.count({
        where: { 
          jabatan_id: jabatanIds,
          status_deleted: false
        }
      });

      if (sdmDataCount > 0) {
        return res.json({
          success: false,
          message: `Divisi masih memiliki ${sdmDataCount} karyawan aktif. Silakan hapus atau pindahkan karyawan terlebih dahulu.`
        });
      }
    }

    // Soft delete divisi
    await divisi.update({
      status_deleted: true,
      deleted_at: new Date(),
      deleted_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Divisi berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting division:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== SDM JABATAN ROUTES =====

// Get all positions
router.get('/jabatan', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
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

// Create new position
router.post('/jabatan', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { nama_jabatan, divisi_id, keterangan, status_aktif = true } = req.body;

    if (!nama_jabatan || nama_jabatan.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nama jabatan is required'
      });
    }

    if (!divisi_id) {
      return res.status(400).json({
        success: false,
        message: 'Divisi ID is required'
      });
    }

    // Check if division exists
    const divisi = await SdmDivisi.findByPk(divisi_id);
    if (!divisi) {
      return res.status(400).json({
        success: false,
        message: 'Divisi tidak ditemukan'
      });
    }

    // Check if position name already exists in the same division
    const existingJabatan = await SdmJabatan.findOne({
      where: { 
        nama_jabatan: nama_jabatan.trim(),
        divisi_id: divisi_id
      }
    });

    if (existingJabatan) {
      return res.status(400).json({
        success: false,
        message: 'Nama jabatan sudah ada di divisi ini'
      });
    }

    const newJabatan = await SdmJabatan.create({
      nama_jabatan: nama_jabatan.trim(),
      divisi_id,
      keterangan: keterangan || null,
      status_aktif,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Jabatan berhasil dibuat',
      data: newJabatan
    });
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update position
router.put('/jabatan/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const { nama_jabatan, divisi_id, keterangan, status_aktif } = req.body;

    const jabatan = await SdmJabatan.findByPk(id);
    if (!jabatan) {
      return res.status(404).json({
        success: false,
        message: 'Jabatan tidak ditemukan'
      });
    }

    // Check if new name conflicts with existing position in the same division
    if (nama_jabatan && nama_jabatan.trim() !== jabatan.nama_jabatan) {
      const targetDivisiId = divisi_id || jabatan.divisi_id;
      const existingJabatan = await SdmJabatan.findOne({
        where: { 
          nama_jabatan: nama_jabatan.trim(),
          divisi_id: targetDivisiId,
          id: { [Op.ne]: id }
        }
      });

      if (existingJabatan) {
        return res.status(400).json({
          success: false,
          message: 'Nama jabatan sudah ada di divisi ini'
        });
      }
    }

    await jabatan.update({
      nama_jabatan: nama_jabatan || jabatan.nama_jabatan,
      divisi_id: divisi_id || jabatan.divisi_id,
      keterangan: keterangan !== undefined ? keterangan : jabatan.keterangan,
      status_aktif: status_aktif !== undefined ? status_aktif : jabatan.status_aktif,
      updated_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Jabatan berhasil diupdate',
      data: jabatan
    });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete position
router.delete('/jabatan/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;

    // Cek apakah jabatan ada dan belum dihapus
    const jabatan = await SdmJabatan.findOne({
      where: {
        id: id,
        status_deleted: false
      }
    });

    if (!jabatan) {
      return res.status(404).json({
        success: false,
        message: 'Jabatan tidak ditemukan'
      });
    }

    // Check if position has active employees (not soft deleted)
    const employeeCount = await SdmData.count({
      where: { 
        jabatan_id: id,
        status_deleted: false
      }
    });

    if (employeeCount > 0) {
      return res.json({
        success: false,
        message: `Jabatan masih memiliki ${employeeCount} karyawan aktif. Silakan hapus atau pindahkan karyawan terlebih dahulu.`
      });
    }

    // Soft delete jabatan
    await jabatan.update({
      status_deleted: true,
      deleted_at: new Date(),
      deleted_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Jabatan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== SDM DATA ROUTES =====

// Get all employees with hierarchy
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
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

// Get hierarchy data for frontend
router.get('/hierarchy', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
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

// Create new employee
router.post('/employees', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const {
      nama, tempat_lahir, tanggal_lahir, no_hp, email, media_sosial,
      nama_pasangan, nama_anak, no_hp_pasangan, kontak_darurat,
      alamat_sekarang, link_map_sekarang, alamat_asal, link_map_asal,
      nama_orang_tua, alamat_orang_tua, link_map_orang_tua,
      jabatan_id, tanggal_bergabung, lama_bekerja,
      training_dasar, training_skillo, training_leadership, training_lanjutan,
      gaji_pokok, tunjangan_kinerja, tunjangan_posisi, uang_makan, lembur, bonus,
      potongan, bpjstk, bpjs_kesehatan, bpjs_kes_penambahan, sp_1_2, pinjaman_karyawan, pph21,
      user_id
    } = req.body;

    if (!nama || nama.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nama is required'
      });
    }

    if (!jabatan_id) {
      return res.status(400).json({
        success: false,
        message: 'Jabatan ID is required'
      });
    }

    // Check if position exists
    const jabatan = await SdmJabatan.findByPk(jabatan_id);
    if (!jabatan) {
      return res.status(400).json({
        success: false,
        message: 'Jabatan tidak ditemukan'
      });
    }

    // Calculate totals
    const totalGaji = (gaji_pokok || 0) + (tunjangan_kinerja || 0) + (tunjangan_posisi || 0) + (uang_makan || 0) + (lembur || 0) + (bonus || 0);
    const totalPotongan = (potongan || 0) + (bpjstk || 0) + (bpjs_kesehatan || 0) + (bpjs_kes_penambahan || 0) + (sp_1_2 || 0) + (pinjaman_karyawan || 0) + (pph21 || 0);
    const totalGajiDibayarkan = totalGaji - totalPotongan;

    const newEmployee = await SdmData.create({
      nama: nama.trim(),
      tempat_lahir: tempat_lahir || null,
      tanggal_lahir: tanggal_lahir || null,
      no_hp: no_hp || null,
      email: email || null,
      media_sosial: media_sosial || null,
      nama_pasangan: nama_pasangan || null,
      nama_anak: nama_anak || null,
      no_hp_pasangan: no_hp_pasangan || null,
      kontak_darurat: kontak_darurat || null,
      alamat_sekarang: alamat_sekarang || null,
      link_map_sekarang: link_map_sekarang || null,
      alamat_asal: alamat_asal || null,
      link_map_asal: link_map_asal || null,
      nama_orang_tua: nama_orang_tua || null,
      alamat_orang_tua: alamat_orang_tua || null,
      link_map_orang_tua: link_map_orang_tua || null,
      jabatan_id,
      tanggal_bergabung: tanggal_bergabung || null,
      lama_bekerja: lama_bekerja || null,
      training_dasar: training_dasar || false,
      training_skillo: training_skillo || false,
      training_leadership: training_leadership || false,
      training_lanjutan: training_lanjutan || false,
      gaji_pokok: gaji_pokok || 0,
      tunjangan_kinerja: tunjangan_kinerja || 0,
      tunjangan_posisi: tunjangan_posisi || 0,
      uang_makan: uang_makan || 0,
      lembur: lembur || 0,
      bonus: bonus || 0,
      total_gaji: totalGaji,
      potongan: potongan || 0,
      bpjstk: bpjstk || 0,
      bpjs_kesehatan: bpjs_kesehatan || 0,
      bpjs_kes_penambahan: bpjs_kes_penambahan || 0,
      sp_1_2: sp_1_2 || 0,
      pinjaman_karyawan: pinjaman_karyawan || 0,
      pph21: pph21 || 0,
      total_potongan: totalPotongan,
      total_gaji_dibayarkan: totalGajiDibayarkan,
      user_id: user_id || null,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Karyawan berhasil ditambahkan',
      data: newEmployee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update employee
router.put('/employees/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const employee = await SdmData.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Karyawan tidak ditemukan'
      });
    }

    // Calculate totals if gaji data is provided
    if (updateData.gaji_pokok !== undefined || updateData.tunjangan_kinerja !== undefined || 
        updateData.tunjangan_posisi !== undefined || updateData.uang_makan !== undefined || 
        updateData.lembur !== undefined || updateData.bonus !== undefined) {
      
      const gaji_pokok = updateData.gaji_pokok !== undefined ? updateData.gaji_pokok : employee.gaji_pokok;
      const tunjangan_kinerja = updateData.tunjangan_kinerja !== undefined ? updateData.tunjangan_kinerja : employee.tunjangan_kinerja;
      const tunjangan_posisi = updateData.tunjangan_posisi !== undefined ? updateData.tunjangan_posisi : employee.tunjangan_posisi;
      const uang_makan = updateData.uang_makan !== undefined ? updateData.uang_makan : employee.uang_makan;
      const lembur = updateData.lembur !== undefined ? updateData.lembur : employee.lembur;
      const bonus = updateData.bonus !== undefined ? updateData.bonus : employee.bonus;
      
      updateData.total_gaji = gaji_pokok + tunjangan_kinerja + tunjangan_posisi + uang_makan + lembur + bonus;
    }

    if (updateData.potongan !== undefined || updateData.bpjstk !== undefined || 
        updateData.bpjs_kesehatan !== undefined || updateData.bpjs_kes_penambahan !== undefined || 
        updateData.sp_1_2 !== undefined || updateData.pinjaman_karyawan !== undefined || 
        updateData.pph21 !== undefined) {
      
      const potongan = updateData.potongan !== undefined ? updateData.potongan : employee.potongan;
      const bpjstk = updateData.bpjstk !== undefined ? updateData.bpjstk : employee.bpjstk;
      const bpjs_kesehatan = updateData.bpjs_kesehatan !== undefined ? updateData.bpjs_kesehatan : employee.bpjs_kesehatan;
      const bpjs_kes_penambahan = updateData.bpjs_kes_penambahan !== undefined ? updateData.bpjs_kes_penambahan : employee.bpjs_kes_penambahan;
      const sp_1_2 = updateData.sp_1_2 !== undefined ? updateData.sp_1_2 : employee.sp_1_2;
      const pinjaman_karyawan = updateData.pinjaman_karyawan !== undefined ? updateData.pinjaman_karyawan : employee.pinjaman_karyawan;
      const pph21 = updateData.pph21 !== undefined ? updateData.pph21 : employee.pph21;
      
      updateData.total_potongan = potongan + bpjstk + bpjs_kesehatan + bpjs_kes_penambahan + sp_1_2 + pinjaman_karyawan + pph21;
    }

    if (updateData.total_gaji !== undefined && updateData.total_potongan !== undefined) {
      updateData.total_gaji_dibayarkan = updateData.total_gaji - updateData.total_potongan;
    }

    updateData.updated_by = req.user.id;

    await employee.update(updateData);

    res.json({
      success: true,
      message: 'Karyawan berhasil diupdate',
      data: employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete employee
router.delete('/employees/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;

    // Cek apakah employee ada dan belum dihapus
    const employee = await SdmData.findOne({
      where: {
        id: id,
        status_deleted: false
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Karyawan tidak ditemukan'
      });
    }

    // Soft delete employee
    await employee.update({
      status_deleted: true,
      deleted_at: new Date(),
      deleted_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Karyawan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get employee by ID
router.get('/employees/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
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

// ===== SDM DATA BY USER ID ROUTES =====

// Get SDM data by user ID
router.get('/data/user/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { userId } = req.params;

    const sdmData = await SdmData.findOne({
      where: {
        user_id: userId,
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
        }
      ]
    });

    if (!sdmData) {
      return res.status(404).json({
        success: false,
        message: 'Data SDM tidak ditemukan untuk user ini'
      });
    }

    res.json({
      success: true,
      data: sdmData
    });
  } catch (error) {
    console.error('Error fetching SDM data by user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update SDM data by user ID
router.put('/data/user/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { userId } = req.params;
    const updateData = req.body;

    const sdmData = await SdmData.findOne({
      where: {
        user_id: userId,
        status_deleted: false
      }
    });

    if (!sdmData) {
      return res.status(404).json({
        success: false,
        message: 'Data SDM tidak ditemukan untuk user ini'
      });
    }

    // Calculate totals if gaji data is provided
    if (updateData.gaji_pokok !== undefined || updateData.tunjangan_kinerja !== undefined || 
        updateData.tunjangan_posisi !== undefined || updateData.uang_makan !== undefined || 
        updateData.lembur !== undefined || updateData.bonus !== undefined) {
      
      const gaji_pokok = updateData.gaji_pokok !== undefined ? updateData.gaji_pokok : sdmData.gaji_pokok;
      const tunjangan_kinerja = updateData.tunjangan_kinerja !== undefined ? updateData.tunjangan_kinerja : sdmData.tunjangan_kinerja;
      const tunjangan_posisi = updateData.tunjangan_posisi !== undefined ? updateData.tunjangan_posisi : sdmData.tunjangan_posisi;
      const uang_makan = updateData.uang_makan !== undefined ? updateData.uang_makan : sdmData.uang_makan;
      const lembur = updateData.lembur !== undefined ? updateData.lembur : sdmData.lembur;
      const bonus = updateData.bonus !== undefined ? updateData.bonus : sdmData.bonus;
      
      updateData.total_gaji = gaji_pokok + tunjangan_kinerja + tunjangan_posisi + uang_makan + lembur + bonus;
    }

    if (updateData.potongan !== undefined || updateData.bpjstk !== undefined || 
        updateData.bpjs_kesehatan !== undefined || updateData.bpjs_kes_penambahan !== undefined || 
        updateData.sp_1_2 !== undefined || updateData.pinjaman_karyawan !== undefined || 
        updateData.pph21 !== undefined) {
      
      const potongan = updateData.potongan !== undefined ? updateData.potongan : sdmData.potongan;
      const bpjstk = updateData.bpjstk !== undefined ? updateData.bpjstk : sdmData.bpjstk;
      const bpjs_kesehatan = updateData.bpjs_kesehatan !== undefined ? updateData.bpjs_kesehatan : sdmData.bpjs_kesehatan;
      const bpjs_kes_penambahan = updateData.bpjs_kes_penambahan !== undefined ? updateData.bpjs_kes_penambahan : sdmData.bpjs_kes_penambahan;
      const sp_1_2 = updateData.sp_1_2 !== undefined ? updateData.sp_1_2 : sdmData.sp_1_2;
      const pinjaman_karyawan = updateData.pinjaman_karyawan !== undefined ? updateData.pinjaman_karyawan : sdmData.pinjaman_karyawan;
      const pph21 = updateData.pph21 !== undefined ? updateData.pph21 : sdmData.pph21;
      
      updateData.total_potongan = potongan + bpjstk + bpjs_kesehatan + bpjs_kes_penambahan + sp_1_2 + pinjaman_karyawan + pph21;
    }

    if (updateData.total_gaji !== undefined && updateData.total_potongan !== undefined) {
      updateData.total_gaji_dibayarkan = updateData.total_gaji - updateData.total_potongan;
    }

    updateData.updated_by = req.user.id;

    await sdmData.update(updateData);

    res.json({
      success: true,
      message: 'Data SDM berhasil diupdate',
      data: sdmData
    });
  } catch (error) {
    console.error('Error updating SDM data by user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


module.exports = router;
