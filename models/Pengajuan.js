const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pengajuan = sequelize.define('Pengajuan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  pengajuan: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  nilai: {
    type: DataTypes.DECIMAL(15,2),
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('disetujui', 'tidak_disetujui', 'pending'),
    allowNull: false,
    defaultValue: 'pending',
  },
  // Simpan array username terkait sebagai JSON string
  terkait: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    comment: 'JSON array of usernames yang terkait'
  },
  // Simpan array lampiran sebagai JSON string
  lampiran: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    comment: 'JSON array of attachments: {type,url,name}'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'pengajuan',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Pengajuan;
