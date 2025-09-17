const { SdmDivisi, JobdeskDepartment, JobdeskPosition, SdmData, SdmJabatan } = require('../models');

// Get all divisions (from SdmDivisi)
const getAllDivisions = async (req, res) => {
  try {
    const divisions = await SdmDivisi.findAll({
      where: { status_aktif: true },
      order: [['nama_divisi', 'ASC']]
    });

    // Convert status_aktif to status for frontend
    const divisionsWithStatus = divisions.map(division => ({
      ...division.toJSON(),
      status: division.status_aktif ? 0 : 1 // 0 = aktif, 1 = nonaktif
    }));

    res.json({
      success: true,
      data: divisionsWithStatus
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

// Get departments by division
const getDepartmentsByDivision = async (req, res) => {
  try {
    const { divisiId } = req.params;

    const departments = await JobdeskDepartment.findAll({
      where: { 
        divisi_id: divisiId,
        status_aktif: true 
      },
      order: [['nama_department', 'ASC']]
    });

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data department',
      error: error.message
    });
  }
};

// Get positions by department
const getPositionsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const positions = await JobdeskPosition.findAll({
      where: { 
        department_id: departmentId,
        status_aktif: true 
      },
      order: [['nama_position', 'ASC']]
    });

    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error getting positions:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data posisi',
      error: error.message
    });
  }
};

// Get complete jobdesk structure
const getCompleteJobdeskStructure = async (req, res) => {
  try {
    console.log('🔍 ===== BACKEND JOBDESK API CALLED =====');
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);
    
    const divisions = await SdmDivisi.findAll({
      where: { status_aktif: true },
      include: [
        {
          model: JobdeskDepartment,
          as: 'jobdeskDepartments',
          where: { status_aktif: true },
          required: false,
          include: [
            {
              model: JobdeskPosition,
              as: 'positions',
              where: { status_aktif: true },
              required: false
            }
          ]
        }
      ],
      order: [
        ['nama_divisi', 'ASC'],
        [{ model: JobdeskDepartment, as: 'jobdeskDepartments' }, 'nama_department', 'ASC'],
        [{ model: JobdeskDepartment, as: 'jobdeskDepartments' }, { model: JobdeskPosition, as: 'positions' }, 'nama_position', 'ASC']
      ]
    });

    // Convert status_aktif to status for frontend
    const divisionsWithStatus = divisions.map(division => {
      const divisionData = division.toJSON();
      divisionData.status = division.status_aktif ? 0 : 1; // 0 = aktif, 1 = nonaktif
      
      if (divisionData.jobdeskDepartments) {
        divisionData.departments = divisionData.jobdeskDepartments.map(dept => {
          dept.status = dept.status_aktif ? 0 : 1; // 0 = aktif, 1 = nonaktif
          
          if (dept.positions) {
            dept.positions = dept.positions.map(pos => {
              pos.status = pos.status_aktif ? 0 : 1; // 0 = aktif, 1 = nonaktif
              return pos;
            });
          }
          return dept;
        });
      }
      
      return divisionData;
    });

    console.log('📦 Found divisions:', divisionsWithStatus.length);
    console.log('📦 Divisions data:', JSON.stringify(divisionsWithStatus, null, 2));

    res.json({
      success: true,
      data: divisionsWithStatus
    });
  } catch (error) {
    console.error('❌ Error getting complete jobdesk structure:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil struktur jobdesk lengkap',
      error: error.message
    });
  }
};


// Create department
const createDepartment = async (req, res) => {
  try {
    const { divisi_id, nama_department, keterangan, status } = req.body;
    const created_by = req.user.id;

    // Convert status: 0 = true (aktif), 1 = false (nonaktif)
    const status_aktif = status === 0 ? true : false;

    const department = await JobdeskDepartment.create({
      divisi_id,
      nama_department,
      keterangan,
      status_aktif,
      created_by
    });

    res.status(201).json({
      success: true,
      message: 'Department berhasil dibuat',
      data: department
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat department',
      error: error.message
    });
  }
};

// Create position
const createPosition = async (req, res) => {
  try {
    const { department_id, nama_position, keterangan, status } = req.body;
    const created_by = req.user.id;

    // Convert status: 0 = true (aktif), 1 = false (nonaktif)
    const status_aktif = status === 0 ? true : false;

    const position = await JobdeskPosition.create({
      department_id,
      nama_position,
      keterangan,
      status_aktif,
      created_by
    });

    res.status(201).json({
      success: true,
      message: 'Posisi berhasil dibuat',
      data: position
    });
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat posisi',
      error: error.message
    });
  }
};


// Update department
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { divisi_id, nama_department, keterangan, status } = req.body;
    const updated_by = req.user.id;

    const department = await JobdeskDepartment.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department tidak ditemukan'
      });
    }

    // Convert status: 0 = true (aktif), 1 = false (nonaktif)
    const status_aktif = status === 0 ? true : false;

    await department.update({
      divisi_id,
      nama_department,
      keterangan,
      status_aktif,
      updated_by
    });

    res.json({
      success: true,
      message: 'Department berhasil diupdate',
      data: department
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate department',
      error: error.message
    });
  }
};

// Update position
const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id, nama_position, keterangan, status } = req.body;
    const updated_by = req.user.id;

    const position = await JobdeskPosition.findByPk(id);
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Posisi tidak ditemukan'
      });
    }

    // Convert status: 0 = true (aktif), 1 = false (nonaktif)
    const status_aktif = status === 0 ? true : false;

    await position.update({
      department_id,
      nama_position,
      keterangan,
      status_aktif,
      updated_by
    });

    res.json({
      success: true,
      message: 'Posisi berhasil diupdate',
      data: position
    });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate posisi',
      error: error.message
    });
  }
};


// Soft delete department
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user.id;

    const department = await JobdeskDepartment.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department tidak ditemukan'
      });
    }

    await department.update({
      status_aktif: false,
      updated_by
    });

    res.json({
      success: true,
      message: 'Department berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus department',
      error: error.message
    });
  }
};

// Soft delete position
const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user.id;

    const position = await JobdeskPosition.findByPk(id);
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Posisi tidak ditemukan'
      });
    }

    await position.update({
      status_aktif: false,
      updated_by
    });

    res.json({
      success: true,
      message: 'Posisi berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus posisi',
      error: error.message
    });
  }
};

// Get jobdesk structure based on user's division
const getUserJobdeskStructure = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    
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
          where: { status_deleted: false },
          required: true,
          include: [
            {
              model: SdmDivisi,
              as: 'divisi',
              where: { status_deleted: false },
              required: true
            }
          ]
        }
      ]
    });

    if (!sdmData) {
      return res.status(404).json({
        success: false,
        message: 'Data SDM tidak ditemukan untuk user ini'
      });
    }

    const userDivisiId = sdmData.jabatan.divisi.id;
    const userDivisiName = sdmData.jabatan.divisi.nama_divisi;

    // Get jobdesk departments for user's division
    const jobdeskDepartments = await JobdeskDepartment.findAll({
      where: { 
        divisi_id: userDivisiId,
        status_aktif: true 
      },
      include: [
        {
          model: JobdeskPosition,
          as: 'positions',
          where: { status_aktif: true },
          required: false
        }
      ],
      order: [
        ['nama_department', 'ASC'],
        [{ model: JobdeskPosition, as: 'positions' }, 'nama_position', 'ASC']
      ]
    });

    // Transform data to match frontend structure
    const transformedData = {
      user: {
        id: userId,
        nama: sdmData.nama,
        jabatan: sdmData.jabatan.nama_jabatan,
        divisi: userDivisiName
      },
      divisi: {
        id: userDivisiId,
        nama: userDivisiName
      },
      departments: jobdeskDepartments.map(dept => ({
        id: dept.id,
        nama: dept.nama_department,
        keterangan: dept.keterangan,
        positions: dept.positions?.map(pos => ({
          id: pos.id,
          nama: pos.nama_position,
          keterangan: pos.keterangan
        })) || []
      }))
    };

    res.json({
      success: true,
      message: 'Data jobdesk berdasarkan divisi user berhasil diambil',
      data: transformedData
    });

  } catch (error) {
    console.error('Error getting user jobdesk structure:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data jobdesk user',
      error: error.message
    });
  }
};

module.exports = {
  getAllDivisions,
  getDepartmentsByDivision,
  getPositionsByDepartment,
  getCompleteJobdeskStructure,
  getUserJobdeskStructure,
  createDepartment,
  createPosition,
  updateDepartment,
  updatePosition,
  deleteDepartment,
  deletePosition
};
