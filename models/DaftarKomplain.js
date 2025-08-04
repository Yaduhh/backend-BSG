const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DaftarKomplain = sequelize.define('DaftarKomplain', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  judul_komplain: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deskripsi_komplain: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  kategori: {
    type: DataTypes.ENUM('sistem', 'layanan', 'produk', 'lainnya'),
    allowNull: false,
    defaultValue: 'lainnya'
  },
  prioritas: {
    type: DataTypes.ENUM('mendesak', 'penting', 'berproses'),
    allowNull: false,
    defaultValue: 'berproses'
  },
  status: {
    type: DataTypes.ENUM('menunggu', 'diproses', 'selesai', 'ditolak'),
    allowNull: false,
    defaultValue: 'menunggu'
  },
  pelapor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  penerima_komplain_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  pihak_terkait: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of user IDs yang terkait dengan komplain'
  },
  lampiran: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of file paths untuk lampiran'
  },
  tanggal_pelaporan: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  target_selesai: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tanggal_selesai: {
    type: DataTypes.DATE,
    allowNull: true
  },
  catatan_admin: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating_kepuasan: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  komentar_kepuasan: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'daftar_komplain',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DaftarKomplain; 