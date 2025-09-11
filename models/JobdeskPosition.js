const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobdeskPosition = sequelize.define('JobdeskPosition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID department',
    references: {
      model: 'jobdesk_departments',
      key: 'id'
    }
  },
  nama_position: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama posisi/jabatan'
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Keterangan posisi'
  },
  status_aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Status aktif posisi'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID admin yang menginput',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID admin yang mengupdate',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'jobdesk_positions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['department_id']
    },
    {
      fields: ['nama_position']
    },
    {
      fields: ['status_aktif']
    },
    {
      fields: ['created_by']
    }
  ]
});

module.exports = JobdeskPosition;
