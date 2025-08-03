const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DaftarTugas = sequelize.define('DaftarTugas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  pemberi_tugas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID user yang membuat tugas'
  },
  penerima_tugas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID user yang ditugaskan'
  },
  pihak_terkait: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of user IDs yang terlibat dalam tugas'
  },
  skala_prioritas: {
    type: DataTypes.ENUM('mendesak', 'penting', 'berproses'),
    allowNull: false,
    defaultValue: 'berproses',
    comment: 'Skala prioritas tugas'
  },
  target_selesai: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Target waktu selesai tugas'
  },
  keterangan_tugas: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Deskripsi detail tugas'
  },
  lampiran: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of file paths (foto, file, video)'
  },
  status: {
    type: DataTypes.ENUM('belum', 'proses', 'revisi', 'selesai'),
    allowNull: false,
    defaultValue: 'belum',
    comment: 'Status tugas'
  },
  judul_tugas: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Judul tugas'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Rating tugas (1-5)'
  },
  catatan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Catatan tambahan untuk tugas'
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu tugas selesai'
  }
}, {
  tableName: 'daftar_tugas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Association function
DaftarTugas.associate = (models) => {
  // Pemberi tugas
  DaftarTugas.belongsTo(models.User, {
    foreignKey: 'pemberi_tugas',
    as: 'pemberiTugas'
  });

  // Penerima tugas
  DaftarTugas.belongsTo(models.User, {
    foreignKey: 'penerima_tugas',
    as: 'penerimaTugas'
  });
};

module.exports = DaftarTugas; 