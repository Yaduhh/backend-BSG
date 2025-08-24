const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DataTarget = sequelize.define('DataTarget', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_target: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nama target/lokasi (contoh: TEPUNG BOSGIL, BSG PUSAT, dll)'
  },
  target_nominal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Target nominal dalam Rupiah'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID user yang membuat'
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID user yang terakhir update'
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Status soft delete'
  }
}, {
  tableName: 'data_target',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['nama_target']
    },
    {
      fields: ['status_deleted']
    }
  ]
});

module.exports = DataTarget;
