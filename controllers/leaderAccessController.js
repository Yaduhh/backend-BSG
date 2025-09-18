const { LeaderDivisi, User, SdmDivisi } = require('../models');

// Get all leaders with their divisi access
const getAllLeaders = async (req, res) => {
  try {
    const leaders = await User.findAll({
      where: {
        role: 'leader',
        status_deleted: false
      },
      include: [
        {
          model: LeaderDivisi,
          as: 'leaderDivisis',
          where: {
            status_aktif: true
          },
          required: false,
          include: [
            {
              model: SdmDivisi,
              as: 'divisi',
              where: {
                status_aktif: true,
                status_deleted: false
              },
              required: false
            }
          ]
        }
      ],
      order: [['nama', 'ASC']]
    });

    // Transform data to include divisis array
    const transformedLeaders = leaders.map(leader => ({
      id: leader.id,
      nama: leader.nama,
      email: leader.email,
      role: leader.role,
      divisis: leader.leaderDivisis?.map(ld => ld.divisi).filter(Boolean) || []
    }));

    res.json({
      success: true,
      data: transformedLeaders
    });
  } catch (error) {
    console.error('Error fetching leaders:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data leaders'
    });
  }
};

// Get all divisis
const getAllDivisis = async (req, res) => {
  try {
    const divisis = await SdmDivisi.findAll({
      where: {
        status_aktif: true,
        status_deleted: false
      },
      order: [['nama_divisi', 'ASC']]
    });

    res.json({
      success: true,
      data: divisis
    });
  } catch (error) {
    console.error('Error fetching divisis:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data divisis'
    });
  }
};

// Create leader access
const createLeaderAccess = async (req, res) => {
  try {
    const { id_user, divisis } = req.body;

    // Validate required fields
    if (!id_user || !divisis || !Array.isArray(divisis)) {
      return res.status(400).json({
        success: false,
        message: 'ID user dan divisis harus diisi'
      });
    }

    // Check if user exists and is a leader
    const user = await User.findByPk(id_user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (user.role !== 'leader') {
      return res.status(400).json({
        success: false,
        message: 'User harus memiliki role leader'
      });
    }

    // Check if divisis exist
    const divisiRecords = await SdmDivisi.findAll({
      where: {
        id: divisis,
        status_aktif: true,
        status_deleted: false
      }
    });

    if (divisiRecords.length !== divisis.length) {
      return res.status(400).json({
        success: false,
        message: 'Beberapa divisi tidak ditemukan atau tidak aktif'
      });
    }

    // Delete existing leader access for this user (hard delete)
    await LeaderDivisi.destroy({
      where: {
        id_user: id_user
      }
    });

    // Create new leader access records
    const leaderAccessRecords = divisis.map(divisiId => ({
      id_user: id_user,
      id_divisi: divisiId,
      created_by: req.user.id,
      status_aktif: true,
      status_deleted: false
    }));

    await LeaderDivisi.bulkCreate(leaderAccessRecords);

    res.status(201).json({
      success: true,
      message: 'Akses leader berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating leader access:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat akses leader'
    });
  }
};

// Update leader access
const updateLeaderAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user, divisis } = req.body;

    // Validate required fields
    if (!id_user || !divisis || !Array.isArray(divisis)) {
      return res.status(400).json({
        success: false,
        message: 'ID user dan divisis harus diisi'
      });
    }

    // Check if user exists and is a leader
    const user = await User.findByPk(id_user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (user.role !== 'leader') {
      return res.status(400).json({
        success: false,
        message: 'User harus memiliki role leader'
      });
    }

    // Check if divisis exist
    const divisiRecords = await SdmDivisi.findAll({
      where: {
        id: divisis,
        status_aktif: true,
        status_deleted: false
      }
    });

    if (divisiRecords.length !== divisis.length) {
      return res.status(400).json({
        success: false,
        message: 'Beberapa divisi tidak ditemukan atau tidak aktif'
      });
    }

    // Delete existing leader access for this user (hard delete)
    await LeaderDivisi.destroy({
      where: {
        id_user: id_user
      }
    });

    // Create new leader access records
    const leaderAccessRecords = divisis.map(divisiId => ({
      id_user: id_user,
      id_divisi: divisiId,
      created_by: req.user.id,
      status_aktif: true,
      status_deleted: false
    }));

    await LeaderDivisi.bulkCreate(leaderAccessRecords);

    res.json({
      success: true,
      message: 'Akses leader berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating leader access:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui akses leader'
    });
  }
};

// Delete leader access
const deleteLeaderAccess = async (req, res) => {
  try {
    const { id } = req.params;

    // Find leader access
    const leaderAccess = await LeaderDivisi.findByPk(id);

    if (!leaderAccess) {
      return res.status(404).json({
        success: false,
        message: 'Akses leader tidak ditemukan'
      });
    }

    // Hard delete
    await leaderAccess.destroy();

    res.json({
      success: true,
      message: 'Akses leader berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting leader access:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus akses leader'
    });
  }
};

// Get leader access by user ID
const getLeaderAccessByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const leaderAccess = await LeaderDivisi.findAll({
      where: {
        id_user: userId,
        status_aktif: true
      },
      include: [
        {
          model: SdmDivisi,
          as: 'divisi',
          where: {
            status_aktif: true,
            status_deleted: false
          },
          required: true
        }
      ],
      order: [[{ model: SdmDivisi, as: 'divisi' }, 'nama_divisi', 'ASC']]
    });

    res.json({
      success: true,
      data: leaderAccess
    });
  } catch (error) {
    console.error('Error fetching leader access by user:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data akses leader'
    });
  }
};

// Get leader access by divisi ID
const getLeaderAccessByDivisiId = async (req, res) => {
  try {
    const { divisiId } = req.params;

    const leaderAccess = await LeaderDivisi.findAll({
      where: {
        id_divisi: divisiId,
        status_aktif: true
      },
      include: [
        {
          model: User,
          as: 'user',
          where: {
            role: 'leader',
            status_deleted: false
          },
          required: true
        }
      ],
      order: [[{ model: User, as: 'user' }, 'nama', 'ASC']]
    });

    res.json({
      success: true,
      data: leaderAccess
    });
  } catch (error) {
    console.error('Error fetching leader access by divisi:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data akses leader'
    });
  }
};

module.exports = {
  getAllLeaders,
  getAllDivisis,
  createLeaderAccess,
  updateLeaderAccess,
  deleteLeaderAccess,
  getLeaderAccessByUserId,
  getLeaderAccessByDivisiId
};
