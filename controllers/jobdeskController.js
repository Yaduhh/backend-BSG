const { JobdeskDivisi, JobdeskDepartment, JobdeskPosition } = require('../models');

// Get all divisions
const getAllDivisions = async (req, res) => {
  try {
    const divisions = await JobdeskDivisi.findAll({
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
    
    const divisions = await JobdeskDivisi.findAll({
      include: [
        {
          model: JobdeskDepartment,
          as: 'departments',
          required: false,
          include: [
            {
              model: JobdeskPosition,
              as: 'positions',
              required: false
            }
          ]
        }
      ],
      order: [
        ['nama_divisi', 'ASC'],
        [{ model: JobdeskDepartment, as: 'departments' }, 'nama_department', 'ASC'],
        [{ model: JobdeskDepartment, as: 'departments' }, { model: JobdeskPosition, as: 'positions' }, 'nama_position', 'ASC']
      ]
    });

    // Convert status_aktif to status for frontend
    const divisionsWithStatus = divisions.map(division => {
      const divisionData = division.toJSON();
      divisionData.status = division.status_aktif ? 0 : 1; // 0 = aktif, 1 = nonaktif
      
      if (divisionData.departments) {
        divisionData.departments = divisionData.departments.map(dept => {
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

// Create division
const createDivision = async (req, res) => {
  try {
    const { nama_divisi, keterangan, status } = req.body;
    const created_by = req.user.id;

    // Convert status: 0 = true (aktif), 1 = false (nonaktif)
    const status_aktif = status === 0 ? true : false;

    const division = await JobdeskDivisi.create({
      nama_divisi,
      keterangan,
      status_aktif,
      created_by
    });

    res.status(201).json({
      success: true,
      message: 'Divisi berhasil dibuat',
      data: division
    });
  } catch (error) {
    console.error('Error creating division:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat divisi',
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

// Update division
const updateDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_divisi, keterangan, status } = req.body;
    const updated_by = req.user.id;

    const division = await JobdeskDivisi.findByPk(id);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Divisi tidak ditemukan'
      });
    }

    // Convert status: 0 = true (aktif), 1 = false (nonaktif)
    const status_aktif = status === 0 ? true : false;

    await division.update({
      nama_divisi,
      keterangan,
      status_aktif,
      updated_by
    });

    res.json({
      success: true,
      message: 'Divisi berhasil diupdate',
      data: division
    });
  } catch (error) {
    console.error('Error updating division:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate divisi',
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

// Soft delete division
const deleteDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user.id;

    const division = await JobdeskDivisi.findByPk(id);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Divisi tidak ditemukan'
      });
    }

    await division.update({
      status_aktif: false,
      updated_by
    });

    res.json({
      success: true,
      message: 'Divisi berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting division:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus divisi',
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

module.exports = {
  getAllDivisions,
  getDepartmentsByDivision,
  getPositionsByDepartment,
  getCompleteJobdeskStructure,
  createDivision,
  createDepartment,
  createPosition,
  updateDivision,
  updateDepartment,
  updatePosition,
  deleteDivision,
  deleteDepartment,
  deletePosition
};
