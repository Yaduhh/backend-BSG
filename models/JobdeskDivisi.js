const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobdeskDivisi = sequelize.define('JobdeskDivisi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_divisi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama divisi untuk jobdesk'
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Keterangan divisi'
  },
  status_aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Status aktif divisi'
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
  tableName: 'jobdesk_divisi',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['nama_divisi']
    },
    {
      fields: ['status_aktif']
    },
    {
      fields: ['created_by']
    }
  ]
});

module.exports = JobdeskDivisi;
