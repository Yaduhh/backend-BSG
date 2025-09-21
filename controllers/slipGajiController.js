const { SlipGaji, User, SdmData, SdmJabatan, SdmDivisi } = require('../models');
const { Op } = require('sequelize');

const slipGajiController = {
  // Get all slip gaji (admin only)
  getAllSlipGaji: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', user_id = '' } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = { status_deleted: false };
      
      // Filter by user if specified
      if (user_id) {
        whereClause.id_user = user_id;
      }

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { keterangan: { [Op.like]: `%${search}%` } },
          { '$user.nama$': { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: slipGajiList } = await SlipGaji.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nama', 'username', 'email', 'nib'],
            include: [
              {
                model: SdmData,
                as: 'sdmDataUser',
                attributes: ['id', 'user_id', 'jabatan_id'],
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
                  }
                ]
              }
            ]
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'nama', 'username']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: slipGajiList,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching slip gaji:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data slip gaji',
        error: error.message
      });
    }
  },

  // Get slip gaji by ID
  getSlipGajiById: async (req, res) => {
    try {
      const { id } = req.params;

      const slipGaji = await SlipGaji.findOne({
        where: { 
          id: id,
          status_deleted: false 
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nama', 'username', 'email', 'nib'],
            include: [
              {
                model: SdmData,
                as: 'sdmDataUser',
                attributes: ['id', 'user_id', 'jabatan_id'],
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
                  }
                ]
              }
            ]
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'nama', 'username']
          }
        ]
      });

      if (!slipGaji) {
        return res.status(404).json({
          success: false,
          message: 'Slip gaji tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: slipGaji
      });
    } catch (error) {
      console.error('Error fetching slip gaji by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data slip gaji',
        error: error.message
      });
    }
  },

  // Create new slip gaji
  createSlipGaji: async (req, res) => {
    try {
      const { lampiran_foto, keterangan, id_user } = req.body;
      const created_by = req.user.id;

      // Validation
      if (!lampiran_foto || !id_user) {
        return res.status(400).json({
          success: false,
          message: 'Lampiran foto dan ID user harus diisi'
        });
      }

      // Check if user exists
      const user = await User.findByPk(id_user);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      const slipGaji = await SlipGaji.create({
        lampiran_foto,
        keterangan: keterangan || null,
        id_user,
        created_by
      });

      // Fetch created slip gaji with relations
      const createdSlipGaji = await SlipGaji.findByPk(slipGaji.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nama', 'username', 'email', 'nib']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'nama', 'username']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Slip gaji berhasil dibuat',
        data: createdSlipGaji
      });
    } catch (error) {
      console.error('Error creating slip gaji:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat slip gaji',
        error: error.message
      });
    }
  },

  // Update slip gaji
  updateSlipGaji: async (req, res) => {
    try {
      const { id } = req.params;
      const { lampiran_foto, keterangan } = req.body;

      const slipGaji = await SlipGaji.findOne({
        where: { 
          id: id,
          status_deleted: false 
        }
      });

      if (!slipGaji) {
        return res.status(404).json({
          success: false,
          message: 'Slip gaji tidak ditemukan'
        });
      }

      // Update fields
      if (lampiran_foto) slipGaji.lampiran_foto = lampiran_foto;
      if (keterangan !== undefined) slipGaji.keterangan = keterangan;

      await slipGaji.save();

      // Fetch updated slip gaji with relations
      const updatedSlipGaji = await SlipGaji.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nama', 'username', 'email', 'nib']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'nama', 'username']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Slip gaji berhasil diperbarui',
        data: updatedSlipGaji
      });
    } catch (error) {
      console.error('Error updating slip gaji:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui slip gaji',
        error: error.message
      });
    }
  },

  // Soft delete slip gaji
  deleteSlipGaji: async (req, res) => {
    try {
      const { id } = req.params;

      const slipGaji = await SlipGaji.findOne({
        where: { 
          id: id,
          status_deleted: false 
        }
      });

      if (!slipGaji) {
        return res.status(404).json({
          success: false,
          message: 'Slip gaji tidak ditemukan'
        });
      }

      slipGaji.status_deleted = true;
      await slipGaji.save();

      res.json({
        success: true,
        message: 'Slip gaji berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting slip gaji:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus slip gaji',
        error: error.message
      });
    }
  },

  // Get slip gaji by user (for user's own slip gaji)
  getSlipGajiByUser: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: slipGajiList } = await SlipGaji.findAndCountAll({
        where: { 
          id_user: userId,
          status_deleted: false 
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'nama', 'username']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: slipGajiList,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching user slip gaji:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data slip gaji',
        error: error.message
      });
    }
  }
};

module.exports = slipGajiController;